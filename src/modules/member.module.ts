import { Module } from '@nestjs/common';
import { MemberController } from 'src/controllers/member.controller';
import { FileCreateService } from 'src/services/file/create.service';
import { MemberService } from 'src/services/member/member.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { SignupService } from 'src/services/signup.service';

@Module({
  controllers: [MemberController],
  providers: [MemberService, SignupService, PrismaService, FileCreateService],
})
export class MemberModule {}
