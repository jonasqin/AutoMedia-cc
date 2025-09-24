// Comprehensive analytics tracking for AutoMedia
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
  anonymousId: string;
}

export interface PageView {
  path: string;
  title: string;
  referrer: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  anonymousId: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private eventQueue: AnalyticsEvent[] = [];
  private pageViewQueue: PageView[] = [];
  private sessionId: string;
  private anonymousId: string;
  private userId?: string;
  private isOnline: boolean = navigator.onLine;
  private flushInterval?: NodeJS.Timeout;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.anonymousId = this.generateAnonymousId();
    this.initialize();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initialize() {
    // Track initial page view
    this.trackPageView();

    // Track single page application navigation
    this.setupSPAHistoryTracking();

    // Listen for network changes
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    // Handle page unload
    window.addEventListener('beforeunload', () => this.flush());

    // Start periodic flushing
    this.startPeriodicFlush();

    // Track user engagement
    this.trackEngagement();

    // Track performance metrics
    this.trackPerformanceMetrics();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnonymousId(): string {
    let anonymousId = localStorage.getItem('automedia_anonymous_id');
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('automedia_anonymous_id', anonymousId);
    }
    return anonymousId;
  }

  private setupSPAHistoryTracking() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackPageView();
    };

    window.addEventListener('popstate', () => {
      this.trackPageView();
    });
  }

  private handleOnline() {
    this.isOnline = true;
    this.flush();
  }

  private handleOffline() {
    this.isOnline = false;
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.trackEvent('page_visible');
      this.flush();
    } else if (document.visibilityState === 'hidden') {
      this.trackEvent('page_hidden');
      this.flush();
    }
  }

  private startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  private trackEngagement() {
    let lastActivityTime = Date.now();
    let sessionStartTime = Date.now();
    let isActive = true;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      lastActivityTime = Date.now();
      if (!isActive) {
        isActive = true;
        this.trackEvent('session_resumed', {
          session_duration: Date.now() - sessionStartTime
        });
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Check for inactivity every 30 seconds
    setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;
      if (timeSinceActivity > 300000 && isActive) { // 5 minutes
        isActive = false;
        this.trackEvent('session_paused', {
          session_duration: Date.now() - sessionStartTime
        });
      }
    }, 30000);
  }

  private trackPerformanceMetrics() {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      const trackWebVital = (name: string, value: number) => {
        this.trackEvent('web_vital', { name, value });
      };

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        trackWebVital('lcp', lcp.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          trackWebVital('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let clsValue = 0;
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        trackWebVital('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Track page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.trackEvent('page_load', {
            dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            load_complete: navigation.loadEventEnd - navigation.loadEventStart,
            first_byte: navigation.responseStart - navigation.fetchStart,
            total_time: navigation.loadEventEnd - navigation.fetchStart
          });
        }
      }, 0);
    });
  }

  // Public methods
  trackEvent(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      anonymousId: this.anonymousId
    };

    this.eventQueue.push(analyticsEvent);

    // Flush immediately for important events
    if (this.importantEvents.includes(event)) {
      this.flush();
    }
  }

  trackPageView() {
    const pageView: PageView = {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      anonymousId: this.anonymousId
    };

    this.pageViewQueue.push(pageView);
    this.flush();
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.userId = userId;
    this.trackEvent('identify', { traits });

    // Store user info in localStorage for persistence
    localStorage.setItem('automedia_user_id', userId);
    if (traits) {
      localStorage.setItem('automedia_user_traits', JSON.stringify(traits));
    }
  }

  group(groupId: string, traits?: Record<string, any>) {
    this.trackEvent('group', { groupId, traits });
  }

  alias(aliasId: string) {
    this.trackEvent('alias', { aliasId });
  }

  // User interaction tracking
  trackClick(element: string, properties?: Record<string, any>) {
    this.trackEvent('click', {
      element,
      ...properties
    });
  }

  trackFormSubmit(formName: string, properties?: Record<string, any>) {
    this.trackEvent('form_submit', {
      form_name: formName,
      ...properties
    });
  }

  trackSearch(query: string, results?: number) {
    this.trackEvent('search', {
      query,
      results_count: results
    });
  }

  trackSocialShare(platform: string, content?: string) {
    this.trackEvent('social_share', {
      platform,
      content
    });
  }

  // Business specific tracking
  trackContentGenerated(properties: {
    aiModel: string;
    contentType: string;
    wordCount: number;
    generationTime: number;
  }) {
    this.trackEvent('content_generated', properties);
  }

  trackPostScheduled(properties: {
    platform: string;
    scheduledTime: string;
    contentType: string;
  }) {
    this.trackEvent('post_scheduled', properties);
  }

  trackTwitterInteraction(properties: {
    action: 'like' | 'retweet' | 'reply' | 'mention';
    tweetId?: string;
    engagement?: number;
  }) {
    this.trackEvent('twitter_interaction', properties);
  }

  trackError(error: string, context?: Record<string, any>) {
    this.trackEvent('error', {
      error,
      context
    });
  }

  // E-commerce tracking
  trackPurchase(properties: {
    orderId: string;
    amount: number;
    currency: string;
    products: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }) {
    this.trackEvent('purchase', properties);
  }

  // Queue management
  private async flush() {
    if (!this.isOnline || (this.eventQueue.length === 0 && this.pageViewQueue.length === 0)) {
      return;
    }

    const events = [...this.eventQueue];
    const pageViews = [...this.pageViewQueue];
    this.eventQueue = [];
    this.pageViewQueue = [];

    try {
      await this.sendToServer({
        events,
        pageViews,
        context: this.getContext()
      });
    } catch (error) {
      // Re-queue failed sends
      this.eventQueue.unshift(...events);
      this.pageViewQueue.unshift(...pageViews);
      console.error('Failed to send analytics to server:', error);
    }
  }

  private async sendToServer(data: any) {
    if (typeof fetch === 'undefined') return;

    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
        'X-Anonymous-ID': this.anonymousId,
        'X-User-ID': this.userId || 'anonymous'
      },
      body: JSON.stringify(data),
      keepalive: true
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  private getContext() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      features: this.detectFeatures()
    };
  }

  private detectFeatures() {
    return {
      cookies: navigator.cookieEnabled,
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      webgl: !!document.createElement('canvas').getContext('webgl'),
      websockets: typeof WebSocket !== 'undefined',
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      share: 'share' in navigator,
      payments: 'PaymentRequest' in window
    };
  }

  private importantEvents = [
    'purchase',
    'content_generated',
    'post_scheduled',
    'error',
    'social_share'
  ];

  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// React Hook for analytics
export const useAnalytics = () => {
  const analytics = AnalyticsService.getInstance();

  const trackEvent = (event: string, properties?: Record<string, any>) => {
    analytics.trackEvent(event, properties);
  };

  const trackPageView = () => {
    analytics.trackPageView();
  };

  const identify = (userId: string, traits?: Record<string, any>) => {
    analytics.identify(userId, traits);
  };

  const trackClick = (element: string, properties?: Record<string, any>) => {
    analytics.trackClick(element, properties);
  };

  const trackFormSubmit = (formName: string, properties?: Record<string, any>) => {
    analytics.trackFormSubmit(formName, properties);
  };

  const trackSearch = (query: string, results?: number) => {
    analytics.trackSearch(query, results);
  };

  const trackContentGenerated = (properties: {
    aiModel: string;
    contentType: string;
    wordCount: number;
    generationTime: number;
  }) => {
    analytics.trackContentGenerated(properties);
  };

  const trackPostScheduled = (properties: {
    platform: string;
    scheduledTime: string;
    contentType: string;
  }) => {
    analytics.trackPostScheduled(properties);
  };

  const trackTwitterInteraction = (properties: {
    action: 'like' | 'retweet' | 'reply' | 'mention';
    tweetId?: string;
    engagement?: number;
  }) => {
    analytics.trackTwitterInteraction(properties);
  };

  const trackError = (error: string, context?: Record<string, any>) => {
    analytics.trackError(error, context);
  };

  return {
    trackEvent,
    trackPageView,
    identify,
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackContentGenerated,
    trackPostScheduled,
    trackTwitterInteraction,
    trackError
  };
};