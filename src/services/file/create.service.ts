import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  access_role,
  file,
  file_info,
  file_path,
  file_role,
  file_type,
  temp_file,
} from '@prisma/client';
import { SpecialContainerNameSchema } from '../../schemas/file.schema';

/**
 * File create service
 * Create files in the database
 * @category File
 * @class FileCreateService
 * @param prisma - The Prisma service
 */

@Injectable()
export class FileCreateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate basic file information
   * @param memberId - The ID of the member
   * @param fileId - The ID of the file
   * @param parentId - The key of the parent file
   * @param byteSize - The size of the file in bytes
   * @returns The basic file information
   * @example
   * generateBasic(1, 1, 1);
   * Returns the basic file information
   */
  async generateBasicFileInfo(
    memberId: number,
    fileId: bigint,
    parentId: bigint,
    byteSize: number = 0,
  ): Promise<[file_info, file_path, file_role]> {
    if (parentId === fileId) {
      throw new Error('Cannot set parent to itself');
    }

    const parentFilePath = await this.prisma.file_path.findUniqueOrThrow({
      where: { file_id: parentId },
      select: { path: true },
    });
    return this.prisma.$transaction([
      this.prisma.file_info.create({
        data: { file_id: fileId, byte_size: byteSize },
      }),
      this.prisma.file_path.create({
        data: {
          file_id: fileId,
          path: [...parentFilePath.path, parentId],
        },
      }),
      this.prisma.file_role.create({
        data: {
          file_id: fileId,
          member_id: memberId,
          role: [
            access_role.read,
            access_role.create,
            access_role.update,
            access_role.delete,
          ],
        },
      }),
    ]);
  }

  /**
   * Create root file for a member
   * @param memberId - The ID of the member
   * @returns The created root file
   * @example
   * createRootFile(1);
   * Returns the created root file
   */
  async createRootFile(memberId: number): Promise<file> {
    const root = await this.prisma.file.create({
      data: {
        owner_id: memberId,
        file_name: SpecialContainerNameSchema.enum.root,
        type: file_type.container,
      },
    });
    await Promise.all([
      this.prisma.file_info.create({
        data: {
          file_id: root.id,
          byte_size: 0,
        },
      }),
      this.prisma.file_path.create({
        data: {
          file_id: root.id,
          path: [],
        },
      }),
      this.prisma.file_role.create({
        data: {
          file_id: root.id,
          member_id: memberId,
          role: [
            access_role.read,
            access_role.create,
            access_role.update,
            access_role.delete,
          ],
        },
      }),
    ]).catch(async (error) => {
      // Rollback the file creation
      this.prisma.file.delete({ where: { id: root.id } });
      throw error;
    });

    return root;
  }

  /**
   * Create a temporary file
   * @param memberId - The ID of the member
   * @param parentID - The ID of the parent
   * @param fileName - The name of the file
   * @param byteSize - The size of the file in bytes
   * @returns The created temporary file
   * @example
   * createTemporaryFile(1, 1, 'file.txt', 1024);
   * Returns the created temporary file
   */
  async createTemporaryFile(
    memberId: number,
    parentID: bigint,
    fileName: string,
    byteSize: number,
  ): Promise<temp_file> {
    return this.prisma.temp_file.create({
      data: {
        owner_id: memberId,
        file_name: fileName,
        byte_size: byteSize,
        parent_id: parentID,
      },
    });
  }

  /**
   * Create a block file
   * @param ownerId - The ID of the owner
   * @param parentId - The ID of the parent
   * @param fileName - The name of the file
   * @param byteSize - The size of the file in bytes
   * @param fileKey - The key of the file
   * @returns The created file
   * @example
   * createBlockFile(1, 1, 'file.txt', 1024);
   * Returns the created file
   */
  async createBlock(
    ownerId: number,
    parentId: bigint,
    fileName: string,
    byteSize: number,
    fileKey?: string,
  ): Promise<file> {
    const file = await this.prisma.file.create({
      data: {
        owner_id: ownerId,
        file_name: fileName,
        type: file_type.block,
        file_key: fileKey,
      },
    });

    await this.generateBasicFileInfo(
      ownerId,
      file.id,
      parentId,
      byteSize,
    ).catch(async (error) => {
      // Rollback the file creation
      this.prisma.file.delete({ where: { id: file.id } });
      throw error;
    });

    return file;
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
    parentId: bigint,
    fileName: string,
  ): Promise<file> {
    const file = await this.prisma.file.create({
      data: {
        owner_id: memberId,
        file_name: fileName,
        type: file_type.container,
      },
    });

    await this.generateBasicFileInfo(memberId, file.id, parentId).catch(
      async (error) => {
        // Rollback the file creation
        this.prisma.file.delete({ where: { id: file.id } });
        throw error;
      },
    );

    return file;
  }

  /**
   * Create a link file
   * @param memberId - The ID of the member
   * @param parentId - The ID of the parent file
   * @param fileName - The name of the file
   * @param targetId - The ID of the target file
   * @returns The created file
   * @example
   * createLink(1, 1, 'file.txt', 2);
   * Returns the created file
   */
  async createLink(
    memberId: number,
    parentId: bigint,
    fileName: string,
    targetId: bigint,
  ): Promise<file> {
    const file = await this.prisma.file.create({
      data: {
        owner_id: memberId,
        file_name: fileName,
        type: file_type.link,
      },
    });

    await Promise.all([
      this.generateBasicFileInfo(memberId, file.id, parentId),
      this.prisma.file_link.create({
        data: {
          file_id: file.id,
          target_id: targetId,
        },
      }),
    ]).catch(async (error) => {
      // Rollback the file creation
      this.prisma.file.delete({ where: { id: file.id } });
      throw error;
    });

    return file;
  }
}
