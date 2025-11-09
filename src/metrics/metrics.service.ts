import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly httpRequestSize: Histogram<string>;
  private readonly httpResponseSize: Histogram<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly paymentTotal: Counter<string>;
  private readonly paymentAmount: Histogram<string>;
  private readonly webhookTotal: Counter<string>;
  private readonly cacheHitTotal: Counter<string>;
  private readonly databaseQueryDuration: Histogram<string>;

  constructor() {
    // Collect default metrics
    collectDefaultMetrics({ register });

    // HTTP Metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestSize = new Histogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });

    this.httpResponseSize = new Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });

    this.activeConnections = new Gauge({
      name: 'http_active_connections',
      help: 'Number of active HTTP connections',
    });

    // Business Metrics
    this.paymentTotal = new Counter({
      name: 'payments_total',
      help: 'Total number of payments processed',
      labelNames: ['method', 'status'],
    });

    this.paymentAmount = new Histogram({
      name: 'payment_amount_total',
      help: 'Total amount of payments processed',
      labelNames: ['method', 'status'],
      buckets: [10, 50, 100, 500, 1000, 5000, 10000],
    });

    this.webhookTotal = new Counter({
      name: 'webhooks_total',
      help: 'Total number of webhooks received',
      labelNames: ['source', 'event_type', 'status'],
    });

    // Cache Metrics
    this.cacheHitTotal = new Counter({
      name: 'cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'result'],
    });

    // Database Metrics
    this.databaseQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
    });

    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestTotal);
    register.registerMetric(this.httpRequestSize);
    register.registerMetric(this.httpResponseSize);
    register.registerMetric(this.activeConnections);
    register.registerMetric(this.paymentTotal);
    register.registerMetric(this.paymentAmount);
    register.registerMetric(this.webhookTotal);
    register.registerMetric(this.cacheHitTotal);
    register.registerMetric(this.databaseQueryDuration);
  }

  // HTTP Metrics Methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number, requestSize?: number, responseSize?: number) {
    const labels = { method, route, status_code: statusCode.toString() };
    
    this.httpRequestDuration.observe(labels, duration);
    this.httpRequestTotal.inc(labels);
    
    if (requestSize) {
      this.httpRequestSize.observe({ method, route }, requestSize);
    }
    
    if (responseSize) {
      this.httpResponseSize.observe(labels, responseSize);
    }
  }

  incrementActiveConnections() {
    this.activeConnections.inc();
  }

  decrementActiveConnections() {
    this.activeConnections.dec();
  }

  // Business Metrics Methods
  recordPayment(method: string, status: string, amount: number) {
    this.paymentTotal.inc({ method, status });
    this.paymentAmount.observe({ method, status }, amount);
  }

  recordWebhook(source: string, eventType: string, status: string) {
    this.webhookTotal.inc({ source, event_type: eventType, status });
  }

  // Cache Metrics Methods
  recordCacheOperation(operation: 'get' | 'set' | 'del', result: 'hit' | 'miss' | 'success' | 'error') {
    this.cacheHitTotal.inc({ operation, result });
  }

  // Database Metrics Methods
  recordDatabaseQuery(operation: string, table: string, duration: number) {
    this.databaseQueryDuration.observe({ operation, table }, duration);
  }

  // Get metrics for Prometheus
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Custom application metrics
  getApplicationMetrics() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }
}