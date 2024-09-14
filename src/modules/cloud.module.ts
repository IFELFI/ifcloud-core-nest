import { Module } from '@nestjs/common';
import { FileDeleteModule } from './file/delete.module';
import { FileReadModule } from './file/read.module';
import { FileWriteModule } from './file/write.module';
import { FileUpdateModule } from './file/update.module';

@Module({
  imports: [
    FileWriteModule,
    FileReadModule,
    FileUpdateModule,
    FileDeleteModule,
  ],
})
export class CloudModule {}
