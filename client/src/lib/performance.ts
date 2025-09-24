// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lcp = entries[entries.length - 1];
        this.recordMetric('lcp', lcp.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        let clsValue = 0;
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Send to analytics service
    this.sendToAnalytics(name, value);
  }

  private sendToAnalytics(name: string, value: number) {
    // Send to your analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value,
        custom_parameter_1: 'automedia'
      });
    }
  }

  getMetrics() {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        result[name] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    });

    return result;
  }

  // Track custom performance metrics
  trackCustomMetric(name: string, callback: () => void) {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    this.recordMetric(`custom_${name}`, endTime - startTime);
  }

  // Measure component render time
  measureComponentRender(componentName: string) {
    return {
      start: () => {
        performance.mark(`${componentName}_start`);
      },
      end: () => {
        performance.mark(`${componentName}_end`);
        performance.measure(componentName, `${componentName}_start`, `${componentName}_end`);
        const measures = performance.getEntriesByName(componentName);
        const measure = measures[measures.length - 1];
        this.recordMetric(`component_${componentName}`, measure.duration);
      }
    };
  }

  // Track API response times
  trackApiCall(endpoint: string) {
    const startTime = performance.now();
    return {
      end: () => {
        const endTime = performance.now();
        this.recordMetric(`api_${endpoint}`, endTime - startTime);
      }
    };
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null,
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };

    return report;
  }

  private generateRecommendations(metrics: any) {
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp.avg > 2500) {
      recommendations.push('LCP is slow. Consider optimizing images, reducing server response time, or removing render-blocking resources.');
    }

    if (metrics.fid && metrics.fid.avg > 100) {
      recommendations.push('FID is high. Reduce JavaScript execution time, break up long tasks, and optimize event handlers.');
    }

    if (metrics.cls && metrics.cls.avg > 0.1) {
      recommendations.push('CLS is high. Ensure images have dimensions, avoid inserting content above existing content, and use CSS transforms for animations.');
    }

    return recommendations;
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.metrics.clear();
  }
}

// React Hook for performance monitoring
export const usePerformance = () => {
  const monitor = PerformanceMonitor.getInstance();

  const trackComponentRender = (componentName: string) => {
    const measure = monitor.measureComponentRender(componentName);
    return {
      start: measure.start,
      end: measure.end
    };
  };

  const trackApiCall = (endpoint: string) => {
    return monitor.trackApiCall(endpoint);
  };

  return {
    trackComponentRender,
    trackApiCall,
    getMetrics: monitor.getMetrics.bind(monitor),
    generateReport: monitor.generateReport.bind(monitor)
  };
};

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for performance optimization
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance optimization
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Lazy load images
  lazyLoadImages: () => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  },

  // Preload critical resources
  preloadResources: (resources: string[]) => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = resource.endsWith('.js') ? 'script' :
                resource.endsWith('.css') ? 'style' : 'fetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  },

  // Optimize animations
  optimizeAnimations: () => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    }
  }
};