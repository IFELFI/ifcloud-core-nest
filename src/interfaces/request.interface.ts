import { tags } from 'typia';
import { TokenPayload } from './token.interface';
import { Request } from 'express';

export interface IBaseRequestBody {
  data?: any;
  payload?: TokenPayload;
}

export interface IVerifiedRequestBody extends IBaseRequestBody {
  payload: TokenPayload;
  userId?: number & tags.Type<'uint32'>;
}

export interface IUserRequestBody extends IVerifiedRequestBody {
  userId: number & tags.Type<'uint32'>;
}

export interface IBaseRequest extends Request {
  body: IBaseRequestBody;
}

export interface IVerifiedRequest extends Request {
  body: IVerifiedRequestBody;
}

export interface IUserRequest extends Request {
  body: IUserRequestBody;
}
