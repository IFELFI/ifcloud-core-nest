import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor() {}
  use(req: Request, res: Response, next: NextFunction) {
    const gatewaySecret = req.headers['x-gateway-secret'] as string;
    if (gatewaySecret !== process.env.GATEWAY_SECRET) {
      throw new UnauthorizedException('Invalid gateway secret');
    }
    const uuidKey = req.headers['x-uuid-key'] as string;
    if (!uuidKey) {
      throw new UnauthorizedException('Invalid uuid key');
    }
    req.query = {
      ...req.query,
      uuidKey,
    };
    next();
  }
}
