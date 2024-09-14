import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

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
   * Save a token in Redis
   * @param token - The key of the token
   * @param uuidKey - The UUID key of the file
   * @param expiration - The expiration time of the token
   * @returns The saved token
   * @example
   * saveToken('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', 3600);
   * Returns the saved token
   */
  async saveToken(
    token: string,
    uuidKey: string,
    expiration: number,
  ): Promise<string> {
    return await this.redis.setex(token, uuidKey, expiration);
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
    const prefix = 'read:';
    const token = await this.generateToken(32);
    const key = `${prefix}${token}`;
    await this.saveToken(key, uuidKey, 60);

    return token;
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
    const prefix = 'write:';
    const token = await this.generateToken(32);
    const key = `${prefix}${token}`;
    await this.saveToken(key, uuidKey, 60);

    return token;
  }
}
