import { tags } from 'typia';

export interface TokenPayloadData {
  uuidKey: string & tags.Format<'uuid'>;
  email: string & tags.Format<'email'>;
  nickname: string & tags.MinLength<4> & tags.MaxLength<36>;
  imageUrl: null | (string & tags.MaxLength<255>);
}

export interface TokenPayload extends TokenPayloadData {
  iat: number;
  exp: number;
  iss: string;
}

export interface VerifyTokenResult {
  ok: boolean;
  error?: string;
  payload?: TokenPayload;
}
