import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { PaymentHealthIndicator } from './indicators/payment-health.indicator';
import { MetricsInterceptor } from './metrics.interceptor';
import { TemporalHealthIndicator } from '../workflows/temporal-health.indicator';
import { TemporalModule } from '../workflows/temporal.module';

@Module({
  imports: [TerminusModule, TemporalModule],
  controllers: [MetricsController, HealthController],
  providers: [
    MetricsService,
    RedisHealthIndicator,
    PaymentHealthIndicator,
    TemporalHealthIndicator,
    MetricsInterceptor,
  ],
  exports: [MetricsService, MetricsInterceptor],
})
export class MetricsModule {}