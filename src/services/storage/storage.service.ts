import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import {
  DeleteRequest,
  MergeRequest,
  StorageManagerService,
  StorageManageReply,
} from 'src/interfaces/grpc/storage_service';

@Injectable()
export class StorageService implements OnModuleInit {
  private storageManagerService: StorageManagerService;
  constructor(@Inject('STORAGE_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.storageManagerService =
      this.client.getService<StorageManagerService>('StorageManage');
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
      file_key: uuidKey,
      total_chunk_count: total_chunk_count,
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
      file_key: uuidKey,
    };

    return this.storageManagerService.delete(requestData);
  }
}
