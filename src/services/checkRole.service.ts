import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { access_role } from '@prisma/client';

@Injectable()
export class CheckRoleService {
  constructor(private prisma: PrismaService) {}

  async checkRole(folderKey: string, userId: number, role: access_role) {
    const folder = await this.prisma.folders.findUnique({
      where: {
        folder_key: folderKey,
      },
    });
    if (!folder) {
      throw new NotFoundException('Folder does not exist');
    }

    const userRole = await this.prisma.user_role.findFirst({
      where: {
        folder_id: folder.id,
        user_id: userId,
      },
    });
    if (!userRole) {
      throw new NotFoundException('User does not have access to the folder');
    }

    // Check if the user has the role
    const hadRole = userRole.role.includes(role);

    return hadRole;
  }
}
