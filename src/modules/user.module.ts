import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserController } from 'src/controllers/user.controller';
import { ParseTokenMiddleware } from 'src/middlewares/parseToken.middleware';
import { PrismaService } from 'src/services/prisma.service';
import { UserService } from 'src/services/user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ParseTokenMiddleware)
      .forRoutes({ path: '/user/enroll', method: RequestMethod.POST });
  }
}
