import { UserService } from './../services/user.service';
import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { IVerifiedRequest } from 'src/interfaces/request.interface';

@Injectable()
export class FindUserMiddleware implements NestMiddleware {
  constructor(private userService: UserService) {}

  async use(req: IVerifiedRequest, res: Response, next: NextFunction) {
    try {
      const uuidKey = req.body.payload.uuidKey;
      const userId = await this.userService.read(uuidKey);
      req.body = {
        ...req.body,
        userId,
      };
      next();
    } catch (error) {
      next(new BadRequestException('Invalid token'));
    }
  }
}
