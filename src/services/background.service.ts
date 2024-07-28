import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class BackgroundService {
  constructor(private prisma: PrismaService) {}

  /**
   * Set background image
   * @param userId User ID
   * @param fileKey File key
   */
  async setBackgroundFile(userId: number, fileKey: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const file = await tx.files.findUnique({
        where: {
          file_key: fileKey,
        },
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      const currentBackground = await tx.background.findUnique({
        where: {
          user_id: userId,
        },
      });

      // If the user already has a background, update it
      if (currentBackground) {
        await tx.background.update({
          where: {
            user_id: userId,
          },
          data: {
            image_id: file.id,
          },
        });
      } else {
        // Otherwise, create a new background
        await tx.background.create({
          data: {
            user_id: userId,
            image_id: file.id,
          },
        });
      }
    });
  }

  /**
   * Read background image
   * @param userId User ID
   * @returns Background image
   */
  async readBackground(userId: number): Promise<{
    fileKey: string | null;
    url: string | null;
  }> {
    const background = await this.prisma.background.findUnique({
      where: {
        user_id: userId,
      },
    });

    if (!background) {
      return {
        fileKey: null,
        url: null,
      };
    }

    // If the background image is set, return the file key
    if (background.image_id) {
      const file = await this.prisma.files.findUnique({
        where: {
          id: background.image_id,
        },
      });
      if (!file) {
        throw new NotFoundException('File not found');
      }
      return {
        fileKey: file.file_key,
        url: background.image_url,
      };
    } else {
      // Otherwise, return the URL
      return {
        fileKey: null,
        url: background.image_url,
      };
    }
  }

  /**
   * Delete background image
   * @param userId User ID
   */
  async deleteBackground(userId: number): Promise<void> {
    await this.prisma.background.delete({
      where: {
        user_id: userId,
      },
    });
  }
}
