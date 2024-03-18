import typia, { tags } from 'typia';
import { IUserRequestQuery } from './request.interface';
import { Request } from 'express';

export interface IUploadFileRequestBody {
  fileName: string &
    tags.Pattern<'^[a-zA-Z0-9_.-]{1,200}[.][a-zA-Z0-9]{1,20}$'>;
  totalChunks: string & tags.Pattern<'^[1-9][0-9]*$'>;
  chunkNumber: string & tags.Pattern<'^[0-9]+$'>;
}

export const validateUploadFileRequestBody =
  typia.createValidate<IUploadFileRequestBody>();

export interface IFileRangeQuery extends IUserRequestQuery {
  range: string;
}

export interface IFileRangeRequest
  extends Request<any, any, any, IFileRangeQuery> {}

export type VideoResolution =
  | '144p'
  | '240p'
  | '360p'
  | '480p'
  | '720p'
  | '1080p';

export interface IRenameFileRequestBody {
  fileName: string;
}

export const validateRenameFileRequestBody =
  typia.createValidate<IRenameFileRequestBody>();
