import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TokenService } from '../storage/token.service';
import { file, file_type } from '@prisma/client';

@Injectable()
export class FileWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Issue a write token to create a file
   * @param memberId - The ID of the member
   * @param parentKey - The key of the ancestor file
   * @returns The issued write token
   * @example
   * issueWrite('123e4567-e89b-12d3-a456-426614174000', 1);
   * Returns the issued write token
   */
  async issueWriteToken(
    memberId: number,
    parentKey: string,
    fileName: string,
    byteSize: number,
  ): Promise<string> {
    // Create a temporary file on the database
    const tempFile = await this.prisma.$transaction(async (tx) => {
      const parent = await tx.file.findUniqueOrThrow({
        where: {
          file_key: parentKey,
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
          parent_id: parent.id,
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

  /**
   * Create a container file
   * @param memberId - The ID of the member
   * @param parentKey - The key of the parent file
   * @param fileName - The name of the file
   * @returns The created file
   * @example
   * createContainer(1, '123e4567-e89b-12d3-a456-426614174000', 'new_folder');
   * Returns the created file
   */
  async createContainer(
    memberId: number,
    parentKey: string,
    fileName: string,
  ): Promise<file> {
    return this.prisma.$transaction(async (tx) => {
      // Create a container file
      const file = await tx.file.create({
        data: {
          owner_id: memberId,
          file_name: fileName,
          type: file_type.container,
        },
      });
      // Create a file info
      await tx.file_info.create({
        data: {
          file_id: file.id,
        },
      });

      // Create a closure relationship
      const parent = await tx.file.findUniqueOrThrow({
        where: {
          file_key: parentKey,
        },
        select: {
          id: true,
        },
      });
      await tx.file_closure.create({
        data: {
          parent_id: parent.id,
          child_id: file.id,
        },
      });

      return file;
    });
  }
}
