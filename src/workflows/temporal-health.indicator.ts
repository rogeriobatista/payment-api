import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { TemporalService } from './temporal.service';

@Injectable()
export class TemporalHealthIndicator extends HealthIndicator {
  constructor(private readonly temporalService: TemporalService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isHealthy = await this.temporalService.isHealthy();
      
      if (!isHealthy) {
        throw new Error('Temporal server is not accessible');
      }

      const result = this.getStatus(key, true, {
        status: 'up',
        message: 'Temporal server is accessible',
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Temporal error';
      throw new HealthCheckError(
        'Temporal health check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: errorMessage,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }
}