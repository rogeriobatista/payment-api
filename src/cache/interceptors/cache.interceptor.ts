import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { Reflector } from '@nestjs/core';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

export const CacheKey = (key: string) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value);
};

export const CacheTTL = (ttl: number) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler()) || 300;

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fullCacheKey = this.buildCacheKey(cacheKey, request);

    // Tentar buscar do cache
    const cachedResult = await this.cacheService.get(fullCacheKey);
    if (cachedResult !== undefined) {
      return of(cachedResult);
    }

    // Se não estiver no cache, executar o handler e cachear o resultado
    return next.handle().pipe(
      tap(async (response) => {
        if (response) {
          await this.cacheService.set(fullCacheKey, response, cacheTTL);
        }
      }),
    );
  }

  private buildCacheKey(baseKey: string, request: any): string {
    const { query, params, body } = request;
    const keyParts = [baseKey];

    if (params && Object.keys(params).length > 0) {
      keyParts.push(`params:${JSON.stringify(params)}`);
    }

    if (query && Object.keys(query).length > 0) {
      keyParts.push(`query:${JSON.stringify(query)}`);
    }

    // Para métodos POST/PUT, incluir hash do body (cuidado com dados sensíveis)
    if (body && Object.keys(body).length > 0 && request.method === 'POST') {
      const sanitizedBody = this.sanitizeBody(body);
      keyParts.push(`body:${JSON.stringify(sanitizedBody)}`);
    }

    return keyParts.join('|');
  }

  private sanitizeBody(body: any): any {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'authorization', 'cpf'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });
    
    return sanitized;
  }
}