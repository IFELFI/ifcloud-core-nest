import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  DeleteRequest,
  MergeRequest,
  STORAGE_MANAGE_SERVICE_NAME,
  StorageManageClient,
  StorageManageReply,
} from '../../proto/storage_manager';
import { lastValueFrom } from 'rxjs';

/**
 * Storage service
 * Service for storage operations
 * @category Storage
 * @class StorageService
 * @param client - The client for the storage service
 */

@Injectable()
export class StorageService implements OnModuleInit {
  private storageManagerService: StorageManageClient;

  constructor(@Inject('STORAGE_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.storageManagerService = this.client.getService<StorageManageClient>(
      STORAGE_MANAGE_SERVICE_NAME,
    );
  }

  /**
   * Merge chunks of a file
   * @param uuidKey - The UUID key of the file
   * @param totalChunkCount - The total number of chunks
   * @returns Status of the merge operation
   * @example
   * mergeChunks('123e4567-e89b-12d3-a456-426614174000', 2);
   * Returns the status of the merge operation
   */
  mergeChunks(
    uuidKey: string,
    totalChunkCount: number = 1,
  ): Promise<StorageManageReply> {
    const mergeRequest: MergeRequest = {
      fileKey: uuidKey,
      totalChunkCount: totalChunkCount,
    };

    const obs = this.storageManagerService.merge(mergeRequest);
    const result = lastValueFrom(obs);
    return result;
  }

  /**
   * Delete file from storage
   * @param uuidKey - The UUID key of the file
   * @returns Status of the delete operation
   * @example
   * deleteFile('123e4567-e89b-12d3-a456-426614174000');
   * Returns the status of the delete operation
   */
  deleteFile(uuidKey: string): Promise<StorageManageReply> {
    const requestData: DeleteRequest = {
      fileKey: uuidKey,
    };

    const obs = this.storageManagerService.delete(requestData);
    const result = lastValueFrom(obs);
    return result;
  }
}
