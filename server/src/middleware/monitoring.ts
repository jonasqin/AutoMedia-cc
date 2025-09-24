import { Request, Response, NextFunction } from 'express';
import logger from './logging';

// Metrics storage
interface Metrics {
  requests: {
    total: number;
    success: number;
    error: number;
  };
  responseTime: {
    total: number;
    count: number;
    min: number;
    max: number;
  };
  endpoints: Record<string, {
    count: number;
    responseTime: number;
    errors: number;
  }>;
  errors: {
    count: number;
    types: Record<string, number>;
  };
  database: {
    queries: number;
    slowQueries: number;
    averageTime: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Metrics;
  private startTime: Date;

  private constructor() {
    this.startTime = new Date();
    this.resetMetrics();
    this.startPeriodicReporting();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0
      },
      responseTime: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0
      },
      endpoints: {},
      errors: {
        count: 0,
        types: {}
      },
      database: {
        queries: 0,
        slowQueries: 0,
        averageTime: 0
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      }
    };
  }

  private startPeriodicReporting() {
    // Report metrics every minute
    setInterval(() => {
      this.reportMetrics();
    }, 60000);

    // Reset metrics every hour
    setInterval(() => {
      this.resetMetrics();
    }, 3600000);
  }

  // Request monitoring
  trackRequest(req: Request, res: Response, responseTime: number) {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    this.metrics.requests.total++;

    if (res.statusCode >= 200 && res.statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.error++;
    }

    // Update response time metrics
    this.metrics.responseTime.total += responseTime;
    this.metrics.responseTime.count++;
    this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, responseTime);
    this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, responseTime);

    // Update endpoint metrics
    if (!this.metrics.endpoints[endpoint]) {
      this.metrics.endpoints[endpoint] = {
        count: 0,
        responseTime: 0,
        errors: 0
      };
    }
    this.metrics.endpoints[endpoint].count++;
    this.metrics.endpoints[endpoint].responseTime += responseTime;

    if (res.statusCode >= 400) {
      this.metrics.endpoints[endpoint].errors++;
    }
  }

  // Error tracking
  trackError(error: Error, endpoint: string) {
    this.metrics.errors.count++;
    const errorType = error.constructor.name;
    this.metrics.errors.types[errorType] = (this.metrics.errors.types[errorType] || 0) + 1;

    logger.error('Error tracked', {
      error: error.message,
      type: errorType,
      endpoint,
      stack: error.stack
    });
  }

  // Database monitoring
  trackDatabaseQuery(duration: number) {
    this.metrics.database.queries++;
    this.metrics.database.averageTime =
      (this.metrics.database.averageTime * (this.metrics.database.queries - 1) + duration) /
      this.metrics.database.queries;

    if (duration > 1000) { // Slow query threshold
      this.metrics.database.slowQueries++;
      logger.warn('Slow database query detected', { duration });
    }
  }

  // Memory monitoring
  updateMemoryMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    };
  }

  // Health check
  getHealthStatus() {
    this.updateMemoryMetrics();

    const uptime = Date.now() - this.startTime.getTime();
    const avgResponseTime = this.metrics.responseTime.count > 0
      ? this.metrics.responseTime.total / this.metrics.responseTime.count
      : 0;

    const errorRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.error / this.metrics.requests.total) * 100
      : 0;

    const health = {
      status: 'healthy',
      uptime,
      memory: this.metrics.memory,
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        error: this.metrics.requests.error,
        errorRate: Math.round(errorRate * 100) / 100
      },
      performance: {
        averageResponseTime: Math.round(avgResponseTime),
        minResponseTime: this.metrics.responseTime.min === Infinity ? 0 : this.metrics.responseTime.min,
        maxResponseTime: this.metrics.responseTime.max
      },
      database: {
        queries: this.metrics.database.queries,
        slowQueries: this.metrics.database.slowQueries,
        averageQueryTime: Math.round(this.metrics.database.averageTime)
      },
      endpoints: this.metrics.endpoints,
      timestamp: new Date().toISOString()
    };

    // Determine overall health status
    if (errorRate > 5 || avgResponseTime > 2000 || this.metrics.memory.percentage > 90) {
      health.status = 'degraded';
    }

    if (errorRate > 10 || avgResponseTime > 5000 || this.metrics.memory.percentage > 95) {
      health.status = 'unhealthy';
    }

    return health;
  }

  // Report metrics
  private reportMetrics() {
    const health = this.getHealthStatus();

    logger.info('System Health Report', {
      status: health.status,
      uptime: health.uptime,
      memory: health.memory,
      requests: health.requests,
      performance: health.performance,
      database: health.database
    });

    // Send to external monitoring service if configured
    if (process.env.MONITORING_SERVICE_URL) {
      this.sendToExternalService(health);
    }
  }

  private async sendToExternalService(data: any) {
    try {
      const response = await fetch(process.env.MONITORING_SERVICE_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_SERVICE_TOKEN}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        logger.error('Failed to send metrics to external service', {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      logger.error('Error sending metrics to external service', { error });
    }
  }

  // Get metrics dashboard data
  getDashboardData() {
    return this.getHealthStatus();
  }
}

// Express middleware
export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const monitoring = MonitoringService.getInstance();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitoring.trackRequest(req, res, responseTime);
  });

  next();
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  const monitoring = MonitoringService.getInstance();
  const health = monitoring.getHealthStatus();

  const statusCode = health.status === 'healthy' ? 200 :
                    health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
};

// Metrics endpoint
export const getMetrics = (req: Request, res: Response) => {
  const monitoring = MonitoringService.getInstance();
  const metrics = monitoring.getDashboardData();

  res.json(metrics);
};

// Database query monitoring
export const trackDatabaseQuery = (duration: number) => {
  const monitoring = MonitoringService.getInstance();
  monitoring.trackDatabaseQuery(duration);
};

export default MonitoringService;