import { Module } from '@nestjs/common';
import { FileWriteController } from 'src/controllers/file/write.controller';
import { FileRoleService } from 'src/services/file/role.service';
import { FileCreateService } from 'src/services/file/create.service';
import { MemberService } from 'src/services/member.service';
import { PrismaService } from 'src/services/prisma.service';
import { RedisService } from 'src/services/storage/redis.service';
import { StorageService } from 'src/services/storage/storage.service';
import { TokenService } from 'src/services/storage/token.service';

@Module({
  controllers: [FileWriteController],
  providers: [
    FileCreateService,
    PrismaService,
    MemberService,
    FileRoleService,
  ],
})
export class FileCreateModule {}
