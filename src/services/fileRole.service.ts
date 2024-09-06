import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { access_role } from '@prisma/client';

@Injectable()
export class FileRoleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get the role of a member for a file
   * @param memberId - The ID of the member
   * @param fileKey - The key of the file
   * @returns The role of the member for the file
   * @throws NotFoundException if the file is not found
   * @throws InternalServerErrorException if the role could not be retrieved
   * @example
   * getRole(1, '123e4567-e89b-12d3-a456-426614174000');
   * Returns the role of the member for the file
   */
  async getRole(memberId: number, fileKey: string) {
    const file = await this.prisma.file.findUniqueOrThrow({
      where: {
        file_key: fileKey,
      },
    });

    const role = await this.prisma.file_role.findUnique({
      where: {
        member_id_file_id: {
          file_id: file.id,
          member_id: memberId,
        },
      },
    });

    return role;
  }

  /**
   * Check if the member has the required role for the file
   * @param memberId - The ID of the member
   * @param fileKey - The key of the file
   * @param role - The role to check
   * @returns True if the member has the required role, false otherwise
   * @example
   * checkRole(1, '123e4567-e89b-12d3-a456-426614174000', 'read');
   * Returns true if the member has the READ role for the file
   */
  async checkRole(
    memberId: number,
    fileKey: string,
    role: access_role,
  ): Promise<boolean> {
    const fileRole = await this.getRole(memberId, fileKey);

    if (fileRole && fileRole.role.includes(role)) {
      return true;
    } else {
      return false;
    }
  }
}
