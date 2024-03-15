import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import fs, { ReadStream } from 'fs';
import path from 'path';
import { PrismaService } from './prisma.service';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

@Injectable()
export class FileService {
  private readonly baseDir = process.env.FILE_UPLOAD_DIR!;

  constructor(private prisma: PrismaService) {}

  /**
   * Upload file
   * @param userId User ID
   * @param parentFolderKey Parent folder key
   * @param fileName File name
   * @param chunk Chunk buffer
   * @param chunkNumber Chunk number
   * @param totalChunks Total chunks
   * @returns If file is uploaded successfully, return file key
   */
  async uploadFile(
    userId: number,
    parentFolderKey: string,
    fileName: string,
    chunk: Buffer,
    chunkNumber: number,
    totalChunks: number,
  ): Promise<{ isDone: boolean; fileKey?: string }> {
    const tempFileName = `${parentFolderKey}_${fileName}`;

    if (chunkNumber === 0) {
      // Check if parent folder exists
      const parentFolder = await this.prisma.folders.findUnique({
        where: {
          folder_key: parentFolderKey,
        },
      });
      if (!parentFolder) {
        throw new NotFoundException('Folder does not exist');
      }

      // Check if file already exists
      const existingFile = await this.prisma.files.findFirst({
        where: {
          parent_folder_id: parentFolder.id,
          file_name: fileName,
        },
      });
      if (existingFile) {
        throw new ConflictException('File already exists');
      }

      // Create temp file
      await this.prisma.temp_files
        .create({
          data: {
            uploader_id: userId,
            temp_file_name: tempFileName,
            total_chunks: totalChunks,
          },
        })
        .catch((error) => {
          if (error.code === 'P2002') {
            throw new ConflictException('File already exists');
          }
          throw new InternalServerErrorException('Failed to create file');
        });
    }

    // Upload chunk
    const uploadChunkIsDone = await this.uploadChunk(
      chunk,
      chunkNumber,
      totalChunks,
      tempFileName,
    );

    // If all chunks are uploaded
    if (uploadChunkIsDone) {
      return await this.prisma.$transaction(async (tx) => {
        // Get parent folder
        const parentFolder = await tx.folders.findUnique({
          where: {
            folder_key: parentFolderKey,
          },
        });
        if (!parentFolder) {
          throw new NotFoundException('Folder does not exist');
        }
        // Get temp file
        const tempFile = await tx.temp_files.findUnique({
          where: {
            temp_file_name: tempFileName,
          },
        });
        if (!tempFile) {
          throw new InternalServerErrorException('Failed to find temp file');
        }

        try {
          // Upload file
          const uploadedFile = await tx.files.create({
            data: {
              parent_folder_id: parentFolder.id,
              file_key: tempFile.file_key,
              file_name: fileName,
              enabled: true,
            },
          });
          // Rename real file
          const resourcePath = await this.getResourcePath(
            uploadedFile.file_key,
            uploadedFile.file_name,
          );
          fs.renameSync(path.join(this.baseDir, tempFileName), resourcePath);
          // Get file stats
          const fileStats = fs.statSync(resourcePath);
          // Create file info
          await tx.file_info.create({
            data: {
              file_id: uploadedFile.id,
              uploader_id: userId,
              byte_size: fileStats.size,
            },
          });
          return { isDone: true, fileKey: uploadedFile.file_key };
        } catch (error) {
          throw new InternalServerErrorException('Failed to upload file');
        }
      });
    }
    return { isDone: false };
  }

  /**
   * Download file
   * @param fileKey File key
   * @returns Read Stream of file
   */
  async downloadFile(fileKey: string): Promise<ReadStream> {
    const file = await this.prisma.files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!file) {
      throw new NotFoundException('File does not exist');
    }
    const resourcePath = await this.getResourcePath(
      file.file_key,
      file.file_name,
    );
    if (!fs.existsSync(resourcePath)) {
      this.prisma.files.delete({
        where: {
          file_key: fileKey,
        },
      });
      throw new NotFoundException('File does not exist in storage');
    }
    const fileStream = fs.createReadStream(resourcePath);
    return fileStream;
  }

  /**
   * Stream video with mp4 format
   * @param fileKey File key
   * @returns FfmpegCommand
   */
  async streamVideo(fileKey: string): Promise<FfmpegCommand> {
    const file = await this.prisma.files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!file) {
      throw new NotFoundException('File does not exist');
    }
    // Check if file is video
    if (!file.file_name.match(/\.(mp4|webm|ogg|ogv|avi|mov|flv|wmv|mkv)$/)) {
      throw new UnsupportedMediaTypeException('File is not a video');
    }
    const resourcePath = await this.getResourcePath(
      file.file_key,
      file.file_name,
    );
    if (!fs.existsSync(resourcePath)) {
      this.prisma.files.delete({
        where: {
          file_key: fileKey,
        },
      });
      throw new NotFoundException('File does not exist in storage');
    }

    const fileStream = fs.createReadStream(resourcePath);
    const ffmpegStream = ffmpeg(fileStream)
      .videoCodec('libx264')
      .format('mp4')
      .outputOptions([
        '-movflags frag_keyframe+empty_moov',
        '-frag_duration 5000',
      ])
      .on('error', () => {
        throw new InternalServerErrorException('Failed to convert file');
      });
    return ffmpegStream;
  }

  /**
   * Get resource path
   * @param fileKey File key
   * @param fileName File name
   * @returns Resource path
   */
  private async getResourcePath(
    fileKey: string,
    fileName: string,
  ): Promise<string> {
    return path.join(this.baseDir, fileKey + path.extname(fileName));
  }

  /**
   * Merge chunks
   * @param fileName File name
   * @param totalChunks # of total chunks
   */
  private async mergeChunks(
    fileName: string,
    totalChunks: number,
  ): Promise<void> {
    const chunkDir = path.join(this.baseDir, 'chunks');
    const writeStream = fs.createWriteStream(path.join(this.baseDir, fileName));

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `${fileName}_${i}`);
      const chunkBuffer = await fs.promises.readFile(chunkPath);
      writeStream.write(chunkBuffer);
      fs.unlinkSync(chunkPath);
    }
    writeStream.end();
  }

  /**
   * Upload chunk
   * @param chunk Chunk buffer
   * @param chunkNumber Chunk number
   * @param totalChunks Total chunks
   * @param fileName File name
   * @returns True if all chunks are uploaded
   */
  private async uploadChunk(
    chunk: Buffer,
    chunkNumber: number,
    totalChunks: number,
    fileName: string,
  ): Promise<boolean> {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir);
    }
    const chunkDir = path.join(this.baseDir, 'chunks');
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir);
    }

    const chunkPath = path.join(chunkDir, `${fileName}_${chunkNumber}`);
    await fs.promises.writeFile(chunkPath, chunk);

    if (chunkNumber === totalChunks - 1) {
      await this.mergeChunks(fileName, totalChunks).catch(() => {
        throw new InternalServerErrorException('Failed to merge chunks');
      });
      return true;
    }

    return false;
  }
}
