import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { member, service_status } from '@prisma/client';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new member
   * @param uuidKey - The UUID key of the member
   * @returns The created member
   * @throws ConflictException if the member already exists
   * @throws InternalServerErrorException if the member or service status could not be created
   * @example
   * createMember('123e4567-e89b-12d3-a456-426614174000');
   * Returns the created member
   */
  async createMember(uuidKey: string): Promise<member> {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member
        .create({
          data: {
            uuid_key: uuidKey,
          },
        })
        .catch((e) => {
          if (e.code === 'P2002') {
            throw new ConflictException('Member already exists');
          }
          throw new InternalServerErrorException('Failed to create member');
        });

      await tx.service_status
        .create({
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
        })
        .catch(() => {
          throw new InternalServerErrorException(
            'Failed to create service status',
          );
        });

      return member;
    });
  }

  /**
   * Get a member by UUID key
   * @param uuidKey - The UUID key of the member
   * @returns The member
   * @throws InternalServerErrorException if the member could not be retrieved
   * @example
   * getMember('123e4567-e89b-12d3-a456-426614174000');
   * Returns the member
   */
  async getMember(uuidKey: string): Promise<member> {
    return this.prisma.member
      .findUniqueOrThrow({
        where: {
          uuid_key: uuidKey,
        },
      })
      .catch(() => {
        throw new InternalServerErrorException('Failed to retrieve member');
      });
  }

  /**
   * Get the service status of a member by UUID key
   * @param uuidKey - The UUID key of the member
   * @returns The service status
   * @throws InternalServerErrorException if the service status could not be retrieved
   * @example
   * getMemberServiceStatus('123e4567-e89b-12d3-a456-426614174000');
   * Returns the service status
   */
  async getMemberServiceStatus(uuidKey: string): Promise<service_status> {
    const member = await this.getMember(uuidKey);
    return this.prisma.service_status
      .findUniqueOrThrow({
        where: {
          member_id: member.id,
        },
      })
      .catch(() => {
        throw new InternalServerErrorException(
          'Failed to retrieve service status',
        );
      });
  }

  /**
   * Update the service status of a member by UUID key
   * @param uuidKey - The UUID key of the member
   * @param available - The availability status of the member
   * @returns The updated service status
   * @throws InternalServerErrorException if the service status could not be updated
   * @example
   * updateMemberServiceStatus('123e4567-e89b-12d3-a456-426614174000', true);
   * Returns the updated service status
   */
  async updateMemberServiceStatus(
    uuidKey: string,
    available: boolean,
  ): Promise<service_status> {
    const member = await this.getMember(uuidKey);
    return this.prisma.service_status
      .update({
        where: {
          member_id: member.id,
        },
        data: {
          available,
          update_date: new Date(),
        },
      })
      .catch(() => {
        throw new InternalServerErrorException(
          'Failed to update service status',
        );
      });
  }

  /**
   * Delete a member by UUID key
   * @param uuidKey - The UUID key of the member
   * @throws InternalServerErrorException if the member could not be deleted
   * @example
   * deleteMember('123e4567-e89b-12d3-a456-426614174000');
   */
  async deleteMember(uuidKey: string): Promise<member> {
    return this.prisma.member
      .delete({
        where: {
          uuid_key: uuidKey,
        },
      })
      .catch((e) => {
        if (e.code === 'P2025') {
          throw new ConflictException('Member does not exist');
        }
        throw new InternalServerErrorException('Failed to delete member');
      });
  }
}
