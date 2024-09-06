import {
  Injectable,
  InternalServerErrorException,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { envConfig } from 'src/schemas/env.schema';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private config: ConfigService<envConfig, true>) {}
  use(req: Request, res: Response, next: NextFunction) {
    const gatewayConfig = this.config.get<envConfig['gateway']>('gateway');
    const keyNameConfig = this.config.get<envConfig['keyName']>('keyName');

    // Check if the gateway secret is valid in production and test environments
    if (
      this.config.get<envConfig['nodeEnv']>('nodeEnv') === 'production' ||
      this.config.get<envConfig['nodeEnv']>('nodeEnv') === 'test'
    ) {
      const gatewaySecret = req.headers[keyNameConfig.gateway] as string;
      if (gatewaySecret !== gatewayConfig.secret) {
        throw new UnauthorizedException('Invalid gateway secret');
      }
      const uuidKey = req.headers[keyNameConfig.uuid] as string;
      if (!uuidKey) {
        throw new UnauthorizedException('Invalid uuid key');
      }
      req.query = {
        ...req.query,
        uuidKey,
      };
      next();
    } else {
      const uuidKey = this.config.get<envConfig['test']>('test').uuid;
      if (!uuidKey) {
        throw new InternalServerErrorException('Invalid uuid key');
      }
      req.query = {
        ...req.query,
        uuidKey,
      };
      next();
    }
  }
}
