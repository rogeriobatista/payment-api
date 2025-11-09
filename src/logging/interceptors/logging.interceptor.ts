import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    const logData = {
      method,
      url,
      ip,
      userAgent,
      body: this.sanitizeBody(body),
      query,
      params,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`Incoming Request: ${method} ${url}`, logData);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const logResponse = {
          ...logData,
          statusCode: response.statusCode,
          duration: `${duration}ms`,
          responseSize: JSON.stringify(data).length,
        };
        
        this.logger.log(`Outgoing Response: ${method} ${url} - ${response.statusCode}`, logResponse);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const logError = {
          ...logData,
          statusCode: error.status || 500,
          duration: `${duration}ms`,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        };
        
        this.logger.error(`Error Response: ${method} ${url} - ${error.status || 500}`, logError);
        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'authorization', 'cpf'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });
    
    return sanitized;
  }
}