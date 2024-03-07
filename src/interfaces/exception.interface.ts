import { tags } from 'typia';

export interface IExceptionResponseData {
  statusCode: number & tags.Pattern<'^[0-9]{3}$'>;
  error: string;
  message: string;
  path: string & tags.Format<'uri'>;
  timestamp: string & tags.Format<'date-time'>;
}
