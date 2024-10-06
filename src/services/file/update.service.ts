import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { file } from '@prisma/client';

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
    const parent = await this.prisma.file.findUniqueOrThrow({
      where: {
        file_key: parentKey,
      },
      select: {
        id: true,
      },
    });
    const target = await this.prisma.file.findUniqueOrThrow({
      where: {
        file_key: fileKey,
      },
    });

    await this.prisma.file_closure.update({
      where: {
        parent_id_child_id: {
          parent_id: target.id,
          child_id: target.id,
        },
      },
      data: {
        parent_id: parent.id,
      },
    });

    return true;
  }
}
