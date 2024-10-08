import { Module } from '@nestjs/common';
import { FileRoleService } from 'src/services/file/role.service';
import { MemberService } from 'src/services/member/member.service';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Module({
  providers: [FileRoleService, MemberService, PrismaService],
  exports: [FileRoleService, MemberService],
})
export class MemberGuardModule {}
