import { Module } from '@nestjs/common';
import { MemberController } from 'src/controllers/member.controller';
import { SignupModule } from './signup.module';
import { MemberServiceModule } from './member/member_service.module';

@Module({
  imports: [SignupModule, MemberServiceModule],
  controllers: [MemberController],
})
export class MemberModule {}
