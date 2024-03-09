import typia, { tags } from 'typia';
import { IVerifiedRequestBody } from './request.interface';

export interface IUser extends IUserUUID {
  id: number & tags.Type<'uint32'>;
}

export interface IUserUUID {
  uuidKey: string & tags.Format<'uuid'>;
}

export interface ICreateUserRequestBody extends IVerifiedRequestBody {}

export const validateCreateUserRequestBody =
  typia.createValidate<ICreateUserRequestBody>();
