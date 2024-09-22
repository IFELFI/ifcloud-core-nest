export interface ValidRequestQuery {
  uuidKey: string;
  memberId?: number;
}

export interface UserRequestQuery extends ValidRequestQuery {
  memberId: number;
}

export interface MergeChunksRequestQuery {
  file_key: string;
  total_chunks: number;
}

export interface DeleteFileRequestQuery {
  file_key: string;
}
