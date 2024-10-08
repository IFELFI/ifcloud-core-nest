import { Module } from '@nestjs/common';
import { FileDeleteModule } from './delete.module';
import { FileReadModule } from './read.module';
import { FileCreateModule } from './create.module';
import { FileUpdateModule } from './update.module';

@Module({
  imports: [
    FileCreateModule,
    FileReadModule,
    FileUpdateModule,
    FileDeleteModule,
  ],
})
export class FileModule {}
