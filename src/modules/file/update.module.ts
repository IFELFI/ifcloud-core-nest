import { Module } from '@nestjs/common';
import { FileUpdateController } from 'src/controllers/file/update.controller';
import { FileUpdateService } from 'src/services/file/update.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MemberGuardModule } from '../guard.module';
import { FileReadService } from 'src/services/file/read.service';

@Module({
  imports: [MemberGuardModule],
  controllers: [FileUpdateController],
  providers: [FileReadService, FileUpdateService, PrismaService],
  exports: [FileUpdateService, FileReadService],
})
export class FileUpdateModule {}
