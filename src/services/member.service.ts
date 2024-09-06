import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { member, service_status } from '@prisma/client';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new member
   * @param uuidKey - The UUID key of the member
   * @returns The created member
   * @example
   * createMember('123e4567-e89b-12d3-a456-426614174000');
   * Returns the created member
   */
  async createMember(uuidKey: string): Promise<member> {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          uuid_key: uuidKey,
        },
      });

      await tx.service_status.create({
        data: {
          member: {
            connect: {
              id: member.id,
            },
          },
          available: false,
          join_date: new Date(),
          update_date: new Date(),
        },
      });

      return member;
    });
  }

  /**
   * Get a member by UUID key
   * @param uuidKey - The UUID key of the member
   * @returns The member
   * @example
   * getMember('123e4567-e89b-12d3-a456-426614174000');
   * Returns the member
   */
  async getMember(uuidKey: string): Promise<member> {
    return this.prisma.member.findUniqueOrThrow({
      where: {
        uuid_key: uuidKey,
      },
    });
  }

  /**
   * Get the service status of a member by UUID key
   * @param uuidKey - The UUID key of the member
   * @returns The service status
   * @example
   * getMemberServiceStatus('123e4567-e89b-12d3-a456-426614174000');
   * Returns the service status
   */
  async getMemberServiceStatus(uuidKey: string): Promise<service_status> {
    const member = await this.getMember(uuidKey);
    return this.prisma.service_status.findUniqueOrThrow({
      where: {
        member_id: member.id,
      },
    });
  }

  /**
   * Update the service status of a member by UUID key
   * @param uuidKey - The UUID key of the member
   * @param available - The availability status of the member
   * @returns The updated service status
   * @example
   * updateMemberServiceStatus('123e4567-e89b-12d3-a456-426614174000', true);
   * Returns the updated service status
   */
  async updateMemberServiceStatus(
    uuidKey: string,
    available: boolean,
  ): Promise<service_status> {
    const member = await this.getMember(uuidKey);
    return this.prisma.service_status.update({
      where: {
        member_id: member.id,
      },
      data: {
        available,
        update_date: new Date(),
      },
    });
  }

  /**
   * Delete a member by UUID key
   * @param uuidKey - The UUID key of the member
   * @example
   * deleteMember('123e4567-e89b-12d3-a456-426614174000');
   */
  async deleteMember(uuidKey: string): Promise<member> {
    return this.prisma.member.delete({
      where: {
        uuid_key: uuidKey,
      },
    });
  }
}
