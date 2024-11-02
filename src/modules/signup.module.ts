import { Module } from '@nestjs/common';
import { FileCreateModule } from './file/create.module';
import { SignupService } from 'src/services/signup.service';
import { MemberServiceModule } from './member/member_service.module';

@Module({
  imports: [FileCreateModule, MemberServiceModule],
  providers: [SignupService],
  exports: [SignupService],
})
export class SignupModule {}
