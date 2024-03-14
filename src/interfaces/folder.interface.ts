import typia, { tags } from 'typia';

export interface ICreateFolderRequestBody {
  folderName: string & tags.Pattern<'^[a-zA-Z0-9_-]{1,255}$'>;
}

export const validateCreateFolderRequestBody =
  typia.createValidate<ICreateFolderRequestBody>();
