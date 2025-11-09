import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Extract route information
    const method = request.method;
    const route = this.extractRoute(request);
    
    // Get request size
    const requestSize = this.getRequestSize(request);
    
    // Increment active connections
    this.metricsService.incrementActiveConnections();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.recordMetrics(method, route, response.statusCode, startTime, requestSize, data);
          this.metricsService.decrementActiveConnections();
        },
        error: (error) => {
          const statusCode = error.status || 500;
          this.recordMetrics(method, route, statusCode, startTime, requestSize);
          this.metricsService.decrementActiveConnections();
        },
      }),
    );
  }

  private recordMetrics(
    method: string,
    route: string,
    statusCode: number,
    startTime: number,
    requestSize?: number,
    responseData?: any,
  ) {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const responseSize = this.getResponseSize(responseData);

    this.metricsService.recordHttpRequest(
      method,
      route,
      statusCode,
      duration,
      requestSize,
      responseSize,
    );
  }

  private extractRoute(request: Request): string {
    // Try to get the route pattern from NestJS route
    const route = request.route?.path;
    if (route) {
      return route;
    }

    // Fallback to URL pathname with parameter normalization
    const url = request.originalUrl || request.url;
    const pathname = url.split('?')[0]; // Remove query parameters
    
    // Normalize common parameter patterns
    return pathname
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '/:uuid') // Replace UUIDs
      .replace(/\/[a-zA-Z0-9]{20,}/g, '/:token'); // Replace long alphanumeric strings (tokens)
  }

  private getRequestSize(request: Request): number | undefined {
    const contentLength = request.headers['content-length'];
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Estimate size from body if available
    if (request.body) {
      try {
        return Buffer.byteLength(JSON.stringify(request.body), 'utf8');
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private getResponseSize(data?: any): number | undefined {
    if (!data) {
      return undefined;
    }

    try {
      if (typeof data === 'string') {
        return Buffer.byteLength(data, 'utf8');
      }
      
      if (typeof data === 'object') {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }
}