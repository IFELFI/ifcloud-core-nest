import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
  mixin,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { ITargetRequest, IUserRequest } from 'src/interfaces/request.interface';
import { CheckRoleService } from 'src/services/checkRole.service';

export function RoleGuard(
  role: access_role,
  checkTarget: boolean = false,
  targetRole: access_role = access_role.update,
): Type<CanActivate> {
  @Injectable()
  class RoleGuard implements CanActivate {
    constructor(private readonly checkRole: CheckRoleService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      if (!checkTarget) {
        const request = context.switchToHttp().getRequest<IUserRequest>();
        const folderKey = request.params.folderKey as string;
        const userId = request.query.userId;
        const hasRole = await this.checkRole.check(folderKey, userId, role);
        if (!hasRole) {
          throw new ForbiddenException('User does not have the required role');
        }
        return true;
      } else {
        const request = context.switchToHttp().getRequest<ITargetRequest>();
        const folderKey = request.params.folderKey;
        const targetKey = request.query.targetKey;
        const userId = request.query.userId;
        const hasRoleOnFolder = await this.checkRole.check(
          folderKey,
          userId,
          role,
        );
        const hasRoleOnTarget = await this.checkRole.check(
          targetKey,
          userId,
          targetRole,
        );
        if (!hasRoleOnFolder || !hasRoleOnTarget) {
          throw new ForbiddenException('User does not have the required role');
        }
        return true;
      }
    }
  }

  const guard = mixin(RoleGuard);
  return guard;
}
