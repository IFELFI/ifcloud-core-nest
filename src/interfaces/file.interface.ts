import typia, { tags } from 'typia';
import { IUserRequestBody } from './request.interface';
export interface ICreateFolderRequestBodyData {
  fileName: string & tags.Pattern<'^[a-zA-Z0-9_-]{1,255}$'>;
  totalChunks: number & tags.Type<'uint32'>;
  chunkNumber: number & tags.Type<'uint32'>;
}

export interface IUploadFileRequestBody extends IUserRequestBody {
  data: ICreateFolderRequestBodyData;
}

export const validateUploadFileRequestBody =
  typia.createValidate<IUploadFileRequestBody>();
