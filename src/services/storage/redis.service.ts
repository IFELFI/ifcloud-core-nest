import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { EnvConfig } from 'src/schemas/env.schema';

/**
 * Redis service
 * Redis service for saving tokens to interact with storage services
 * @category Redis
 * @class RedisService
 * @param config - The configuration service
 */

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    this.redisClient = new Redis(
      this.config.get<EnvConfig['redis']>('redis').url,
    );
  }

  /**
   * Get a value by key
   * @param key - The key of the value
   * @returns The value
   * @example
   * get('key');
   * Returns the value
   */
  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  /**
   * Set a value by key
   * @param key - The key of the value
   * @param value - The value
   * @returns The value
   * @example
   * set('key', 'value');
   * Returns the status of the operation
   */
  async set(key: string, value: string): Promise<string> {
    return await this.redisClient.set(key, value);
  }

  /**
   * Set a value by key with expiration
   * @param key - The key of the value
   * @param value - The value
   * @param expiration - The expiration in seconds
   * @returns The value
   * @example
   * setex('key', 'value', 60);
   * Returns the status of the operation
   */
  async setex(key: string, value: string, expiration: number): Promise<string> {
    return await this.redisClient.setex(key, expiration, value);
  }
}
