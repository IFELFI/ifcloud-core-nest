import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FileWriteController } from 'src/controllers/file/write.controller';
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
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'receiver_queue',
          queueOptions: {
            durable: false,
          },
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
