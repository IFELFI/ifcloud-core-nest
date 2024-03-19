import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IValidRequest } from 'src/interfaces/request.interface';
import { UserService } from 'src/services/user.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<IValidRequest>();
      const uuidKey = request.query.uuidKey;
      const userId = await this.userService.read(uuidKey);
      request.query = {
        ...request.query,
        userId,
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
