import { Request } from 'express';
import { tags } from 'typia';

export interface IBaseRequestQuery {
  uuidKey?: string & tags.Pattern<'^[a-zA-Z0-9_-]{1,255}$'>;
}

export interface IBaseRequest
  extends Request<any, any, any, IBaseRequestQuery> {}

export interface IValidRequestQuery {
  uuidKey: string & tags.Pattern<'^[a-zA-Z0-9_-]{1,255}$'>;
  userId?: number & tags.Type<'uint32'>;
}

export interface IValidRequest
  extends Request<any, any, any, IValidRequestQuery> {}

export interface IUserRequestQuery extends IValidRequestQuery {
  userId: number & tags.Type<'uint32'>;
}

export interface IUserRequest
  extends Request<any, any, any, IUserRequestQuery> {}

export interface ITargetRequestQuery extends IUserRequestQuery {
  targetKey: string & tags.Pattern<'^[a-zA-Z0-9_-]{1,255}$'>;
}

export interface ITargetRequest
  extends Request<any, any, any, ITargetRequestQuery> {}
