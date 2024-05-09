import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { IBaseRequest } from 'src/interfaces/request.interface';
import { TokenPayload } from 'src/interfaces/token.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const request = context.switchToHttp().getRequest<IBaseRequest>();
      const token = this.getAuthorizationToken(request);
      const payloadTemp = this.jwtService.verify<TokenPayload>(token);
      if (typeof payloadTemp !== 'object' || !('uuidKey' in payloadTemp)) {
        throw new UnauthorizedException('Invalid token');
      }
      request.query = {
        ...request.query,
        uuidKey: payloadTemp.uuidKey,
      };
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  getAuthorizationToken(req: IBaseRequest): string {
    const authorization = req.headers.authorization;
    if (!authorization)
      throw new UnauthorizedException('Authorization header is missing');
    const token = authorization.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token is missing');
    return token;
  }
}
