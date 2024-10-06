import { FileReadModule } from './file/read.module';
import { FileCreateModule } from './file/create.module';
import { FileDeleteModule } from './file/delete.module';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { STORAGE_MANAGER_PACKAGE_NAME } from 'src/proto/storage_manager';
import { join } from 'path';
import { StorageService } from 'src/services/storage/storage.service';
import { TokenService } from 'src/services/storage/token.service';
import { RedisService } from 'src/services/storage/redis.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'STORAGE_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: STORAGE_MANAGER_PACKAGE_NAME,
          protoPath: join(__dirname, '../proto/storage_manager.proto'),
          url: '127.0.0.1:3001',
        },
      },
    ]),
    FileReadModule,
    FileCreateModule,
    FileDeleteModule,
  ],
  providers: [RedisService, TokenService, StorageService],
})
export class UploadModule {}
