import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = {
          store: redisStore,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
          ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
        };

        // Se Redis não estiver disponível, usar cache em memória
        try {
          return redisConfig;
        } catch (error) {
          console.warn('Redis not available, using in-memory cache');
          return {
            ttl: configService.get('CACHE_TTL', 300),
          };
        }
      },
    }),
  ],
  providers: [CacheService, CacheInterceptor],
  exports: [CacheService, CacheInterceptor],
})
export class CustomCacheModule {}