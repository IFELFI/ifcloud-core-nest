import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { ValidRequestQuery } from 'src/interfaces/request';
import { MemberService } from 'src/services/member/member.service';

@Injectable()
export class MemberGuard implements CanActivate {
  constructor(private readonly memberService: MemberService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request<any, any, any, ValidRequestQuery>>();
    const uuidKey = request.query.uuidKey;
    const member = await this.memberService.getMember(uuidKey);

    // Check if the member is available
    if (member) {
      const serviceStatus = await this.memberService.getServiceStatusById(
        member.id,
      );
      if (serviceStatus.available) {
        request.query = {
          ...request.query,
          memberId: member.id,
        };
        return true;
      } else {
        throw new ForbiddenException('member is not available');
      }
    } else {
      // If the member is not found, throw an error
      throw new ForbiddenException('member is not enrolled');
    }
  }
}
