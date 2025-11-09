import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('Monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ 
    summary: 'Get Prometheus metrics',
    description: 'Returns metrics in Prometheus format for monitoring and alerting'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics successfully retrieved',
    content: {
      'text/plain': {
        example: '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",route="/payments",status_code="200"} 42'
      }
    }
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('application')
  @ApiOperation({ 
    summary: 'Get application metrics',
    description: 'Returns application-specific metrics in JSON format'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application metrics successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        uptime: { type: 'number', description: 'Application uptime in seconds' },
        memory: {
          type: 'object',
          properties: {
            rss: { type: 'number', description: 'Resident Set Size' },
            heapTotal: { type: 'number', description: 'Total heap size' },
            heapUsed: { type: 'number', description: 'Used heap size' },
            external: { type: 'number', description: 'External memory usage' },
            arrayBuffers: { type: 'number', description: 'Array buffers memory usage' }
          }
        },
        timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'string', description: 'Application version' },
        nodeVersion: { type: 'string', description: 'Node.js version' },
        platform: { type: 'string', description: 'Operating system platform' },
        arch: { type: 'string', description: 'CPU architecture' }
      }
    }
  })
  getApplicationMetrics() {
    return this.metricsService.getApplicationMetrics();
  }
}