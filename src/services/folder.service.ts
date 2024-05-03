import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class FolderService {
  constructor(private prisma: PrismaService) {}
  /**
   * Create folder
   * @param folderName Folder name
   * @param parentFolderKey Parent folder key
   * @param userId User ID
   * @returns folderKey
   */
  async create(
    folderName: string,
    parentFolderKey: string | null,
    userId: number,
  ): Promise<{ folderKey: string }> {
    return this.prisma.$transaction(async (tx) => {
      let parentFolderId: bigint | null = null;
      if (parentFolderKey) {
        const parentFolder = await tx.folders.findUnique({
          where: {
            folder_key: parentFolderKey,
          },
        });
        if (!parentFolder) {
          throw new BadRequestException('Parent folder does not exist');
        }
        parentFolderId = parentFolder.id;
      }
      const createFolder = await tx.folders
        .create({
          data: {
            folder_name: folderName,
            parent_folder_id: parentFolderId,
          },
        })
        .catch((error) => {
          if (error.code === 'P2002') {
            throw new ConflictException('Folder already exists');
          }
          throw new InternalServerErrorException('Failed to create folder');
        });
      await tx.folder_info.create({
        data: {
          folder_id: createFolder.id,
          owner_id: userId,
        },
      });
      await tx.external_access.create({
        data: {
          folder_id: createFolder.id,
        },
      });
      await tx.user_role.create({
        data: {
          folder_id: createFolder.id,
          user_id: userId,
          role: ['create', 'read', 'update', 'delete'],
        },
      });

      const output = {
        folderKey: createFolder.folder_key,
      };

      return output;
    });
  }

  /**
   * Delete folder
   * @param folderKey Folder key
   * @param userId User ID
   * @returns true if folder is deleted
   */
  async delete(folderKey: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const folder = await tx.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });
      if (!folder) {
        throw new BadRequestException('Folder does not exist');
      }

      const folderInfo = await tx.folder_info.findUnique({
        where: {
          folder_id: folder.id,
        },
      });
      if (!folderInfo) {
        throw new BadRequestException('Folder does not exist');
      }
      await tx.folders
        .delete({
          where: {
            id: folder.id,
          },
        })
        .catch(() => {
          throw new InternalServerErrorException('Failed to delete folder');
        });

      return true;
    });
  }

  /**
   * Read folder
   * @param folderKey Target folder key
   * @param userId User ID
   * @returns Folders and files data
   */
  async read(folderKey: string): Promise<{
    folders: Array<{
      folderKey: string;
      folderName: string;
    }>;
    files: Array<{
      fileKey: string;
      fileName: string;
      enabled: boolean;
    }>;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const targetFolder = await tx.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });
      if (!targetFolder) {
        throw new NotFoundException('Folder does not exist');
      }

      const folders = await tx.folders
        .findMany({
          where: {
            parent_folder_id: targetFolder.id,
          },
        })
        .then((folders) => {
          return folders.map((folder) => {
            return {
              folderKey: folder.folder_key,
              folderName: folder.folder_name,
            };
          });
        });

      const files = await tx.files
        .findMany({
          where: {
            parent_folder_id: targetFolder.id,
          },
        })
        .then((files) => {
          return files.map((file) => {
            return {
              fileKey: file.file_key,
              fileName: file.file_name,
              enabled: file.enabled,
            };
          });
        });

      return {
        folders,
        files,
      };
    });
  }

  /**
   * Update folder parent
   * @param folderKey Folder key
   * @param targetParentKey Target parent folder key
   * @returns true if folder parent is updated
   */
  async updateParent(
    folderKey: string,
    targetParentKey: string,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const folder = await tx.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });
      if (!folder) {
        throw new NotFoundException('Folder does not exist');
      }
      const targetParent = await tx.folders.findUnique({
        where: {
          folder_key: targetParentKey,
        },
      });
      if (!targetParent) {
        throw new NotFoundException('Target parent folder does not exist');
      }
      await tx.folders.update({
        where: {
          id: folder.id,
        },
        data: {
          parent_folder_id: targetParent.id,
        },
      });
      return true;
    });
  }

  /**
   * Update folder name
   * @param folderKey Folder key
   * @param folderName Folder name
   * @returns true if folder name is updated
   */
  async updateName(folderKey: string, folderName: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const folder = await tx.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });
      if (!folder) {
        throw new NotFoundException('Folder does not exist');
      }
      await tx.folders.update({
        where: {
          id: folder.id,
        },
        data: {
          folder_name: folderName,
        },
      });
      return true;
    });
  }
}
