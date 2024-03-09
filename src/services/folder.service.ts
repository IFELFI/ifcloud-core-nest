import {
  ICreateFolderServiceInput,
  ICreateFolderServiceOutput,
  IDeleteFolderServiceInput,
  IDeleteFolderServiceOutput,
} from './../interfaces/folder.interface';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class FolderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create folder
   * @param data Create folder input
   * @returns Create folder output
   */
  async create(
    data: ICreateFolderServiceInput,
  ): Promise<ICreateFolderServiceOutput> {
    const { folderName, parentFolderKey, userId } = data;
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

      const output: ICreateFolderServiceOutput = {
        folderKey: createFolder.folder_key,
      };

      return output;
    });
  }

  /**
   * Delete folder
   * @param folderKey Folder key
   * @param userId User ID
   */
  async delete(
    data: IDeleteFolderServiceInput,
  ): Promise<IDeleteFolderServiceOutput> {
    const { folderKey } = data;
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
}
