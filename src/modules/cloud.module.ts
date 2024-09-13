import { Module } from '@nestjs/common';
import { FileReadController } from 'src/controllers/file/read.controller';
import { FileReadService } from 'src/services/file/read.service';
import { FileRoleService } from 'src/services/file/role.service';
import { MemberService } from 'src/services/member.service';
import { PrismaService } from 'src/services/prisma.service';
import { RedisService } from 'src/services/storage/redis';
import { TokenService } from 'src/services/storage/token.service';

@Module({
  controllers: [FileReadController],
  providers: [
    FileReadService,
    RedisService,
    TokenService,
    FileRoleService,
    PrismaService,
    MemberService,
  ],
})
export class CloudModule {}
