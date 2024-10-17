import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  access_role,
  file,
  file_closure,
  file_info,
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
  ): Promise<[file_info, file_closure, file_role]> {
    return this.prisma.$transaction([
      this.prisma.file_info.create({
        data: { file_id: fileId, byte_size: byteSize },
      }),
      this.prisma.file_closure.create({
        data: { parent_id: parentId, child_id: fileId },
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
   * Create base files for a new member
   * @param memberId - The ID of the member
   * @returns The created files
   * @example
   * createBaseFiles(1);
   * Returns the created files
   */
  async createBaseFiles(memberId: number): Promise<{
    root: file;
    home: file;
    trash: file;
  }> {
    const root = await this.createRootFile(memberId);
    const home = await this.createHome(memberId, root.id);
    const trash = await this.createTrashFile(memberId, home.id);
    return { root, home, trash };
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
    await this.generateBasicFileInfo(memberId, root.id, root.id).catch(
      async (error) => {
        // Rollback the file creation
        this.prisma.file.delete({ where: { id: root.id } });
        throw error;
      },
    );

    return root;
  }

  /**
   * Create a Home file
   * @param memberId - The ID of the member
   * @param rootId - The ID of the root file
   * @returns The created user container file
   * @example
   * createUserContainer(1, 1);
   * Returns the created user container file
   */
  async createHome(memberId: number, rootId: bigint): Promise<file> {
    const userContainer = await this.prisma.file.create({
      data: {
        owner_id: memberId,
        file_name: SpecialContainerNameSchema.enum.home,
        type: file_type.container,
      },
    });
    await this.generateBasicFileInfo(memberId, userContainer.id, rootId).catch(
      async (error) => {
        // Rollback the file creation
        this.prisma.file.delete({ where: { id: userContainer.id } });
        throw error;
      },
    );

    return userContainer;
  }

  /**
   * Create a trash file for a member
   * @param memberId - The ID of the member
   * @param homeId - The ID of the root folder
   * @returns The created trash file
   * @example
   * createTrashFile(1, 1);
   * Returns the created trash file
   */
  async createTrashFile(memberId: number, homeId: bigint): Promise<file> {
    const trash = await this.prisma.file.create({
      data: {
        owner_id: memberId,
        file_name: SpecialContainerNameSchema.enum.trash,
        type: file_type.container,
      },
    });
    await this.generateBasicFileInfo(memberId, trash.id, homeId).catch(
      async (error) => {
        // Rollback the file creation
        this.prisma.file.delete({ where: { id: trash.id } });
        throw error;
      },
    );

    return trash;
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
}
