import { Module } from '@nestjs/common';
import { FileUpdateController } from 'src/controllers/file/update.controller';
import { FileRoleService } from 'src/services/file/role.service';
import { FileUpdateService } from 'src/services/file/update.service';
import { MemberService } from 'src/services/member.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  controllers: [FileUpdateController],
  providers: [FileRoleService, FileUpdateService, PrismaService, MemberService],
})
export class FileUpdateModule {}
