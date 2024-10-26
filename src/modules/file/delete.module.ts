import { Module } from '@nestjs/common';
import { FileDeleteController } from 'src/controllers/file/delete.controller';
import { FileDeleteService } from 'src/services/file/delete.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { MemberGuardModule } from '../guard.module';
import { StorageModule } from '../storage.module';

@Module({
  imports: [MemberGuardModule, StorageModule],
  controllers: [FileDeleteController],
  providers: [FileDeleteService, PrismaService],
  exports: [FileDeleteService],
})
export class FileDeleteModule {}
