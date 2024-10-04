import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FileWriteController } from 'src/controllers/file/write.controller';
import { STORAGE_MANAGER_PACKAGE_NAME } from 'src/proto/storage_manager';
import { FileRoleService } from 'src/services/file/role.service';
import { FileWriteService } from 'src/services/file/write.service';
import { MemberService } from 'src/services/member.service';
import { PrismaService } from 'src/services/prisma.service';
import { RedisService } from 'src/services/storage/redis.service';
import { StorageService } from 'src/services/storage/storage.service';
import { TokenService } from 'src/services/storage/token.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'STORAGE_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: STORAGE_MANAGER_PACKAGE_NAME,
          protoPath: join(__dirname, '../../proto/storage_manager.proto'),
          url: '127.0.0.1:3001',
        },
      },
    ]),
  ],
  controllers: [FileWriteController],
  providers: [
    FileWriteService,
    RedisService,
    TokenService,
    PrismaService,
    MemberService,
    FileRoleService,
    StorageService,
  ],
})
export class FileWriteModule {}
