import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  DeleteRequest,
  MergeRequest,
  STORAGE_MANAGE_SERVICE_NAME,
  StorageManageClient,
  StorageManageReply,
} from '../../proto/storage_manager';
import { Observable } from 'rxjs';

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
   * @returns Status of the merge operation
   */
  mergeChunks(
    uuidKey: string,
    total_chunk_count: number = 1,
  ): Observable<StorageManageReply> {
    const mergeRequest: MergeRequest = {
      fileKey: uuidKey,
      totalChunkCount: total_chunk_count,
    };

    return this.storageManagerService.merge(mergeRequest);
  }

  /**
   * Delete file from storage
   * @param uuidKey - The UUID key of the file
   * @returns Status of the delete operation
   */
  deleteFile(uuidKey: string): Observable<StorageManageReply> {
    const requestData: DeleteRequest = {
      fileKey: uuidKey,
    };

    return this.storageManagerService.delete(requestData);
  }
}
