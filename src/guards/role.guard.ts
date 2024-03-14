import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
  mixin,
} from '@nestjs/common';
import { access_role } from '@prisma/client';
import { IUserRequest } from 'src/interfaces/request.interface';
import { CheckRoleService } from 'src/services/checkRole.service';

export function RoleGuard(role: access_role): Type<CanActivate> {
  @Injectable()
  class RoleGuard implements CanActivate {
    constructor(private readonly checkRole: CheckRoleService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<IUserRequest>();
      const folderKey = request.params.folderKey;
      const userId = request.query.userId;
      const hasRole = await this.checkRole.check(folderKey, userId, role);
      if (!hasRole) {
        throw new ForbiddenException('User does not have the required role');
      }
      return true;
    }
  }

  const guard = mixin(RoleGuard);
  return guard;
}
