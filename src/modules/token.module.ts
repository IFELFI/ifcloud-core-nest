import { Module } from '@nestjs/common';
import { RedisService } from 'src/services/storage/redis.service';
import { TokenService } from 'src/services/storage/token.service';

@Module({
  providers: [TokenService, RedisService],
  exports: [TokenService, RedisService],
})
export class TokenModule {}
