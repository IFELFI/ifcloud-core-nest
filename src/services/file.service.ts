import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import fs, { ReadStream } from 'fs';
import path from 'path';
import { resolution } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { IConfig, IStorageConfig } from 'src/interfaces/config.interface';

@Injectable()
export class FileService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService<IConfig, true>,
  ) {}

  onModuleInit() {
    const storageConfig = this.config.get<IStorageConfig>('storage');

    if (!fs.existsSync(storageConfig.base)) {
      fs.mkdirSync(storageConfig.base, {
        recursive: true,
      });
    }
    if (!fs.existsSync(storageConfig.origin)) {
      fs.mkdirSync(storageConfig.origin, {
        recursive: true,
      });
    }
    if (!fs.existsSync(storageConfig.video)) {
      fs.mkdirSync(storageConfig.video, {
        recursive: true,
      });
    }
    if (!fs.existsSync(storageConfig.chunk)) {
      fs.mkdirSync(storageConfig.chunk, {
        recursive: true,
      });
    }
  }

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
    const storageConfig = this.config.get<IStorageConfig>('storage');
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

    await this.uploadChunk(chunk, chunkNumber, tempFile.file_key);

    let allChunkUploaded = false;
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${storageConfig.chunk}/${tempFile.file_key}/${i}`;
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
        await tx.temp_files.delete({
          where: {
            temp_file_name: tempFileName,
          },
        });
        return uploadedFile;
      });
      return { isDone: true, fileKey: uploadedFile.file_key };
    }
    return { isDone: false };
  }

  /**
   * Get file info
   * @param fileKey File key
   * @returns File info
   */
  async getFileInfo(fileKey: string): Promise<{
    fileKey: string;
    fileName: string;
    enabled: boolean;
    byteSize: number;
    createDate: Date;
    updateDate: Date;
    parentFolderKey: string;
  }> {
    const file = await this.prisma.files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!file) {
      throw new NotFoundException('File does not exist');
    }
    const fileInfo = await this.prisma.file_info.findUnique({
      where: {
        file_id: file.id,
      },
    });
    if (!fileInfo) {
      throw new NotFoundException('File info does not exist');
    }
    const parentFolder = await this.prisma.folders.findUnique({
      where: {
        id: file.parent_folder_id,
      },
    });
    if (!parentFolder) {
      throw new NotFoundException('Parent folder does not exist');
    }

    return {
      fileKey: file.file_key,
      fileName: file.file_name,
      enabled: file.enabled,
      byteSize: fileInfo.byte_size,
      createDate: fileInfo.create_date,
      updateDate: fileInfo.update_date,
      parentFolderKey: parentFolder.folder_key,
    };
  }

  /**
   * Download file
   * @param fileKey File key
   * @returns { ReadStream }
   */
  async getOriginStream(
    fileKey: string,
  ): Promise<{ stream: ReadStream; length: number; type: string }> {
    const storageConfig = this.config.get<IStorageConfig>('storage');
    const file = await this.prisma.files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!file) {
      throw new NotFoundException('File does not exist');
    }
    const originFileName = `${fileKey}${path.extname(file.file_name)}`;
    const originPath = path.join(storageConfig.origin, originFileName);
    if (!fs.existsSync(originPath)) {
      this.prisma.files.delete({
        where: {
          file_key: fileKey,
        },
      });
      throw new InternalServerErrorException('File does not exist in storage');
    }
    const fileStream = fs.createReadStream(originPath);
    return {
      stream: fileStream,
      length: fs.statSync(originPath).size,
      type: this.getContentType(file.file_name),
    };
  }

  /**
   * Read chunk
   * @param fileKey File key
   * @param resolution Resolution
   * @param chunkFileName Chunk file name
   * @returns { ReadStream }
   */
  async getChunkStream(
    fileKey: string,
    resolution: resolution,
    chunkFileName: string,
  ): Promise<ReadStream> {
    const storageConfig = this.config.get<IStorageConfig>('storage');
    const videoDir = path.join(storageConfig.video, fileKey);
    const chunkPath = path.join(videoDir, resolution, chunkFileName);
    if (!fs.existsSync(chunkPath)) {
      throw new NotFoundException('Chunk does not exist in storage');
    }
    const chunkStream = fs.createReadStream(chunkPath);
    return chunkStream;
  }

  /**
   * Delete file
   * @param fileKey File key
   */
  async deleteFile(fileKey: string): Promise<void> {
    const storageConfig = this.config.get<IStorageConfig>('storage');
    const file = await this.prisma.files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!file) {
      throw new NotFoundException('File does not exist in database');
    }
    const originFileName = `${fileKey}${path.extname(file.file_name)}`;
    const originPath = path.join(storageConfig.origin, originFileName);
    await this.prisma.files
      .delete({
        where: {
          file_key: fileKey,
        },
      })
      .catch(() => {
        throw new InternalServerErrorException('Failed to delete file');
      });
    if (!fs.existsSync(originPath)) {
      throw new NotFoundException('File does not exist in storage');
    }
    await fs.promises.rm(originPath).catch(() => {
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
   * @param fileKey File key
   * @returns { isLast: boolean }
   */
  private async uploadChunk(
    chunk: Buffer,
    chunkNumber: number,
    fileKey: string,
  ): Promise<void> {
    const storageConfig = this.config.get<IStorageConfig>('storage');
    const chunkDirPath = `${storageConfig.chunk}/${fileKey}`;
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
    const storageConfig = this.config.get<IStorageConfig>('storage');
    const tempFile = await this.prisma.temp_files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!tempFile) {
      throw new NotFoundException('Temp file not found');
    }
    const extName = path.extname(tempFile.temp_file_name);
    const chunkDirPath = `${storageConfig.chunk}/${fileKey}`;
    const originFilePath = `${storageConfig.origin}/${fileKey}${extName}`;
    const writeStream = fs.createWriteStream(originFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${chunkDirPath}/${i}`;
      const chunk = await fs.promises.readFile(chunkPath);
      writeStream.write(chunk);
    }
    // delete chunk directory
    await fs.promises
      .rm(chunkDirPath, {
        recursive: true,
      })
      .catch(() => {
        throw new InternalServerErrorException(
          'Failed to delete chunk directory',
        );
      });
    writeStream.end();
    return originFilePath;
  }

  /**
   * Get file content type
   * @param fileName File name
   * @returns { string } Content type
   */
  private getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.mp4':
        return 'video/mp4';
      case '.webm':
        return 'video/webm';
      case '.pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}
