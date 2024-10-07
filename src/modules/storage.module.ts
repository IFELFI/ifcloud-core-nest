import { Module } from '@nestjs/common';
import { TokenModule } from './token.module';
import { StorageService } from 'src/services/storage/storage.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { STORAGE_MANAGER_PACKAGE_NAME } from 'src/proto/storage_manager';
import { join } from 'path';

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
    TokenModule,
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
