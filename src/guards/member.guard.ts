import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ValidRequestQuery } from 'src/interfaces/request';
import { MemberService } from 'src/services/member.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly memberService: MemberService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context
        .switchToHttp()
        .getRequest<Request<any, any, any, ValidRequestQuery>>();
      const uuidKey = request.query.uuidKey;
      const member = await this.memberService.getMember(uuidKey);
      request.query = {
        ...request.query,
        memberId: member.id,
      };
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
