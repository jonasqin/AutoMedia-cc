// Error tracking and monitoring utilities
export interface ErrorEvent {
  type: 'error' | 'unhandledrejection' | 'resource';
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  userAgent: string;
  url: string;
  context?: any;
}

export interface PerformanceEvent {
  type: 'navigation' | 'resource' | 'paint' | 'measure';
  name: string;
  value: number;
  timestamp: number;
  metadata?: any;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errorQueue: ErrorEvent[] = [];
  private performanceQueue: PerformanceEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private initialize() {
    // Global error handlers
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Performance monitoring
    this.observePerformance();

    // Start periodic flushing
    this.startPeriodicFlush();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Handle page unload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Error handling
  private handleError(event: ErrorEvent) {
    const errorEvent: ErrorEvent = {
      type: 'error',
      message: event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: this.getContext()
    };

    this.errorQueue.push(errorEvent);
    this.logErrorToConsole(errorEvent);
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const errorEvent: ErrorEvent = {
      type: 'unhandledrejection',
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: this.getContext()
    };

    this.errorQueue.push(errorEvent);
    this.logErrorToConsole(errorEvent);
  }

  private handleOnline() {
    this.isOnline = true;
    this.flushQueues();
  }

  private handleOffline() {
    this.isOnline = false;
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.flushQueues();
    }
  }

  private handleBeforeUnload() {
    this.flushQueues();
  }

  // Performance monitoring
  private observePerformance() {
    if ('PerformanceObserver' in window) {
      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.trackPerformance({
              type: 'navigation',
              name: 'page_load',
              value: entry.loadEventEnd - entry.fetchStart,
              timestamp: Date.now(),
              metadata: {
                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                firstPaint: 0, // Will be captured by paint observer
                timeToInteractive: 0
              }
            });
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.trackPerformance({
              type: 'resource',
              name: entry.name,
              value: entry.duration,
              timestamp: Date.now(),
              metadata: {
                size: entry.transferSize,
                type: entry.initiatorType
              }
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Paint timing
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'paint') {
            this.trackPerformance({
              type: 'paint',
              name: entry.name,
              value: entry.startTime,
              timestamp: Date.now()
            });
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    }

    // Core Web Vitals
    this.trackWebVitals();
  }

  private trackWebVitals() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        this.trackPerformance({
          type: 'measure',
          name: 'lcp',
          value: lcp.startTime,
          timestamp: Date.now()
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.trackPerformance({
            type: 'measure',
            name: 'fid',
            value: entry.processingStart - entry.startTime,
            timestamp: Date.now()
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let clsValue = 0;
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.trackPerformance({
          type: 'measure',
          name: 'cls',
          value: clsValue,
          timestamp: Date.now()
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Public methods
  trackError(error: Error | string, context?: any) {
    const errorEvent: ErrorEvent = {
      type: 'error',
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: { ...this.getContext(), ...context }
    };

    this.errorQueue.push(errorEvent);
    this.logErrorToConsole(errorEvent);
  }

  trackPerformance(event: PerformanceEvent) {
    this.performanceQueue.push(event);
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  clearUser() {
    this.userId = undefined;
  }

  // Context gathering
  private getContext(): any {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
        saveData: (navigator as any).connection.saveData
      } : null,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    };
  }

  // Queue management
  private startPeriodicFlush() {
    setInterval(() => {
      this.flushQueues();
    }, 30000); // Flush every 30 seconds
  }

  private flushQueues() {
    if (!this.isOnline) return;

    if (this.errorQueue.length > 0) {
      this.flushErrors();
    }

    if (this.performanceQueue.length > 0) {
      this.flushPerformance();
    }
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await this.sendToServer('/api/errors', errors);
    } catch (error) {
      // Re-queue failed sends
      this.errorQueue.unshift(...errors);
      console.error('Failed to send errors to server:', error);
    }
  }

  private async flushPerformance() {
    if (this.performanceQueue.length === 0) return;

    const performance = [...this.performanceQueue];
    this.performanceQueue = [];

    try {
      await this.sendToServer('/api/performance', performance);
    } catch (error) {
      // Re-queue failed sends
      this.performanceQueue.unshift(...performance);
      console.error('Failed to send performance data to server:', error);
    }
  }

  private async sendToServer(endpoint: string, data: any) {
    if (typeof fetch === 'undefined') return;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
        'X-User-ID': this.userId || 'anonymous'
      },
      body: JSON.stringify(data),
      keepalive: true // Use keepalive for sendBeacon-like behavior
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private logErrorToConsole(errorEvent: ErrorEvent) {
    console.group(`🚨 Error: ${errorEvent.message}`);
    console.error('Stack:', errorEvent.stack);
    console.error('Context:', errorEvent.context);
    console.groupEnd();
  }

  // React Error Boundary integration
  createErrorBoundary() {
    return class ErrorBoundary extends React.Component {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        ErrorTracker.getInstance().trackError(error, {
          componentStack: errorInfo.componentStack,
          ...errorInfo
        });
      }

      render() {
        if (this.state.hasError) {
          return this.props.fallback || <div>Something went wrong.</div>;
        }

        return this.props.children;
      }
    };
  }

  // Analytics integration
  trackUserAction(action: string, properties?: any) {
    this.trackPerformance({
      type: 'measure',
      name: action,
      value: Date.now(),
      timestamp: Date.now(),
      metadata: properties
    });
  }

  trackPageView() {
    this.trackPerformance({
      type: 'navigation',
      name: 'page_view',
      value: Date.now(),
      timestamp: Date.now(),
      metadata: {
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      }
    });
  }
}

// React Hook for error tracking
export const useErrorTracker = () => {
  const errorTracker = ErrorTracker.getInstance();

  const trackError = (error: Error | string, context?: any) => {
    errorTracker.trackError(error, context);
  };

  const trackPerformance = (event: Omit<PerformanceEvent, 'timestamp'>) => {
    errorTracker.trackPerformance({ ...event, timestamp: Date.now() });
  };

  const trackUserAction = (action: string, properties?: any) => {
    errorTracker.trackUserAction(action, properties);
  };

  const trackPageView = () => {
    errorTracker.trackPageView();
  };

  return {
    trackError,
    trackPerformance,
    trackUserAction,
    trackPageView,
    ErrorBoundary: errorTracker.createErrorBoundary()
  };
};