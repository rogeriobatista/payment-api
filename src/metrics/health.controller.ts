import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { PaymentHealthIndicator } from './indicators/payment-health.indicator';
import { TemporalHealthIndicator } from '../workflows/temporal-health.indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private redis: RedisHealthIndicator,
    private payment: PaymentHealthIndicator,
    private temporal: TemporalHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ 
    summary: 'General health check',
    description: 'Performs a comprehensive health check of all system components'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'All systems healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error', 'shutting_down'] },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'One or more systems unhealthy'
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.9 
      }),
      () => this.payment.isHealthy('payment_system'),
      () => this.temporal.isHealthy('temporal'),
    ]);
  }

  @Get('database')
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Database health check',
    description: 'Checks database connectivity and responsiveness'
  })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  checkDatabase(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Redis health check',
    description: 'Checks Redis cache connectivity and responsiveness'
  })
  @ApiResponse({ status: 200, description: 'Redis is healthy' })
  @ApiResponse({ status: 503, description: 'Redis is unhealthy' })
  checkRedis(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('memory')
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Memory health check',
    description: 'Checks application memory usage (heap and RSS)'
  })
  @ApiResponse({ status: 200, description: 'Memory usage is healthy' })
  @ApiResponse({ status: 503, description: 'Memory usage is critical' })
  checkMemory(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  @Get('disk')
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Disk space health check',
    description: 'Checks available disk space'
  })
  @ApiResponse({ status: 200, description: 'Disk space is adequate' })
  @ApiResponse({ status: 503, description: 'Disk space is critical' })
  checkDisk(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.9 
      }),
    ]);
  }

  @Get('payment')
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Payment system health check',
    description: 'Checks payment processing capabilities and external service connectivity'
  })
  @ApiResponse({ status: 200, description: 'Payment system is healthy' })
  @ApiResponse({ status: 503, description: 'Payment system has issues' })
  checkPayment(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.payment.isHealthy('payment_system'),
    ]);
  }

  @Get('temporal')
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Temporal health check',
    description: 'Checks Temporal.io server connectivity and responsiveness'
  })
  @ApiResponse({ status: 200, description: 'Temporal is healthy' })
  @ApiResponse({ status: 503, description: 'Temporal is unhealthy' })
  checkTemporal(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.temporal.isHealthy('temporal'),
    ]);
  }

  @Get('liveness')
  @ApiOperation({ 
    summary: 'Liveness probe',
    description: 'Simple liveness check for Kubernetes or container orchestration'
  })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Readiness probe',
    description: 'Readiness check for Kubernetes or container orchestration'
  })
  @ApiResponse({ status: 200, description: 'Application is ready to serve traffic' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}