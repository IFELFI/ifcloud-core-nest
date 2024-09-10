import { EnvConfig, EnvConfigSchema } from 'src/schemas/env.schema';

export function validate(raw: Record<string, unknown>): EnvConfig {
  const config: EnvConfig = {
    nodeEnv: raw.NODE_ENV as EnvConfig['nodeEnv'],
    port: raw.PORT as EnvConfig['port'],
    log: {
      level: raw.LOG_LEVEL as EnvConfig['log']['level'],
      dest: raw.LOG_DEST as EnvConfig['log']['dest'],
    },
    database: {
      url: raw.DATABASE_URL as EnvConfig['database']['url'],
    },
    cors: {
      origin: raw.CORS_ORIGIN as EnvConfig['cors']['origin'],
    },
    session: {
      name: raw.SESSION_NAME as EnvConfig['session']['name'],
      secret: raw.SESSION_SECRET as EnvConfig['session']['secret'],
      storage: {
        url: raw.SESSION_STORAGE_URL as EnvConfig['session']['storage']['url'],
      },
    },
    gateway: {
      secret: raw.GATEWAY_SECRET as EnvConfig['gateway']['secret'],
    },
    keyName: {
      gateway: raw.KEY_NAME_GATEWAY as EnvConfig['keyName']['gateway'],
      uuid: raw.KEY_NAME_UUID as EnvConfig['keyName']['uuid'],
    },
    test: {
      uuid: raw.TEST_UUID as EnvConfig['test']['uuid'],
    },
    closure: {
      depth: raw.CLOSURE_DEPTH as EnvConfig['closure']['depth'],
    },
  };

  const result = EnvConfigSchema.safeParse(config);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return config;
}
