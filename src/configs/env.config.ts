import { EnvConfig, EnvConfigSchema } from 'src/schemas/env.schema';

export function validate(raw: Record<string, unknown>): EnvConfig {
  const config: EnvConfig = {
    nodeEnv: raw.NODE_ENV as EnvConfig['nodeEnv'],
    port: parseInt(raw.PORT as string) as EnvConfig['port'],
    log: {
      level: raw.LOG_LEVEL as EnvConfig['log']['level'],
      dest: raw.LOG_DEST as EnvConfig['log']['dest'],
    },
    database: {
      url: raw.DATABASE_URL as EnvConfig['database']['url'],
    },
    redis: {
      url: raw.REDIS_URL as EnvConfig['redis']['url'],
    },
    cors: {
      origin: raw.CORS_ORIGIN as EnvConfig['cors']['origin'],
    },
    gateway: {
      secret: raw.GATEWAY_SECRET as EnvConfig['gateway']['secret'],
    },
    keyName: {
      gateway: raw.GATEWAY_KEY_NAME as EnvConfig['keyName']['gateway'],
      uuid: raw.UUID_KEY_NAME as EnvConfig['keyName']['uuid'],
    },
    test: {
      uuid: raw.TEST_UUID as EnvConfig['test']['uuid'],
    },
  };

  const result = EnvConfigSchema.safeParse(config);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}
