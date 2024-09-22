import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { EnvConfig } from 'src/schemas/env.schema';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    this.redisClient = new Redis(
      this.config.get<EnvConfig['redis']>('redis').url,
    );
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string): Promise<string> {
    return await this.redisClient.set(key, value);
  }

  async setex(key: string, value: string, expiration: number): Promise<string> {
    return await this.redisClient.setex(key, expiration, value);
  }
}
