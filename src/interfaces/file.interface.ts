import typia, { tags } from 'typia';
import { IUserRequestQuery } from './request.interface';
import { Request } from 'express';

export type FileName = string & tags.Pattern<'^[a-zA-Z0-9_.-]{1,200}$'>;

export interface IUploadFileRequestBody {
  fileName: FileName;
  totalChunks: string & tags.Pattern<'^[1-9][0-9]*$'>;
  chunkNumber: string & tags.Pattern<'^[0-9]+$'>;
}

export const validateUploadFileRequestBody =
  typia.createValidate<IUploadFileRequestBody>();

export interface IRenameFileRequestBody {
  fileName: FileName;
}

export const validateRenameFileRequestBody =
  typia.createValidate<IRenameFileRequestBody>();

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
