import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { FileController } from 'src/controllers/file.controller';
import { FindUserMiddleware } from 'src/middlewares/findUser.middleware';
import { ParseTokenMiddleware } from 'src/middlewares/parseToken.middleware';
import { CheckRoleService } from 'src/services/checkRole.service';
import { FileService } from 'src/services/file.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserService } from 'src/services/user.service';

@Module({
  controllers: [FileController],
  providers: [UserService, FileService, PrismaService, CheckRoleService],
})
export class FileModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(ParseTokenMiddleware, FindUserMiddleware).forRoutes({
      path: 'file/upload/:folderKey',
      method: RequestMethod.POST,
    });
  }
}
