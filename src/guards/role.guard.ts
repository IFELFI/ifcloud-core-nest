import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import { access_role } from '@prisma/client';
import { Request } from 'express';
import { UserRequestQuery } from 'src/interfaces/request';
import { FileRoleService } from 'src/services/file/role.service';

export function RoleGuard(role: access_role): Type<CanActivate> {
  class RoleGuard implements CanActivate {
    constructor(private readonly fileRoleService: FileRoleService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const userRequest = context
        .switchToHttp()
        .getRequest<Request<any, any, any, UserRequestQuery>>();

      const memberId = userRequest.query.memberId;
      const fileKey = userRequest.params.fileKey;

      const hasRole = await this.fileRoleService.checkRole(
        memberId,
        fileKey,
        role,
      );

      return hasRole; // If hasRole is false, the request will be rejected and throw a 403 Forbidden error
    }
  }

  const guard = mixin(RoleGuard);
  return guard;
}
