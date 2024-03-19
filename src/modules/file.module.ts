import { Module } from '@nestjs/common';
import { FileController } from 'src/controllers/file.controller';
import { CheckRoleService } from 'src/services/checkRole.service';
import { FileService } from 'src/services/file.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserService } from 'src/services/user.service';

@Module({
  controllers: [FileController],
  providers: [UserService, FileService, PrismaService, CheckRoleService],
})
export class FileModule {}
