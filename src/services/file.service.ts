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
  private readonly baseDir = process.env.STORAGE_PATH || 'storage';
  private readonly originDir = path.join(this.baseDir, 'origin');
  private readonly chunkDir = path.join(this.baseDir, 'chunk');

  constructor(private prisma: PrismaService) {}

  /**
   * Upload file
   * @param userId User ID
   * @param folderKey Folder key
   * @param fileName File name
   * @param chunk Chunk buffer
   * @param chunkNumber Number of chunk
   * @param totalChunks Total number of chunks
   * @returns { isDone: boolean, fileKey?: string }
   */
  async upload(
    userId: number,
    folderKey: string,
    fileName: string,
    chunk: Buffer,
    chunkNumber: number,
    totalChunks: number,
  ): Promise<{ isDone: boolean; fileKey?: string }> {
    const tempFileName = `${folderKey}_${userId}_${fileName}`;

    let tempFile = await this.prisma.temp_files.findUnique({
      where: {
        temp_file_name: tempFileName,
      },
    });
    if (!tempFile) {
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
      tempFile = await this.prisma.temp_files
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

    await this.uploadChunk(chunk, chunkNumber, totalChunks, tempFile.file_key);

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
      const originFilePath = await this.mergeChunks(
        tempFile.file_key,
        totalChunks,
      );
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
   * @returns { ReadStream }
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
      throw new InternalServerErrorException('File does not exist in storage');
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
    await fs.promises.rm(originPath).catch(() => {
      throw new InternalServerErrorException('Failed to delete file');
    });
    await this.prisma.files
      .delete({
        where: {
          file_key: fileKey,
        },
      })
      .catch((error) => {
        if (error.code === 'P2025') {
          throw new NotFoundException('File does not exist');
        }
        throw new InternalServerErrorException('Failed to delete file');
      });
  }

  /**
   * Rename file
   * @param fileKey File key
   * @param newFileName New file name
   */
  async renameFile(fileKey: string, newFileName: string): Promise<void> {
    await this.prisma.files
      .update({
        where: {
          file_key: fileKey,
        },
        data: {
          file_name: newFileName,
        },
      })
      .catch((error) => {
        if (error.code === 'P2002') {
          throw new ConflictException('File already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('File does not exist');
        }
        throw new InternalServerErrorException(
          'Failed to rename file' + JSON.stringify(error),
        );
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
    await this.prisma.files
      .update({
        where: {
          file_key: fileKey,
        },
        data: {
          parent_folder_id: targetParent.id,
        },
      })
      .catch((error) => {
        if (error.code === 'P2002') {
          throw new ConflictException('File already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('File does not exist');
        }
        throw new InternalServerErrorException('Failed to move file');
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
      fs.mkdirSync(chunkDirPath, {
        recursive: true,
      });
    }

    const chunkPath = `${chunkDirPath}/${chunkNumber}`;
    await fs.promises.writeFile(chunkPath, chunk).catch(() => {
      throw new InternalServerErrorException('Failed to write chunk');
    });
  }

  /**
   * Merge chunks
   * @param fileKey File key
   * @param totalChunks Total number of chunks
   * @returns { string } Origin file path
   */
  private async mergeChunks(
    fileKey: string,
    totalChunks: number,
  ): Promise<string> {
    if (!fs.existsSync(this.originDir)) {
      fs.mkdirSync(this.originDir, {
        recursive: true,
      });
    }
    const tempFile = await this.prisma.temp_files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!tempFile) {
      throw new NotFoundException('Temp file not found');
    }
    const extName = path.extname(tempFile.temp_file_name);
    const chunkDirPath = `${this.chunkDir}/${fileKey}`;
    const originFilePath = `${this.originDir}/${fileKey}${extName}`;
    const writeStream = fs.createWriteStream(originFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${chunkDirPath}/${i}`;
      const chunk = await fs.promises.readFile(chunkPath);
      writeStream.write(chunk);
      await fs.promises.unlink(chunkPath).catch(() => {
        throw new InternalServerErrorException('Failed to delete chunk');
      });
    }
    writeStream.end();
    return originFilePath;
  }
}
