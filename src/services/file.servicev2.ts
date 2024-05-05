import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import fs, { ReadStream } from 'fs';
import path from 'path';

@Injectable()
export class FileService {
  private readonly baseDir = process.env.STORAGE_PATH || 'uploads';
  private readonly originDir = path.join(this.baseDir, 'origin');
  private readonly chunkDir = path.join(this.baseDir, 'chunk');
  private readonly chunkSize = 1024 * 1024 * 2;

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, {
        recursive: true,
      });
    }
    if (!fs.existsSync(this.originDir)) {
      fs.mkdirSync(this.originDir);
    }
    if (!fs.existsSync(this.chunkDir)) {
      fs.mkdirSync(this.chunkDir);
    }
  }

  async upload(
    userId: number,
    folderKey: string,
    fileName: string,
    chunk: Buffer,
    chunkNumber: number,
    totalChunks: number,
  ): Promise<{ isDone: boolean; fileKey?: string }> {
    const tempFileName = `${fileName}_${userId}_${folderKey}`;

    if (chunkNumber === 0) {
      const targetFolder = await this.prisma.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });
      if (!targetFolder) {
        throw new NotFoundException('Folder not found');
      }

      const existingFile = await this.prisma.files.findFirst({
        where: {
          parent_folder_id: targetFolder.id,
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
          throw new InternalServerErrorException('Failed to create temp file');
        });
    }

    const tempFile = await this.prisma.temp_files.findUnique({
      where: {
        temp_file_name: tempFileName,
      },
    });
    if (!tempFile) {
      throw new NotFoundException('Temp file not found');
    }

    const uploadChunkResult = await this.uploadChunk(
      chunk,
      chunkNumber,
      totalChunks,
      tempFile.file_key,
    );

    let allChunkUploaded = false;
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${this.chunkDir}/${tempFile.file_key}/${i}`;
      if (!fs.existsSync(chunkPath)) {
        allChunkUploaded = false;
        break;
      }
      allChunkUploaded = true;
    }

    if (allChunkUploaded) {
      const uploadedFile = await this.prisma.$transaction(async (tx) => {
        const targetFolder = await tx.folders.findUnique({
          where: {
            folder_key: folderKey,
          },
        });
        if (!targetFolder) {
          throw new NotFoundException('Folder not found');
        }
        // Get temp file
        const tempFile = await tx.temp_files.findUnique({
          where: {
            temp_file_name: tempFileName,
          },
        });
        if (!tempFile) {
          throw new NotFoundException('Temp file not found');
        }
        // Create file
        const uploadedFile = await tx.files
          .create({
            data: {
              parent_folder_id: targetFolder.id,
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
        // Create file info
        const originFilePath = path.join(this.originDir, uploadedFile.file_key);
        const fileStats = fs.statSync(originFilePath);
        await tx.file_info.create({
          data: {
            file_id: uploadedFile.id,
            uploader_id: userId,
            byte_size: fileStats.size,
          },
        });
        return uploadedFile;
      });
      return { isDone: true, fileKey: uploadedFile.file_key };
    }
    return { isDone: false };
  }

  /**
   * Download file
   * @param fileKey File key
   * @returns Read Stream of file
   */
  async download(fileKey: string): Promise<ReadStream> {
    const file = await this.prisma.files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!file) {
      throw new NotFoundException('File does not exist');
    }
    const originPath = path.join(this.originDir, fileKey);
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
   * Delete file
   * @param fileKey File key
   */
  async deleteFile(fileKey: string): Promise<void> {
    const originPath = path.join(this.originDir, fileKey);
    if (!fs.existsSync(originPath)) {
      throw new NotFoundException('File does not exist');
    }
    await fs.promises.rm(originPath);
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
   * Move file to another folder
   * @param fileKey File key
   * @param targetParentKey Target parent folder key
   */
  async updateParent(fileKey: string, targetParentKey: string): Promise<void> {
    const targetParent = await this.prisma.folders.findUnique({
      where: {
        folder_key: targetParentKey,
      },
    });
    if (!targetParent) {
      throw new NotFoundException('Target parent folder does not exist');
    }
    await this.prisma.files.update({
      where: {
        file_key: fileKey,
      },
      data: {
        parent_folder_id: targetParent.id,
      },
    });
  }

  /**
   * Upload chunk
   * @param chunk Chunk buffer
   * @param chunkNumber Number of chunk
   * @param totalChunks Total number of chunks
   * @param fileKey File key
   * @returns { isLast: boolean }
   */
  private async uploadChunk(
    chunk: Buffer,
    chunkNumber: number,
    totalChunks: number,
    fileKey: string,
  ): Promise<void> {
    const chunkDirPath = `${this.chunkDir}/${fileKey}`;
    if (!fs.existsSync(chunkDirPath)) {
      fs.mkdirSync(chunkDirPath);
    }

    const chunkPath = `${chunkDirPath}/${chunkNumber}`;
    await fs.promises.writeFile(chunkPath, chunk);

    if (chunkNumber === totalChunks - 1) {
      await this.mergeChunks(fileKey, totalChunks).catch(() => {
        throw new InternalServerErrorException('Failed to merge chunks');
      });
    }
  }

  /**
   * Merge chunks
   * @param fileKey File key
   * @param totalChunks Total number of chunks
   */
  private async mergeChunks(
    fileKey: string,
    totalChunks: number,
  ): Promise<void> {
    const chunkDirPath = `${this.chunkDir}/${fileKey}`;
    const originFilePath = `${this.originDir}/${fileKey}`;
    const writeStream = fs.createWriteStream(originFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${chunkDirPath}/${i}`;
      const chunk = await fs.promises.readFile(chunkPath);
      writeStream.write(chunk);
      await fs.promises.unlink(chunkPath);
    }
    writeStream.end();
  }
}
