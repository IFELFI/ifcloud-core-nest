import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import fs, { ReadStream } from 'fs';
import path from 'path';
import { PrismaService } from './prisma.service';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import 'dotenv/config';
import { VideoResolution } from 'src/interfaces/file.interface';

ffmpeg.setFfmpegPath(ffmpegPath.path);

@Injectable()
export class FileService {
  private readonly baseDir = process.env.FILE_UPLOAD_DIR!;
  private readonly chunkSize = 1024 * 1024 * 2;

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir);
    }
  }

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
      const tempFileResult = await this.prisma.temp_files
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

      // Create file directory
      const fileDirPath = this.getFileDirPath(tempFileResult.file_key);
      if (!fs.existsSync(fileDirPath)) {
        fs.mkdirSync(fileDirPath);
      }
    }

    const tempFile = await this.prisma.temp_files.findUnique({
      where: {
        temp_file_name: tempFileName,
      },
    });

    if (!tempFile) {
      throw new InternalServerErrorException('Failed to find temp file');
    }

    // Upload chunk
    const uploadChunkIsDone = await this.uploadChunk(
      chunk,
      chunkNumber,
      totalChunks,
      tempFile.file_key,
      tempFileName,
    );

    // If all chunks are uploaded
    if (uploadChunkIsDone) {
      const uploadedFile = await this.prisma.$transaction(async (tx) => {
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

        // Upload file
        const uploadedFile = await tx.files
          .create({
            data: {
              parent_folder_id: parentFolder.id,
              file_key: tempFile.file_key,
              file_name: fileName,
              enabled: true,
            },
          })
          .catch((error) => {
            if (error.code === 'P2002') {
              throw new ConflictException('File already exists');
            }
            throw new InternalServerErrorException('Failed to create file');
          });
        const originPath = this.getOriginPath(
          uploadedFile.file_key,
          uploadedFile.file_name,
        );

        // Get file stats
        const fileStats = fs.statSync(originPath);
        // Create file info
        await tx.file_info.create({
          data: {
            file_id: uploadedFile.id,
            uploader_id: userId,
            byte_size: fileStats.size,
          },
        });
        // If file is video, create mp4 file for streaming
        return uploadedFile;
      });
      // If file is video, create mp4 file for streaming
      await this.generateStreamVideo(
        uploadedFile.file_key,
        uploadedFile.file_name,
      );
      return { isDone: true, fileKey: uploadedFile.file_key };
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
    const originPath = this.getOriginPath(file.file_key, file.file_name);
    if (!fs.existsSync(originPath)) {
      this.prisma.files.delete({
        where: {
          file_key: fileKey,
        },
      });
      throw new NotFoundException('File does not exist in storage');
    }
    const fileStream = fs.createReadStream(originPath);
    return fileStream;
  }

  /**
   * Stream video with mp4 format
   * @param fileKey File key
   * @param start Start position
   * @param resolution Video resolution
   * @returns Read Stream of video and end position of stream and file size
   */
  async streamVideo(
    fileKey: string,
    start: number,
    resolution: string,
  ): Promise<{
    stream: fs.ReadStream;
    end: number;
    fileSize: number;
  }> {
    if (!resolution.match(/^(144p|240p|360p|480p|720p|1080p)$/)) {
      throw new BadRequestException('Invalid resolution');
    }
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
    const resourcePath = path.join(
      this.getFileDirPath(fileKey),
      `${resolution}${path.extname(file.file_name)}`,
    );

    if (!fs.existsSync(resourcePath)) {
      this.prisma.files.delete({
        where: {
          file_key: fileKey,
        },
      });
      throw new NotFoundException('File does not exist in storage');
    }

    const fileStats = await fs.promises.stat(resourcePath);
    if (start >= fileStats.size) {
      throw new BadRequestException('Invalid start position');
    }

    const fileSize = fileStats.size;
    const end = Math.min(start + this.chunkSize, fileSize - 1);

    const fileStream = fs.createReadStream(resourcePath, { start, end });

    return { stream: fileStream, end, fileSize };
  }

  /**
   * Delete file
   * @param fileKey File key
   */
  async deleteFile(fileKey: string): Promise<void> {
    const fileDirPath = this.getFileDirPath(fileKey);
    if (!fs.existsSync(fileDirPath)) {
      throw new NotFoundException('File does not exist');
    }
    fs.rmdirSync(fileDirPath, { recursive: true });
    await this.prisma.files.delete({
      where: {
        file_key: fileKey,
      },
    });
  }

  /**
   * Rename file
   * @param fileKey File key
   * @param newFileName New file name
   */
  async renameFile(fileKey: string, newFileName: string): Promise<void> {
    await this.prisma.files.update({
      where: {
        file_key: fileKey,
      },
      data: {
        file_name: newFileName,
      },
    });
  }

  /**
   * ------------------------------
   * Below are private methods for file service
   * ------------------------------
   */

  /**
   * Generate mp4 files for streaming by resolution
   * @param fileKey File key
   * @param fileName File name
   */
  private async generateStreamVideo(
    fileKey: string,
    fileName: string,
  ): Promise<void> {
    if (!fileName.match(/\.(mp4|webm|ogg|ogv|avi|mov|flv|wmv|mkv)$/)) {
      return;
    }
    return new Promise((resolve, reject) => {
      const originPath = this.getOriginPath(fileKey, fileName);
      const dirPath = this.getFileDirPath(fileKey);
      // check if origin file exists
      if (!fs.existsSync(originPath)) {
        reject('Origin file does not exist');
      }
      // generate 360p, 480p, 720p, 1080p mp4 files
      const resolutions: VideoResolution[] = [
        '144p',
        '240p',
        '360p',
        '480p',
        '720p',
        '1080p',
      ];
      resolutions.forEach(async (resolution) => {
        try {
          await this.videoRescale(
            originPath,
            resolution,
            dirPath,
            true,
            'black',
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Rescale video
   * @param video Video path
   * @param resolution Resolution
   * @param dirPath File directory path
   * @param autoPad Auto pad
   * @param padColor Pad color
   */
  private async videoRescale(
    video: string,
    resolution: VideoResolution,
    dirPath: string,
    autoPad?: boolean,
    padColor?: string,
  ): Promise<void> {
    const tempFile = path.join(dirPath, `${resolution}.mp4`);
    const { width, height } = await this.getDimensions(video);
    const { width: newWidth, height: newHeight } = this.getNewResolution(
      resolution,
      width,
      height,
    );
    await this.resizingFFmpeg(
      video,
      newWidth,
      newHeight,
      tempFile,
      autoPad,
      padColor,
    );
  }

  /**
   * Get width and height of new resolution
   * @param resolution Resolution
   * @param width Width
   * @param height Height
   * @returns Width and height of new resolution
   */
  private getNewResolution(
    resolution: VideoResolution,
    width: number,
    height: number,
  ): { width: number; height: number } {
    const resolutionInt = parseInt(resolution);
    const ratio = width / height;
    const newWidth = resolutionInt;
    const newHeight = Math.round(resolutionInt / ratio);
    return { width: newWidth, height: newHeight };
  }

  /**
   * Resize video with ffmpeg
   * @param video Video path
   * @param width Width
   * @param height Height
   * @param tempFile Temp file path
   * @param autoPad Auto pad
   * @param padColor Pad color
   */
  private async resizingFFmpeg(
    video: string,
    width: number,
    height: number,
    tempFile: string,
    autoPad?: boolean,
    padColor?: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let ff = ffmpeg().input(video).size(`${width}x${height}`);
      if (autoPad) {
        ff = ff.autoPad(autoPad, padColor);
      }
      ff.output(tempFile)
        .videoCodec('libx264')
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
          return;
        })
        .run();
    });
  }

  private async getDimensions(
    video: string,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(video, async (error, metadata) => {
        if (error) {
          reject(error);
          return;
        }
        const { width, height } = metadata.streams[0];
        if (!width || !height) {
          reject('Failed to get video dimensions');
          return;
        } else {
          resolve({ width, height });
        }
      });
    });
  }

  /**
   * Get file directory path
   * @param fileKey File key
   * @returns File directory path
   */
  private getFileDirPath(fileKey: string): string {
    return path.join(this.baseDir, fileKey);
  }

  /**
   * Get chunk directory path
   * @param fileKey File key
   * @returns Chunk directory path
   */
  private getChunkDirPath(fileKey: string): string {
    return path.join(this.baseDir, fileKey, 'chunks');
  }

  /**
   * Get origin resource path
   * @param fileKey File key
   * @param fileName File name
   * @returns Origin resource path
   */
  private getOriginPath(fileKey: string, fileName: string): string {
    return path.join(this.baseDir, fileKey, 'origin' + path.extname(fileName));
  }

  /**
   * Merge chunks
   * @param fileName File name
   * @param totalChunks # of total chunks
   */
  private async mergeChunks(
    fileKey: string,
    totalChunks: number,
    fileName: string,
  ): Promise<void> {
    const chunkDir = this.getChunkDirPath(fileKey);
    const writeStream = fs.createWriteStream(
      this.getOriginPath(fileKey, fileName),
    );

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `${i}`);
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
    fileKey: string,
    fileName: string,
  ): Promise<boolean> {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir);
    }
    const chunkDir = this.getChunkDirPath(fileKey);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir);
    }

    const chunkPath = path.join(chunkDir, `${chunkNumber}`);
    await fs.promises.writeFile(chunkPath, chunk);

    if (chunkNumber === totalChunks - 1) {
      await this.mergeChunks(fileKey, totalChunks, fileName).catch(() => {
        throw new InternalServerErrorException('Failed to merge chunks');
      });
      return true;
    }

    return false;
  }
}
