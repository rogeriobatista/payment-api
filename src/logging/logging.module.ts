import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LoggerService } from './logger.service';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get('NODE_ENV') === 'development';
        
        return {
          level: configService.get('LOG_LEVEL', 'info'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
          ),
          defaultMeta: {
            service: 'payment-api',
            version: process.env.npm_package_version || '1.0.0',
          },
          transports: [
            new winston.transports.Console({
              format: isDevelopment
                ? winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                  )
                : winston.format.json(),
            }),
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            }),
          ],
        };
      },
    }),
  ],
  providers: [LoggingInterceptor, LoggerService],
  exports: [LoggingInterceptor, LoggerService],
})
export class LoggingModule {}