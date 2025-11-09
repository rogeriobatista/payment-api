import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class PaymentHealthIndicator extends HealthIndicator {
  constructor() {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      
      // Check payment system components
      const systemChecks = await this.checkPaymentSystemComponents();
      const responseTime = Date.now() - startTime;

      // Health check thresholds
      const isHealthy = responseTime < 1000 && systemChecks.allHealthy;

      if (!isHealthy) {
        throw new Error(`Payment system health check failed: ${systemChecks.issues.join(', ')}`);
      }

      const result = this.getStatus(key, true, {
        status: 'up',
        responseTime: `${responseTime}ms`,
        components: systemChecks.components,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown payment system error';
      throw new HealthCheckError(
        'Payment system health check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: errorMessage,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private async checkPaymentSystemComponents(): Promise<{
    allHealthy: boolean;
    components: any;
    issues: string[];
  }> {
    const components = {
      configuration: this.checkConfiguration(),
      environment: this.checkEnvironment(),
      memory: this.checkMemoryUsage(),
    };

    const issues: string[] = [];
    
    if (!components.configuration.healthy) {
      issues.push('Configuration issues detected');
    }
    
    if (!components.environment.healthy) {
      issues.push('Environment issues detected');
    }
    
    if (!components.memory.healthy) {
      issues.push('Memory usage is high');
    }

    return {
      allHealthy: issues.length === 0,
      components,
      issues,
    };
  }

  private checkConfiguration(): { healthy: boolean; details: any } {
    // Check required environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'REDIS_HOST',
    ];

    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    return {
      healthy: missingVars.length === 0,
      details: {
        requiredVariables: requiredEnvVars.length,
        missingVariables: missingVars,
        configuredVariables: requiredEnvVars.length - missingVars.length,
      },
    };
  }

  private checkEnvironment(): { healthy: boolean; details: any } {
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    const uptime = process.uptime();

    return {
      healthy: true, // Environment checks are informational
      details: {
        nodeVersion,
        platform,
        arch,
        uptime: `${Math.floor(uptime)}s`,
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  private checkMemoryUsage(): { healthy: boolean; details: any } {
    const memoryUsage = process.memoryUsage();
    const maxHeapSize = 512 * 1024 * 1024; // 512MB threshold
    const maxRSSSize = 1024 * 1024 * 1024; // 1GB threshold

    const heapHealthy = memoryUsage.heapUsed < maxHeapSize;
    const rssHealthy = memoryUsage.rss < maxRSSSize;

    return {
      healthy: heapHealthy && rssHealthy,
      details: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        heapHealthy,
        rssHealthy,
      },
    };
  }

  // Check external payment providers health
  async checkExternalProviders(key: string): Promise<HealthIndicatorResult> {
    try {
      const providers = [
        { name: 'stripe', url: 'https://status.stripe.com/' },
        { name: 'paypal', url: 'https://www.paypal-status.com/' },
      ];

      const providerResults = await Promise.allSettled(
        providers.map(async (provider) => {
          const startTime = Date.now();
          
          try {
            const response = await fetch(provider.url, {
              method: 'HEAD', // Use HEAD request for faster response
            });
            
            const responseTime = Date.now() - startTime;
            
            return {
              name: provider.name,
              status: response.ok ? 'up' : 'down',
              responseTime: `${responseTime}ms`,
              httpStatus: response.status,
            };
          } catch (error) {
            return {
              name: provider.name,
              status: 'down',
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      const results = providerResults.map((result) => 
        result.status === 'fulfilled' ? result.value : { 
          name: 'unknown', 
          status: 'error', 
          error: 'Promise rejected' 
        }
      );

      const allHealthy = results.every(result => result.status === 'up');

      if (!allHealthy) {
        const unhealthyProviders = results
          .filter(result => result.status !== 'up')
          .map(result => result.name);
        
        throw new Error(`Unhealthy providers: ${unhealthyProviders.join(', ')}`);
      }

      return this.getStatus(key, true, {
        status: 'up',
        providers: results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'External provider check failed';
      throw new HealthCheckError(
        'External payment providers health check failed',
        this.getStatus(key, false, {
          status: 'down',
          error: errorMessage,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }
}