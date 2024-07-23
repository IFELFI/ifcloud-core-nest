import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Type,
  mixin,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { ITargetRequest, IUserRequest } from 'src/interfaces/request.interface';
import { CheckRoleService } from 'src/services/checkRole.service';

export function RoleGuard(
  role: access_role,
  type: 'folder' | 'file' = 'folder',
  checkTarget: boolean = false,
  targetRole: access_role = access_role.update,
): Type<CanActivate> {
  @Injectable()
  class RoleGuard implements CanActivate {
    constructor(private readonly checkRole: CheckRoleService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const userRequest = context.switchToHttp().getRequest<IUserRequest>();
      const userId = userRequest.query.userId;
      if (type === 'file') {
        const fileKey = userRequest.params.fileKey as string;
        const hasRole = await this.checkRole.checkFile(fileKey, userId, role);
        if (!hasRole) {
          throw new ForbiddenException('User does not have the required role');
        }
      } else if (type === 'folder') {
        const folderKey = userRequest.params.folderKey as string;
        const hasRole = await this.checkRole.checkFolder(
          folderKey,
          userId,
          role,
        );
        if (!hasRole) {
          throw new ForbiddenException('User does not have the required role');
        }
      } else {
        throw new InternalServerErrorException('Invalid type');
      }

      if (checkTarget) {
        const targetRequest = context
          .switchToHttp()
          .getRequest<ITargetRequest>();
        const targetKey = targetRequest.query.targetKey;
        const hasRole = await this.checkRole.checkFolder(
          targetKey,
          userId,
          targetRole,
        );
        if (!hasRole) {
          throw new ForbiddenException('User does not have the required role');
        } else {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  const guard = mixin(RoleGuard);
  return guard;
}
