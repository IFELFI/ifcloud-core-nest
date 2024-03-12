import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { access_role } from '@prisma/client';

@Injectable()
export class CheckRoleService {
  constructor(private prisma: PrismaService) {}

  async checkRole(
    folderId: bigint,
    userId: number,
    role: access_role,
  ): Promise<boolean> {
    const userRole = await this.prisma.user_role.findFirst({
      where: {
        folder_id: folderId,
        user_id: userId,
      },
    });
    if (!userRole) {
      return false;
    }

    // Check if the user has the role
    const hadRole = userRole.role.includes(role);

    return hadRole;
  }
}
