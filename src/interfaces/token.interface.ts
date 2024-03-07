import { tags } from 'typia';
export interface TokenPayload {
  uuidKey: string & tags.Format<'uuid'>;
}

export interface VerifyTokenResult {
  ok: boolean;
  error?: string;
  payload?: TokenPayload;
}
