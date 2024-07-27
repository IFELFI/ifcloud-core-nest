import { Injectable } from '@nestjs/common';
import { folders } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  /**
   * Read favorite folders
   * @param userId User ID
   * @returns Favorite folders
   */
  async readFavorite(userId: number): Promise<folders[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        user_id: userId,
      },
    });

    const favoriteFolders = await this.prisma.folders.findMany({
      where: {
        id: {
          in: favorites.map((favorite) => favorite.folder_id),
        },
      },
    });

    return favoriteFolders;
  }

  async createFavorite(userId: number, folderKey: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const folder = await tx.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });

      if (!folder) {
        throw new Error('Folder not found');
      }

      await tx.favorite.create({
        data: {
          user_id: userId,
          folder_id: folder.id,
        },
      });
    });
  }

  async deleteFavorite(userId: number, folderKey: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const folder = await tx.folders.findUnique({
        where: {
          folder_key: folderKey,
        },
      });

      if (!folder) {
        throw new Error('Folder not found');
      }

      await tx.favorite.delete({
        where: {
          user_id_folder_id: {
            folder_id: folder.id,
            user_id: userId,
          },
        },
      });
    });
  }
}
