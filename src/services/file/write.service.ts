import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TokenService } from '../storage/token.service';

@Injectable()
export class WriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Issue a write token to create a file
   * @param memberId - The ID of the member
   * @returns The issued write token
   * @example
   * issueWrite('123e4567-e89b-12d3-a456-426614174000', 1);
   * Returns the issued write token
   */
  async issueWriteToken(
    memberId: number,
    fileName: string,
    byteSize: number,
  ): Promise<string> {
    // Create a temporary file on the database
    const tempFile = await this.prisma.temp_file.create({
      data: {
        owner_id: memberId,
        file_name: fileName,
        byte_size: byteSize,
      },
    });
    // Issue a write token
    const token = await this.tokenService.issueWriteToken(tempFile.file_key);

    return token;
  }
}
