import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { file } from '@prisma/client';
import { SpecialContainerNameSchema } from '../../schemas/file.schema';

/**
 * File update service
 * Update files in the database
 * @category File
 * @class FileUpdateService
 * @param prisma - The Prisma service
 */

@Injectable()
export class FileUpdateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update file name
   * @param fileKey - The key of the file
   * @param fileName - The new file name
   * @returns The updated file
   * @example
   * updateFileName('123e4567-e89b-12d3-a456-426614174000', 'new_file_name');
   * Returns the updated file
   */
  async updateFileName(fileKey: string, fileName: string): Promise<file> {
    return this.prisma.file.update({
      where: {
        file_key: fileKey,
      },
      data: {
        file_name: fileName,
      },
    });
  }

  /**
   * Update file parent
   * @param fileKey - The key of the file
   * @param parentKey - The key of the new parent file
   * @returns boolean
   * @example
   * updateFileParent('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001');
   * Returns true if the parent is updated successfully
   */
  async updateFileParent(fileKey: string, parentKey: string): Promise<boolean> {
    if (fileKey === parentKey) {
      throw new BadRequestException('Cannot set parent to itself');
    }

    const target = await this.prisma.file.findUniqueOrThrow({
      where: {
        file_key: fileKey,
      },
      select: {
        id: true,
        file_name: true,
      },
    });
    if (target.file_name in SpecialContainerNameSchema.enum) {
      throw new BadRequestException('Cannot move special container');
    }
    const parent = await this.prisma.file.findUniqueOrThrow({
      where: {
        file_key: parentKey,
      },
      select: {
        id: true,
      },
    });

    await this.prisma.file_closure.update({
      where: {
        child_id: target.id,
      },
      data: {
        parent_id: parent.id,
        child_id: target.id,
      },
    });

    return true;
  }
}
