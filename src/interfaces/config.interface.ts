import typia from 'typia';

export interface IConfig {
  nodeEnv: NodeEnv;
  port: number;
  gateway: IGatewayConfig;
  db: IDbConfig;
  storage: IStorageConfig;
  keyName: IKeyNameConfig;
  test: ITestConfig;
}

export type NodeEnv = 'development' | 'production' | 'test';

export interface IGatewayConfig {
  secret: string;
}

export interface IDbConfig {
  url: string;
}

export interface IStorageConfig {
  base: string;
  origin: string;
  video: string;
  chunk: string;
}

export interface IKeyNameConfig {
  gateway: string;
  uuid: string;
}

export interface ITestConfig {
  uuid?: string;
}

export const validateConfig = typia.createValidate<IConfig>();
