import { Observable } from 'rxjs';

export interface MergeRequest {
  file_key: string;
  total_chunk_count: number;
}

export interface DeleteRequest {
  file_key: string;
}

export interface StorageManageReply {
  message: string;
}

export interface StorageManagerService {
  merge(message: MergeRequest): Observable<StorageManageReply>;
  delete(message: DeleteRequest): Observable<StorageManageReply>;
}
