import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Token service
 * Service for generating and saving tokens
 * @category Token
 * @class TokenService
 * @param redis - The Redis service
 */

@Injectable()
export class TokenService {
  constructor(private readonly redis: RedisService) {}

  /**
   * Generate a random token
   * @param length - The length of the token
   * @returns The generated token
   * @example
   * generateToken(32);
   * Returns the generated token
   */
  async generateToken(length: number): Promise<string> {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < length; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return token;
  }

  /**
   * Issue a read token and save it in Redis
   * @param uuidKey - The UUID key of the file
   * @returns The issued read token
   * @example
   * issueReadToken('123e4567-e89b-12d3-a456-426614174000');
   * Returns the issued read token
   */
  async issueReadToken(uuidKey: string): Promise<string> {
    return this.isseToken(uuidKey, 'read');
  }

  /**
   * Issue a write token and save it in Redis
   * @param uuidKey - The UUID key of the file
   * @returns The issued write token
   * @example
   * issueWriteToken('123e4567-e89b-12d3-a456-426614174000');
   * Returns the issued write token
   */
  async issueWriteToken(uuidKey: string): Promise<string> {
    return this.isseToken(uuidKey, 'write');
  }

  /**
   * Issue a token and save it in Redis
   * @param uuidKey - The UUID key of the file
   * @param type - The type of the token
   * @returns The issued token
   * @example
   * isseToken('123e4567-e89b-12d3-a456-426614174000', 'read');
   * Returns the issued token
   */
  async isseToken(uuidKey: string, type: 'read' | 'write'): Promise<string> {
    const prefix = type;
    const token = await this.generateToken(32);
    const value = `${prefix}:${uuidKey}`;
    await this.redis.setex(token, value, 60);

    return token;
  }
}
