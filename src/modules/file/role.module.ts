import { Module } from '@nestjs/common';
import { FileReadService } from 'src/services/file/read.service';
import { FileRoleService } from 'src/services/file/role.service';
import { RedisService } from 'src/services/storage/redis.service';
import { TokenService } from 'src/services/storage/token.service';

@Module({
  providers: [FileReadService, FileRoleService, TokenService, RedisService],
})
export class RoleModule {}
