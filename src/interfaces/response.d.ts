export interface CustomResponse<T = any> {
  status: number;
  message: string;
  data: T;
}

export interface ErrorResponseData {
  name: string;
  path: string;
  timestamp: string;
}
