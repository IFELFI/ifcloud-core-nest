import { Module } from '@nestjs/common';
import { FileReadController } from 'src/controllers/file/read.controller';
import { FileReadService } from 'src/services/file/read.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MemberGuardModule } from '../guard.module';
import { TokenModule } from '../token.module';

@Module({
  imports: [MemberGuardModule, TokenModule],
  controllers: [FileReadController],
  providers: [FileReadService, PrismaService],
  exports: [FileReadService],
})
export class FileReadModule {}
