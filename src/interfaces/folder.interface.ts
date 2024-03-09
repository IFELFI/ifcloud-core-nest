import typia, { tags } from 'typia';
import { IUserRequestBody } from './request.interface';
import { files, folders } from '@prisma/client';

export interface ICreateFolderRequestBodyData {
  folderName: string & tags.Pattern<'^[a-zA-Z0-9_-]{1,255}$'>;
  parentFolderKey?: string & tags.Format<'uuid'>;
}

export interface ICreateFolderServiceInput
  extends ICreateFolderRequestBodyData {
  userId: number & tags.Type<'uint32'>;
}

export interface ICreateFolderServiceOutput {
  folderKey: string & tags.Format<'uuid'>;
}

export interface ICreateFolderRequestBody extends IUserRequestBody {
  data: ICreateFolderRequestBodyData;
}

export interface IDeleteFolderServiceInput {
  folderKey: string & tags.Format<'uuid'>;
  userId: number & tags.Type<'uint32'>;
}

export type IDeleteFolderServiceOutput = boolean;

export const validateCreateFolderRequestBody =
  typia.createValidate<ICreateFolderRequestBody>();

export interface IReadFolderServiceInput {
  folderKey: string & tags.Format<'uuid'>;
  userId: number & tags.Type<'uint32'>;
}

export type IReadFolderServiceOutput = Array<folders | files>;
