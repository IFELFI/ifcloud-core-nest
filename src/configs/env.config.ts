import { envConfig, envConfigSchema } from 'src/schemas/env.schema';

export function validate(raw: Record<string, unknown>): envConfig {
  const config: envConfig = {
    nodeEnv: raw.NODE_ENV as envConfig['nodeEnv'],
    log: {
      level: raw.LOG_LEVEL as envConfig['log']['level'],
      dest: raw.LOG_DEST as envConfig['log']['dest'],
    },
    database: {
      url: raw.DATABASE_URL as envConfig['database']['url'],
    },
    gateway: {
      secret: raw.GATEWAY_SECRET as envConfig['gateway']['secret'],
    },
    keyName: {
      gateway: raw.KEY_NAME_GATEWAY as envConfig['keyName']['gateway'],
      uuid: raw.KEY_NAME_UUID as envConfig['keyName']['uuid'],
    },
    test: {
      uuid: raw.TEST_UUID as envConfig['test']['uuid'],
    },
  };

  const result = envConfigSchema.safeParse(config);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return config;
}
