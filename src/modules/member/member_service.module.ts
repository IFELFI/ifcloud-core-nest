import { Module } from '@nestjs/common';
import { MemberService } from 'src/services/member/member.service';

@Module({
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberServiceModule {}
