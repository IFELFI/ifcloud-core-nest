import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { file, file_type, temp_file } from '@prisma/client';
import { SpecialContainerNameSchema } from '../../schemas/file.schema';
import { StorageService } from '../storage/storage.service';

/**
 * File delete service
 * Delete files from the database
 * @category File
 * @class FileDeleteService
 * @param prisma - The Prisma service
 */

@Injectable()
export class FileDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Delete a file by key
   * @param fileKey - The key of the file
   * @returns The deleted file
   * @example
   * deleteFile('123e4567-e89b-12d3-a456-426614174000');
   * Returns the deleted file
   */
  async deleteFile(fileKey: string): Promise<file> {
    const file = await this.prisma.file.findUniqueOrThrow({
      include: {
        file_path: true,
      },
      where: {
        file_key: fileKey,
      },
    });

    if (!file.file_path) {
      throw new InternalServerErrorException('File path not found');
    }
    if (
      file.file_name in SpecialContainerNameSchema.enum &&
      file.file_path.path.length <= 1
    ) {
      throw new BadRequestException('Cannot remove special container');
    }

    if (file.type === file_type.block) {
      this.storageService.deleteFile(file.file_key);
    }

    return this.prisma.file.delete({
      where: {
        id: file.id,
      },
    });
  }

  /**
   * Delete a temporary file by ID
   * @param fileId - The ID of the file
   * @returns The deleted file
   * @example
   * deleteTemporaryFile(1);
   * Returns the deleted file
   */
  async deleteTemporaryFile(fileId: bigint): Promise<temp_file> {
    return this.prisma.temp_file.delete({
      where: {
        id: fileId,
      },
    });
  }

  /**
   * Move a file to trash
   * @param memberId - The ID of the member
   * @param rootFileId - The ID of the root file
   * @param targetFileKey - The key of the file
   * @returns True if the file is moved to trash, false otherwise
   * @example
   * moveToTrash(1, 1, '123e4567-e89b-12d3-a456-426614174000');
   * Returns true if the file is moved to trash
   */
  async moveToTrash(
    memberId: number,
    rootFileId: bigint,
    targetFileKey: string,
  ): Promise<boolean> {
    const trash = await this.prisma.file.findMany({
      select: {
        id: true,
        file_path: true,
      },
      where: {
        owner_id: memberId,
        file_name: SpecialContainerNameSchema.enum.trash,
        file_path: {
          path: {
            equals: [rootFileId],
          },
        },
      },
    });
    // Check if trash is found
    if (!trash || trash.length === 0 || !trash[0].file_path) {
      throw new NotFoundException('Trash not found');
    }
    if (trash.length > 1) {
      throw new InternalServerErrorException('Multiple trash found');
    }

    // Get the trash file
    const target = await this.prisma.file.findUniqueOrThrow({
      include: {
        file_path: true,
      },
      where: {
        file_key: targetFileKey,
      },
    });
    // Check if the target file is found
    if (!target.file_path) {
      throw new InternalServerErrorException('Target file path not found');
    }
    // Check if the target file is special container
    if (
      target.file_name in SpecialContainerNameSchema.enum &&
      target.file_path.path.length <= 1
    ) {
      throw new BadRequestException('Cannot remove special container to trash');
    }

    await this.prisma.file_path.update({
      where: {
        file_id: target.id,
      },
      data: {
        path: trash[0].file_path.path.concat(trash[0].id),
      },
    });

    return true;
  }
}
