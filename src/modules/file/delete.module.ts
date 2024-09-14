import { Module } from '@nestjs/common';
import { FileDeleteController } from 'src/controllers/file/delete.controller';
import { FileDeleteService } from 'src/services/file/delete.service';
import { FileRoleService } from 'src/services/file/role.service';
import { MemberService } from 'src/services/member.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  controllers: [FileDeleteController],
  providers: [FileDeleteService, PrismaService, MemberService, FileRoleService],
})
export class FileDeleteModule {}
