import { Module } from '@nestjs/common';
import { MemberController } from 'src/controllers/member.controller';
import { MemberService } from 'src/services/member.service';
import { PrismaService } from 'src/services/prisma.service';

@Module({
  controllers: [MemberController],
  providers: [MemberService, PrismaService],
})
export class MemberModule {}
