import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CheckRoleService } from './checkRole.service';
import fs from 'fs';
import path from 'path';
import { PrismaService } from './prisma.service';

@Injectable()
export class FileService {
  private readonly baseDir = process.env.FILE_UPLOAD_DIR!;

  constructor(
    private prisma: PrismaService,
    private checkRole: CheckRoleService,
  ) {}

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
      const parentFolder = await this.prisma.folders.findUnique({
        where: {
          folder_key: parentFolderKey,
        },
      });
      if (!parentFolder) {
        throw new NotFoundException('Folder does not exist');
      }
      await this.checkRole.checkRole(parentFolder.id, userId, 'create');
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

    const uploadChunkIsDone = await this.uploadChunk(
      chunk,
      chunkNumber,
      totalChunks,
      tempFileName,
    );

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
        // Upload file
        const uploadedFile = await tx.files.create({
          data: {
            parent_folder_id: parentFolder.id,
            file_key: tempFile.file_key,
            file_name: fileName,
            enabled: true,
          },
        });
        // Get file stats
        const fileStats = fs.statSync(
          path.join(this.baseDir, uploadedFile.file_key),
        );
        // Create file info
        await tx.file_info.create({
          data: {
            file_id: uploadedFile.id,
            uploader_id: userId,
            byte_size: fileStats.size,
          },
        });

        return { isDone: true, fileKey: uploadedFile.file_key };
      });
    }
    return { isDone: false };
  }
}
