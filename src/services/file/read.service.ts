import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { file, file_info, file_type, temp_file } from '@prisma/client';
import { SpecialContainerNameSchema } from '../../schemas/file.schema';

/**
 * File read service
 * Read files from the database
 * @category File
 * @class FileReadService
 * @param prisma - The Prisma service
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
  async getRootContainer(memberId: number): Promise<file> {
    // Get the root file which has same ancestor and descendant id and depth 0
    const root = await this.prisma.file.findMany({
      where: {
        owner_id: memberId,
        file_name: SpecialContainerNameSchema.enum.root,
        file_path: {
          path: {
            equals: [],
          },
        },
      },
    });

    if (!root || root.length === 0) {
      throw new NotFoundException('Root file not found');
    }
    if (root.length > 1) {
      throw new InternalServerErrorException('Multiple root files found');
    }

    // Return the root file
    return root[0];
  }

  /**
   * Get home container of a member
   * @param memberId - The ID of the member
   * @returns The home container of the member
   * @throws NotFoundException - If the home container is not found
   * @throws InternalServerErrorException - If multiple home containers are found
   * @example
   * getHomeContainer(1);
   * Returns the home container of the member
   */
  async getHomeContainer(memberId: number): Promise<file> {
    // Get the home container which has same ancestor and descendant id and depth 0
    const root = await this.getRootContainer(memberId);
    const homeContainer = await this.prisma.file.findMany({
      where: {
        owner_id: memberId,
        file_name: SpecialContainerNameSchema.enum.home,
        file_path: {
          path: {
            equals: [root.id],
          },
        },
      },
    });

    if (!homeContainer || homeContainer.length === 0) {
      throw new NotFoundException('Home container not found');
    }
    if (homeContainer.length > 1) {
      throw new InternalServerErrorException('Multiple home containers found');
    }

    // Return the home container
    return homeContainer[0];
  }

  /**
   * Get the parent file of a file
   * @param fileId - The ID of the file
   * @returns The parent file of the file
   * @example
   * getParentFile('123e4567-e89b-12d3-a456-426614174000');
   * Returns the parent file of the file
   */
  async getParentFile(fileId: bigint): Promise<file> {
    const filePath = await this.prisma.file_path.findUniqueOrThrow({
      where: {
        file_id: fileId,
      },
    });
    // Check if the file has no parent
    if (filePath.path.length === 0) {
      throw new BadRequestException('File has no parent');
    }
    // Get the parent file
    const parentFileId = filePath.path[filePath.path.length - 1];
    return this.prisma.file.findUniqueOrThrow({
      where: {
        id: parentFileId,
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
    const filePath = await this.prisma.file_path.findUniqueOrThrow({
      where: {
        file_id: fileId,
      },
    });
    return this.prisma.file.findMany({
      where: {
        file_path: {
          path: {
            equals: [...filePath.path, fileId],
          },
        },
      },
    });
  }

  /**
   * Find a file by file name
   * @param fileId - The ID of the file
   * @param fileName - The name of the file
   * @returns The files with the file name
   * @example
   * findFileByFileName('123e4567-e89b-12d3-a456-426614174000', 'file.txt');
   * Returns the files with the file
   */
  async findFileByFileName(fileId: bigint, fileName: string): Promise<file[]> {
    return this.prisma.file.findMany({
      where: {
        file_name: fileName,
        file_path: {
          path: {
            hasSome: [fileId],
          },
        },
      },
    });
  }

  /**
   * Get temporary file by key
   * @param fileKey - The key of the file
   * @returns The temporary file
   * @example
   * getTemporaryFile('123e4567-e89b-12d3-a456-426614174000');
   * Returns the temporary file
   */
  async getTemporaryFile(fileKey: string): Promise<temp_file> {
    return this.prisma.temp_file.findUniqueOrThrow({
      where: {
        file_key: fileKey,
      },
    });
  }

  /**
   * Get the link target file
   * @param fileId - The ID of the file
   * @returns The link target file
   * @throws NotFoundException - If the link target file is not found
   * @throws InternalServerErrorException - If multiple link target files are found
   * @example
   * getLinkTargetFile(1);
   * Returns the link target file
   */
  async getLinkTargetFile(fileId: bigint): Promise<file> {
    return this.prisma.file
      .findMany({
        where: {
          file_link_file_link_target_idTofile: {
            some: {
              file_file_link_file_idTofile: {
                id: fileId,
              },
            },
          },
        },
      })
      .then((files) => {
        if (files.length === 0) {
          throw new NotFoundException('Link target file not found');
        }
        if (files.length > 1) {
          throw new InternalServerErrorException(
            'Multiple link target files found',
          );
        }
        return files[0];
      });
  }
}
