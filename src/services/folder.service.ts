import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CheckRoleService } from './checkRole.service';

@Injectable()
export class FolderService {
  constructor(
    private prisma: PrismaService,
    private checkRole: CheckRoleService,
  ) {}
  /**
   * Create folder
   * @param folderName Folder name
   * @param parentFolderKey Parent folder key
   * @param userId User ID
   * @returns folderKey
   */
  async create(
    folderName: string,
    parentFolderKey: string | undefined,
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
  async delete(folderKey: string, userId: number): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const folder = await tx.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });
      if (!folder) {
        throw new BadRequestException('Folder does not exist');
      }

      // Check if the user has the role
      const hasRole = await this.checkRole.checkRole(
        folder.id,
        userId,
        'delete',
      );
      if (!hasRole) {
        throw new BadRequestException(
          'User does not have access to the folder',
        );
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
  async read(
    folderKey: string,
    userId: number,
  ): Promise<{
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
        throw new BadRequestException('Folder does not exist');
      }

      const hasRole = this.checkRole.checkRole(targetFolder.id, userId, 'read');
      if (!hasRole) {
        throw new BadRequestException(
          'User does not have access to the folder',
        );
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
}
