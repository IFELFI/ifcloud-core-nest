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
   * @param ancestorKey - The key of the ancestor file
   * @returns The issued write token
   * @example
   * issueWrite('123e4567-e89b-12d3-a456-426614174000', 1);
   * Returns the issued write token
   */
  async issueWriteToken(
    memberId: number,
    ancestorKey: string,
    fileName: string,
    byteSize: number,
  ): Promise<string> {
    // Create a temporary file on the database
    const tempFile = await this.prisma.$transaction(async (tx) => {
      const ancestor = await tx.file.findUniqueOrThrow({
        where: {
          file_key: ancestorKey,
        },
        select: {
          id: true,
        },
      });
      const tempFile = await tx.temp_file.create({
        data: {
          owner_id: memberId,
          file_name: fileName,
          byte_size: byteSize,
          ancestor_id: ancestor.id,
        },
        select: {
          file_key: true,
        },
      });
      return tempFile;
    });
    // Issue a write token
    const token = await this.tokenService.issueWriteToken(tempFile.file_key);

    return token;
  }
}
