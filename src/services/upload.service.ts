import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FileCreateService } from './file/create.service';
import { StorageService } from './storage/storage.service';
import { FileReadService } from './file/read.service';
import { FileDeleteService } from './file/delete.service';
import { TokenService } from './storage/token.service';
import { file } from '@prisma/client';

/**
 * Upload service
 * Upload files to the storage
 * @category Upload
 * @class UploadService
 * @param fileCreateService - The file create service
 * @param fileReadService - The file read service
 * @param fileDeleteService - The file delete service
 * @param storageService - The storage service
 * @param tokenService - The token service
 */

@Injectable()
export class UploadService {
  constructor(
    private readonly fileCreateService: FileCreateService,
    private readonly fileReadService: FileReadService,
    private readonly fileDeleteService: FileDeleteService,
    private readonly storageService: StorageService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Issue a write token for a file
   * @param memberId - The ID of the member
   * @param parentKey - The key of the parent file
   * @param fileName - The name of the file
   * @param byteSize - The size of the file in bytes
   * @returns The write token
   * @example
   * issueWriteToken(1, '123e4567-e89b-12d3-a456-426614174000', 'file.txt', 1024);
   */
  async issueWriteToken(
    memberId: number,
    parentKey: string,
    fileName: string,
    byteSize: number,
  ): Promise<{
    token: string;
    fileKey: string;
  }> {
    const parent = await this.fileReadService.getFile(parentKey);
    const tempFile = await this.fileCreateService.createTemporaryFile(
      memberId,
      parent.id,
      fileName,
      byteSize,
    );
    const token = await this.tokenService.issueWriteToken(tempFile.file_key);

    return {
      token,
      fileKey: tempFile.file_key,
    };
  }

  /**
   * Complete the upload of a file
   * @param blockKey - The key of the block file
   * @param totalChunks - The total number of chunks
   * @returns The created file
   * @example
   * mergeBlockFile('123e4567-e89b-12d3-a456-426614174000', 10);
   * Returns the created file
   */
  async completeUpload(blockKey: string, totalChunks: number): Promise<file> {
    const tempFile = await this.fileReadService.getTemporaryFile(blockKey);
    const mergeResult = await this.storageService.mergeChunks(
      tempFile.file_key,
      totalChunks,
    );
    if (mergeResult.success !== true) {
      this.storageService.deleteFile(tempFile.file_key);
      this.fileDeleteService.deleteTemporaryFile(tempFile.id);
      throw new InternalServerErrorException(
        mergeResult.message || 'Failed to merge chunks',
      );
    } else {
      const file = await this.fileCreateService.createBlock(
        tempFile.owner_id,
        tempFile.parent_id,
        tempFile.file_name,
        tempFile.byte_size,
      );
      this.fileDeleteService.deleteTemporaryFile(tempFile.id);
      return file;
    }
  }
}
