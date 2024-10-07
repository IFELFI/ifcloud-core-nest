import { Module } from '@nestjs/common';
import { FileUpdateController } from 'src/controllers/file/update.controller';
import { FileUpdateService } from 'src/services/file/update.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MemberGuardModule } from '../guard.module';

@Module({
  imports: [MemberGuardModule],
  controllers: [FileUpdateController],
  providers: [FileUpdateService, PrismaService],
  exports: [FileUpdateService],
})
export class FileUpdateModule {}
