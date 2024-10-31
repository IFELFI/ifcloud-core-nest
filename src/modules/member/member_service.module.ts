import { Module } from '@nestjs/common';
import { MemberService } from 'src/services/member/member.service';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Module({
  providers: [MemberService, PrismaService],
  exports: [MemberService],
})
export class MemberServiceModule {}
