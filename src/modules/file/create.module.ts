import { Module } from '@nestjs/common';
import { FileWriteController } from 'src/controllers/file/create.controller';
import { FileRoleService } from 'src/services/file/role.service';
import { FileCreateService } from 'src/services/file/create.service';
import { MemberService } from 'src/services/member/member.service';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Module({
  controllers: [FileWriteController],
  providers: [FileCreateService, PrismaService, MemberService, FileRoleService],
})
export class FileCreateModule {}
