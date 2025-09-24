import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'automedia-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// HTTP request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override end method to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;

    // Log response
    logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date().toISOString()
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  next(error);
};

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    // Log performance metrics
    logger.info('Performance Metrics', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    });

    // Alert for slow requests
    if (duration > 1000) { // 1 second threshold
      logger.warn('Slow Request Detected', {
        method: req.method,
        url: req.url,
        duration,
        threshold: 1000,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

// Database query logging
export const dbQueryLogger = (query: string, params: any[], duration: number) => {
  logger.info('Database Query', {
    query: query.substring(0, 200), // Truncate long queries
    params: params.length > 0 ? params : undefined,
    duration,
    timestamp: new Date().toISOString()
  });
};

// Security event logging
export const securityLogger = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

// API rate limiting logging
export const rateLimitLogger = (ip: string, endpoint: string, limit: number, remaining: number) => {
  logger.info('Rate Limit Check', {
    ip,
    endpoint,
    limit,
    remaining,
    timestamp: new Date().toISOString()
  });
};

// Business event logging
export const businessEventLogger = (event: string, userId: string, details: any) => {
  logger.info('Business Event', {
    event,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

export default logger;