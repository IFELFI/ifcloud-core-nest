import { Module } from '@nestjs/common';
import { FolderController } from 'src/controllers/folder.controller';
import { CheckRoleService } from 'src/services/checkRole.service';
import { FolderService } from 'src/services/folder.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserService } from 'src/services/user.service';

@Module({
  controllers: [FolderController],
  providers: [UserService, FolderService, PrismaService, CheckRoleService],
})
export class FolderModule {}
