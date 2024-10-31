import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const parent = await this.prisma.file.findUniqueOrThrow({
      select: {
        id: true,
        file_path: true,
      },
      where: {
        file_key: parentKey,
      },
    });
    // Check if the parent file path is not null
    if (!parent.file_path) {
      throw new NotFoundException('Parent file path not found');
    }
    // Create the new parent path
    const parentPath = parent.file_path.path.concat(parent.id);

    const target = await this.prisma.file.findUniqueOrThrow({
      where: {
        file_key: fileKey,
      },
      select: {
        id: true,
        file_name: true,
        file_path: true,
      },
    });
    // Check if the file path is not null
    if (!target.file_path) {
      throw new NotFoundException('File path not found');
    }
    // Check if the file is a special container
    if (
      target.file_name in SpecialContainerNameSchema.enum &&
      target.file_path.path.length <= 1
    ) {
      throw new BadRequestException('Cannot move special container');
    }
    // concat the target path with the target id to get the ancestors
    const targetPath = target.file_path.path.concat(target.id);

    // Get the target ancestors
    const targetAncestors = await this.prisma.file_path.findMany({
      where: {
        path: {
          hasEvery: targetPath,
        },
      },
    });

    // Combine the target ancestors and the target file
    const targets = targetAncestors.concat(target.file_path);

    // Update the targets with the new parent path
    await this.prisma.$transaction(
      targets.map((ancestor) =>
        this.prisma.file_path.update({
          where: {
            file_id: ancestor.file_id,
          },
          data: {
            path: parentPath.concat(ancestor.path.slice(targetPath.length - 1)),
          },
        }),
      ),
    );

    return true;
  }
}
