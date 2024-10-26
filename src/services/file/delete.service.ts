import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { file, temp_file } from '@prisma/client';
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
      where: {
        file_key: fileKey,
      },
    });

    if (file.file_name in SpecialContainerNameSchema.enum) {
      throw new BadRequestException('Cannot remove special container');
    }

    if (file.type === 'block') {
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
    return this.prisma.temp_file
      .delete({
        where: {
          id: fileId,
        },
      })
      .then(async (tempFile) => {
        await this.storageService.deleteFile(tempFile.file_key);

        return tempFile;
      });
  }

  /**
   * Move a file to trash
   * @param memberId - The ID of the member
   * @param fileKey - The key of the file
   * @returns True if the file is moved to trash, false otherwise
   * @example
   * moveToTrash(1, '123e4567-e89b-12d3-a456-426614174000');
   * Returns true if the file is moved to trash
   * @throws InternalServerErrorException - If the trash is not found or multiple trash are found
   * @throws InternalServerErrorException - If the target file is not found
   */
  async moveToTrash(memberId: number, fileKey: string): Promise<boolean> {
    const trash = await this.prisma.file.findMany({
      where: {
        owner_id: memberId,
        file_name: SpecialContainerNameSchema.enum.trash,
      },
    });

    if (trash.length === 0) {
      throw new InternalServerErrorException('Trash not found');
    }
    if (trash.length > 1) {
      throw new InternalServerErrorException('Multiple trash found');
    }

    const target = await this.prisma.file.findUniqueOrThrow({
      where: {
        file_key: fileKey,
      },
    });

    if (target.file_name in SpecialContainerNameSchema.enum) {
      throw new BadRequestException('Cannot remove special container to trash');
    }

    await this.prisma.file_closure.update({
      where: {
        child_id: target.id,
      },
      data: {
        parent_id: trash[0].id,
      },
    });

    return true;
  }
}
