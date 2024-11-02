import { Module } from '@nestjs/common';
import { FileWriteController } from 'src/controllers/file/create.controller';
import { FileCreateService } from 'src/services/file/create.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MemberGuardModule } from '../guard.module';
import { FileReadService } from 'src/services/file/read.service';

@Module({
  imports: [MemberGuardModule],
  controllers: [FileWriteController],
  providers: [FileCreateService, FileReadService, PrismaService],
  exports: [FileCreateService],
})
export class FileCreateModule {}
