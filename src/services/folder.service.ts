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
   * Read folder info
   * @param folderKey Folder key
   * @returns Folder info
   */
  async readFolderInfo(folderKey: string): Promise<{
    key: string;
    name: string;
    info: { createDate: Date; updateDate: Date };
    parentKey: string;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const folder = await tx.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });
      if (!folder) {
        throw new NotFoundException('Folder does not exist');
      }
      const folderInfo = await tx.folder_info.findUnique({
        where: {
          folder_id: folder.id,
        },
      });
      if (!folderInfo) {
        throw new NotFoundException('Folder does not exist');
      }
      const output = {
        key: folder.folder_key,
        name: folder.folder_name,
        info: {
          createDate: folderInfo.create_date,
          updateDate: folderInfo.update_date,
        },
        parentKey: '',
      };
      if (!folder.parent_folder_id) {
        return output;
      } else {
        const parentFolder = await tx.folders.findUnique({
          where: {
            id: folder.parent_folder_id,
          },
        });
        if (!parentFolder) {
          throw new NotFoundException('Parent folder does not exist');
        }
        output.parentKey = parentFolder.folder_key;
        return output;
      }
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
   * @param folderId Folder ID
   * @returns Folders and files data
   */
  private async read(folderId: bigint): Promise<{
    folders: Array<{
      key: string;
      name: string;
    }>;
    files: Array<{
      key: string;
      name: string;
      enabled: boolean;
    }>;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const folders = await tx.folders
        .findMany({
          where: {
            parent_folder_id: folderId,
          },
        })
        .then((folders) => {
          return folders.map((folder) => {
            return {
              key: folder.folder_key,
              name: folder.folder_name,
            };
          });
        });

      const files = await tx.files
        .findMany({
          where: {
            parent_folder_id: folderId,
          },
        })
        .then((files) => {
          return files.map((file) => {
            return {
              key: file.file_key,
              name: file.file_name,
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
   * Read folder by key
   * @param folderKey Folder key
   * @returns Folders and files data
   */
  async readFolderByKey(folderKey: string): ReturnType<typeof this.read> {
    const folder = await this.prisma.folders.findUnique({
      where: {
        folder_key: folderKey,
      },
    });
    if (!folder) {
      throw new NotFoundException('Folder does not exist');
    }
    const result = await this.read(folder.id);
    return result;
  }

  /**
   * Get root folder key by user ID
   * @param userKey User key
   * @returns Root folder
   * @deprecated Use getRootFolderKey instead
   */
  async readRootFolder(userKey: string): ReturnType<typeof this.read> {
    const folder = await this.prisma.folders.findFirst({
      where: {
        parent_folder_id: null,
        folder_name: userKey,
      },
    });
    if (!folder) {
      throw new NotFoundException('Root folder does not exist');
    }
    const result = await this.read(folder.id);
    return result;
  }

  /**
   * Get root folder key by user key
   * @param userKey User key
   * @returns Root folder key
   */
  async getRootFolderKey(userKey: string): Promise<string> {
    const rootFolder = await this.prisma.folders.findMany({
      where: {
        parent_folder_id: null,
        folder_name: userKey,
      },
    });
    if (rootFolder.length === 0) {
      throw new NotFoundException('Root folder does not exist');
    }
    if (rootFolder.length > 1) {
      throw new InternalServerErrorException('Multiple root folders found');
    }
    return rootFolder[0].folder_key;
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
