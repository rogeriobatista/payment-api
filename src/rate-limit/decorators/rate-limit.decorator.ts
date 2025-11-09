import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

export function ApiRateLimit(limit: number, ttl: number = 60000) {
  return applyDecorators(
    Throttle({ default: { limit, ttl } })
  );
}

// Presets comuns
export const StrictRateLimit = () => ApiRateLimit(5, 60000); // 5 requests per minute
export const ModerateRateLimit = () => ApiRateLimit(20, 60000); // 20 requests per minute
export const LenientRateLimit = () => ApiRateLimit(100, 60000); // 100 requests per minute