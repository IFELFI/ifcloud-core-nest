import {
  BadRequestException,
  HttpException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import {
  IBaseRequest,
  IVerifiedRequestBody,
} from 'src/interfaces/request.interface';
import { TokenPayload } from 'src/interfaces/token.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ParseTokenMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: IBaseRequest, res: Response, next: NextFunction) {
    try {
      const token = this.getAuthorizationToken(req);
      const payloadTemp = await this.jwtService.verifyAsync(token);

      if (typeof payloadTemp !== 'object' || !('uuidKey' in payloadTemp)) {
        throw new BadRequestException('Invalid token');
      }

      const payload: TokenPayload = {
        uuidKey: payloadTemp.uuidKey,
      };

      const verifiedBody: IVerifiedRequestBody = {
        ...req.body,
        payload,
      };

      req.body = verifiedBody;
      next();
    } catch (error) {
      if (error instanceof HttpException) {
        return next(error);
      }
      next(new BadRequestException('Invalid token'));
    }
  }

  getAuthorizationToken(req: Request): string {
    const authorization = req.headers.authorization;
    if (!authorization)
      throw new BadRequestException('Authorization header is missing');
    const token = authorization.split(' ')[1];
    if (!token) throw new BadRequestException('Token is missing');
    return token;
  }
}
