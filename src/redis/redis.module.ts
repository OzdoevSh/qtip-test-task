import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', '127.0.0.1'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: configService.get('REDIS_TTL', 5 * 60 * 1000),
      }),
      isGlobal: true,
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
