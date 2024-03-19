import { tags } from 'typia';

export interface IUser extends IUserUUID {
  id: number & tags.Type<'uint32'>;
}

export interface IUserUUID {
  uuidKey: string & tags.Format<'uuid'>;
}
