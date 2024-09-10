import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { FileReadController } from 'src/controllers/file/read.controller';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 30000,
      max: 1000,
    }),
  ],
  controllers: [FileReadController],
})
export class CloudModule {}
