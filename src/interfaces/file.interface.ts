import typia, { tags } from 'typia';

export interface IUploadFileRequestBody {
  fileName: string &
    tags.Pattern<'^[a-zA-Z0-9_.-]{1,200}[.][a-zA-Z0-9]{1,20}$'>;
  totalChunks: string & tags.Pattern<'^[1-9][0-9]*$'>;
  chunkNumber: string & tags.Pattern<'^[0-9]+$'>;
}

export const validateUploadFileRequestBody =
  typia.createValidate<IUploadFileRequestBody>();
