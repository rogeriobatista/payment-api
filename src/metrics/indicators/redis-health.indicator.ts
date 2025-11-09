import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private redis: Redis;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      connectTimeout: 5000,
      lazyConnect: true,
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Test Redis connection with ping
      const startTime = Date.now();
      const pong = await this.redis.ping();
      const responseTime = Date.now() - startTime;

      if (pong !== 'PONG') {
        throw new Error('Redis ping response is not PONG');
      }

      // Test basic operations
      const testKey = `health_check_${Date.now()}`;
      await this.redis.set(testKey, 'test_value', 'EX', 10);
      const value = await this.redis.get(testKey);
      await this.redis.del(testKey);

      if (value !== 'test_value') {
        throw new Error('Redis set/get operation failed');
      }

      // Get Redis info
      const info = await this.redis.info('server');
      const memoryInfo = await this.redis.info('memory');
      
      const result = this.getStatus(key, true, {
        status: 'up',
        responseTime: `${responseTime}ms`,
        connection: 'active',
        operations: 'working',
        server: this.parseRedisInfo(info),
        memory: this.parseRedisMemoryInfo(memoryInfo),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Redis error';
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: errorMessage,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }
    
    return {
      version: result.redis_version,
      mode: result.redis_mode,
      uptime: result.uptime_in_seconds,
      connected_clients: result.connected_clients,
    };
  }

  private parseRedisMemoryInfo(memoryInfo: string): any {
    const lines = memoryInfo.split('\r\n');
    const result: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }
    
    return {
      used_memory: result.used_memory,
      used_memory_human: result.used_memory_human,
      used_memory_peak: result.used_memory_peak,
      used_memory_peak_human: result.used_memory_peak_human,
      maxmemory: result.maxmemory,
    };
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}