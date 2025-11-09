import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { typeOrmConfig } from './infrastructure/database/database.config';
import { PaymentModule } from './payment.module';
import { AuthModule } from './auth/auth.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { LoggingModule } from './logging/logging.module';
import { CustomCacheModule } from './cache/cache.module';
import { MetricsModule } from './metrics/metrics.module';
import { TemporalModule } from './workflows/temporal.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => typeOrmConfig(configService),
    }),
    PaymentModule,
    AuthModule,
    RateLimitModule,
    LoggingModule,
    CustomCacheModule,
    MetricsModule,
    TemporalModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}