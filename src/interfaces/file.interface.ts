import typia, { tags } from 'typia';
import { IUserRequestQuery } from './request.interface';
import { Request } from 'express';
import { resolution } from '@prisma/client';

export type FileName = string &
  tags.Pattern<'^(?=.{1,256}$)\\.?[a-zA-Z0-9_\\-().]+(\\.[a-zA-Z0-9]{1,4})?$'>;

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

export const validateResolution = typia.createValidate<resolution>();
