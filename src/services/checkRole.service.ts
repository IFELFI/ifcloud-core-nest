import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { access_role } from '@prisma/client';

@Injectable()
export class CheckRoleService {
  constructor(private prisma: PrismaService) {}

  async checkFolder(
    folderKey: string,
    userId: number,
    role: access_role,
  ): Promise<boolean> {
    if (!folderKey) {
      throw new NotFoundException('Folder key is required');
    }
    const folder = await this.prisma.folders.findUnique({
      where: {
        folder_key: folderKey,
      },
    });
    if (!folder) {
      throw new NotFoundException('Folder does not exist');
    }
    const userRole = await this.prisma.user_role.findUnique({
      where: {
        user_id_folder_id: {
          folder_id: folder.id,
          user_id: userId,
        },
      },
    });
    if (!userRole) {
      return false;
    }

    // Check if the user has the role
    const hasRole = userRole.role.includes(role);

    return hasRole;
  }

  async checkFile(
    fileKey: string,
    userId: number,
    role: access_role,
  ): Promise<boolean> {
    if (!fileKey) {
      throw new NotFoundException('File key is required');
    }
    const file = await this.prisma.files.findUnique({
      where: {
        file_key: fileKey,
      },
    });
    if (!file) {
      throw new NotFoundException('File does not exist');
    }
    const userRole = await this.prisma.user_role.findUnique({
      where: {
        user_id_folder_id: {
          user_id: userId,
          folder_id: file.parent_folder_id,
        },
      },
    });
    if (!userRole) {
      return false;
    }

    // Check if the user has the role
    const hasRole = userRole.role.includes(role);

    return hasRole;
  }
}
