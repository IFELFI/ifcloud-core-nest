import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { FolderController } from 'src/controllers/folder.controller';
import { FindUserMiddleware } from 'src/middlewares/findUser.middleware';
import { ParseTokenMiddleware } from 'src/middlewares/parseToken.middleware';
import { CheckRoleService } from 'src/services/checkRole.service';
import { FolderService } from 'src/services/folder.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserService } from 'src/services/user.service';

@Module({
  controllers: [FolderController],
  providers: [UserService, FolderService, PrismaService, CheckRoleService],
})
export class FolderModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ParseTokenMiddleware, FindUserMiddleware)
      .forRoutes(
        { path: 'folder/create', method: RequestMethod.POST },
        { path: 'folder/:folderKey', method: RequestMethod.DELETE },
        { path: 'folder/:folderKey', method: RequestMethod.GET },
      );
  }
}
