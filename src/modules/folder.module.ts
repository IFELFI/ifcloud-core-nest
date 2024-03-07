import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { FolderController } from 'src/controllers/folder.controller';
import { FindUserMiddleware } from 'src/middlewares/findUser.middleware';
import { ParseTokenMiddleware } from 'src/middlewares/parseToken.middleware';
import { FolderService } from 'src/services/folder.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserService } from 'src/services/user.service';

@Module({
  controllers: [FolderController],
  providers: [UserService, FolderService, PrismaService],
})
export class FolderModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ParseTokenMiddleware, FindUserMiddleware)
      .forRoutes({ path: 'folder/create', method: RequestMethod.POST });
  }
}
