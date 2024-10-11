import { Module } from '@nestjs/common';
import { TokenModule } from './token.module';
import { StreamController } from 'src/controllers/file/stream.controller';
import { StreamService } from 'src/services/stream.service';
import { MemberGuardModule } from './guard.module';

@Module({
  imports: [TokenModule, MemberGuardModule],
  controllers: [StreamController],
  providers: [StreamService],
})
export class StreamModule {}
