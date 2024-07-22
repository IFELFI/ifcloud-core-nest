import {
  IConfig,
  NodeEnv,
  validateConfig,
} from '../interfaces/config.interface';
import { Logger } from '@nestjs/common';

const logger = new Logger();

export function validate(raw: Record<string, unknown>) {
  const storageBase = raw.STORAGE_PATH as string;
  const config: IConfig = {
    nodeEnv: (raw.NODE_ENV as NodeEnv) || 'development',
    port: parseInt(raw.PORT as string) || 3000,
    gateway: {
      secret: raw.GATEWAY_SECRET as string,
    },
    db: {
      url: raw.DATABASE_URL as string,
    },
    storage: {
      base: storageBase,
      origin: `${storageBase}/origin`,
      video: `${storageBase}/video`,
      chunk: `${storageBase}/chunk`,
    },
    keyName: {
      gateway: raw.GATEWAY_KEY_NAME as string,
      uuid: raw.UUID_KEY_NAME as string,
    },
    test: {
      uuid: raw.TEST_UUID as string,
    },
  };
  const result = validateConfig(config);
  if (result.success) {
    return config;
  }
  const errorPath = result.errors.map((error) => error.path).join(', ');
  logger.error(`Validation failed for ${errorPath}`);
  throw new Error('Config validation failed');
}
