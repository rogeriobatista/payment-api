import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, { stack, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Métodos personalizados para diferentes tipos de eventos
  logPaymentCreated(paymentId: string, method: string, amount: number, userId?: string) {
    this.logger.info('Payment created', {
      event: 'payment_created',
      paymentId,
      method,
      amount,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logPaymentUpdated(paymentId: string, oldStatus: string, newStatus: string, userId?: string) {
    this.logger.info('Payment status updated', {
      event: 'payment_updated',
      paymentId,
      oldStatus,
      newStatus,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logWebhookReceived(source: string, eventType: string, data: any) {
    this.logger.info('Webhook received', {
      event: 'webhook_received',
      source,
      eventType,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
    });
  }

  logAuthEvent(event: string, userId?: string, email?: string, ip?: string) {
    this.logger.info('Authentication event', {
      event: `auth_${event}`,
      userId,
      email,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logPerformanceMetric(operation: string, duration: number, metadata?: any) {
    this.logger.info('Performance metric', {
      event: 'performance_metric',
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    const sanitized = JSON.parse(JSON.stringify(data));
    const sensitiveFields = ['password', 'token', 'authorization', 'cpf', 'card_number'];
    
    const sanitizeRecursive = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '***';
        } else if (typeof obj[key] === 'object') {
          sanitizeRecursive(obj[key]);
        }
      }
      
      return obj;
    };
    
    return sanitizeRecursive(sanitized);
  }
}