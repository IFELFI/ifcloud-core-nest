import { Module } from '@nestjs/common';
import { FileReadController } from 'src/controllers/file/read.controller';
import { FileReadService } from 'src/services/file/read.service';
import { MemberGuardModule } from '../guard.module';
import { TokenModule } from '../token.module';

@Module({
  imports: [MemberGuardModule, TokenModule],
  controllers: [FileReadController],
  providers: [FileReadService],
  exports: [FileReadService],
})
export class FileReadModule {}
