import { Injectable } from '@nestjs/common';
import { TokenService } from './storage/token.service';

/**
 * Stream service
 * Service for streaming files
 * @category Stream
 * @class StreamService
 * @param tokenService - The token service
 */
@Injectable()
export class StreamService {
  constructor(private readonly tokenService: TokenService) {}

  /**
   * Issue a read token for a file
   * @param fileKey - The key of the file
   * @returns The read token
   * @example
   * issueReadToken('123e4567-e89b-12d3-a456-426614174000');
   * Returns the read token
   */
  async issueReadToken(fileKey: string): Promise<string> {
    return this.tokenService.issueReadToken(fileKey);
  }
}
