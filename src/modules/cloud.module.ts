import { Module } from '@nestjs/common';
import { FileDeleteModule } from './file/delete.module';
import { FileReadModule } from './file/read.module';
import { FileCreateModule } from './file/create.module';
import { FileUpdateModule } from './file/update.module';

@Module({
  imports: [
    FileCreateModule,
    FileReadModule,
    FileUpdateModule,
    FileDeleteModule,
  ],
})
export class CloudModule {}
