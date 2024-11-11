import { Module } from '@nestjs/common';
import { FileRoleService } from 'src/services/file/role.service';
import { MemberService } from 'src/services/member/member.service';

@Module({
  providers: [FileRoleService, MemberService],
  exports: [FileRoleService, MemberService],
})
export class MemberGuardModule {}
