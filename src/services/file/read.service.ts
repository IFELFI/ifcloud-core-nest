import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { file, file_info, file_type } from '@prisma/client';
import { SpecialContainerNameSchema } from '../../schemas/file.schema';

/**
 * File system explanation
 * Cloud is made up of files. Each file has type which are container, block, and link.
 * Also there are file closures which makes possible to create a tree structure.
 * If there is a closure with depth 0 and the ancestor and descendant are the same, then the file represents itself.
 * If there is a closure with depth 0 and the ancestor and descendant are different, then the file is a link.
 * If there is more than one closure with depth 1, then the file is a container.
 */

@Injectable()
export class FileReadService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a file by key
   * @param fileKey - The key of the file
   * @returns The file
   * @example
   * getFile('123e4567-e89b-12d3-a456-426614174000');
   * Returns the file
   */
  async getFile(fileKey: string): Promise<file> {
    return this.prisma.file.findUniqueOrThrow({
      where: {
        file_key: fileKey,
      },
    });
  }

  /**
   * Get the file info
   * @param fileId - The ID of the file
   * @returns The file info
   * @example
   * getFileInfo('123e4567-e89b-12d3-a456-426614174000');
   * Returns the file info
   */
  async getFileInfo(fileId: bigint): Promise<file_info> {
    return this.prisma.file_info.findUniqueOrThrow({
      where: {
        file_id: fileId,
      },
    });
  }

  /**
   * Get the files of a member
   * @param memberId - The ID of the member
   * @returns The files of the member
   * @example
   * getFiles(1);
   * Returns the files of the member
   */
  async getFiles(memberId: number): Promise<file[]> {
    return this.prisma.file.findMany({
      where: {
        owner_id: memberId,
      },
    });
  }

  /**
   * Get the files of a member by type
   * @param memberId - The ID of the member
   * @param type - The type of the files
   * @returns The files of the member by type
   * @example
   * getFilesByType(1, 'block');
   * Returns the block files of the member
   */
  async getFilesByType(memberId: number, type: file_type): Promise<file[]> {
    return this.prisma.file.findMany({
      where: {
        owner_id: memberId,
        type,
      },
    });
  }

  /**
   * Get root file of a member
   * @param memberId - The ID of the member
   * @returns The root file of the member
   * @throws NotFoundException - If the root file is not found
   * @throws InternalServerErrorException - If multiple root files are found
   * @example
   * getRootFile(1);
   * Returns the root file of the member
   */
  async getRootFile(memberId: number): Promise<file> {
    // Get the root file which has same ancestor and descendant id and depth 0
    const rootFile = await this.prisma.file.findMany({
      where: {
        owner_id: memberId,
        file_name: SpecialContainerNameSchema.enum.root,
      },
    });

    if (!rootFile) {
      throw new NotFoundException('Root file not found');
    }
    if (rootFile.length > 1) {
      throw new InternalServerErrorException('Multiple root files found');
    }

    // Return the root file
    return rootFile[0];
  }

  /**
   * Get the parent file of a file
   * @param fileId - The ID of the file
   * @returns The parent file of the file
   * @throws NotFoundException - If the parent file is not found
   * @throws InternalServerErrorException - If multiple parent files are found
   * @example
   * getParentFile('123e4567-e89b-12d3-a456-426614174000');
   * Returns the parent file of the file
   */
  async getParentFile(fileId: bigint): Promise<file> {
    const parentClosure = await this.prisma.file_closure.findMany({
      where: {
        descendant_id: fileId,
        depth: 1,
      },
    });

    if (!parentClosure) {
      throw new NotFoundException('Parent file not found');
    }
    if (parentClosure.length > 1) {
      throw new InternalServerErrorException('Multiple parent files found');
    }

    return this.prisma.file.findUniqueOrThrow({
      where: {
        id: parentClosure[0].ancestor_id,
      },
    });
  }

  /**
   * Get the child files of a file
   * @param fileId - The ID of the file
   * @returns The child files of the file
   * @example
   * getChildFiles('123e4567-e89b-12d3-a456-426614174000');
   * Returns the child files of the file
   */
  async getChildFiles(fileId: bigint): Promise<file[]> {
    const childClosures = await this.prisma.file_closure.findMany({
      where: {
        ancestor_id: fileId,
        depth: 1,
      },
    });

    return this.prisma.file.findMany({
      where: {
        id: {
          in: childClosures.map((closure) => closure.descendant_id),
        },
      },
    });
  }

  /**
   * Get the descendant files of a file
   * @param fileId - The ID of the file
   * @returns The descendant files of the file
   * @example
   * getFileClosure('123e4567-e89b-12d3-a456-426614174000');
   * Returns the descendant files of the file
   */
  async getFileDescendants(fileId: bigint): Promise<file[]> {
    const descendantClosures = await this.prisma.file_closure.findMany({
      where: {
        ancestor_id: fileId,
      },
    });

    return this.prisma.file.findMany({
      where: {
        id: {
          in: descendantClosures.map((closure) => closure.descendant_id),
        },
      },
    });
  }

  /**
   * Get the ancestor files of a file
   * @param fileId - The ID of the file
   * @returns The ancestor files of the file
   * @example
   * getFileAncestor('123e4567-e89b-12d3-a456-426614174000');
   * Returns the ancestor files of the file
   */
  async getFileAncestors(fileId: bigint): Promise<file[]> {
    const ancestorClosures = await this.prisma.file_closure.findMany({
      where: {
        descendant_id: fileId,
      },
    });

    return this.prisma.file.findMany({
      where: {
        id: {
          in: ancestorClosures.map((closure) => closure.ancestor_id),
        },
      },
    });
  }
}
