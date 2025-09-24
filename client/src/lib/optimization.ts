// Performance optimization utilities and helpers
export class OptimizationService {
  private static instance: OptimizationService;
  private observers: IntersectionObserver[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private optimized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): OptimizationService {
    if (!OptimizationService.instance) {
      OptimizationService.instance = new OptimizationService();
    }
    return OptimizationService.instance;
  }

  private initialize() {
    this.setupIntersectionObservers();
    this.setupResizeObserver();
    this.setupMutationObserver();
    this.optimizeImages();
    this.optimizeAnimations();
    this.optimizeScrolling();
    this.optimizeResources();
  }

  // Lazy loading utilities
  private setupIntersectionObservers() {
    // Images lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadImage(img);
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    this.observers.push(imageObserver);

    // Components lazy loading
    const componentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          this.loadComponent(element);
          componentObserver.unobserve(element);
        }
      });
    }, {
      rootMargin: '100px 0px',
      threshold: 0.05
    });

    this.observers.push(componentObserver);

    // Start observing
    this.observeNewElements();
  }

  private observeNewElements() {
    // Observe existing images
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.observers[0].observe(img);
    });

    // Observe lazy components
    document.querySelectorAll('[data-lazy]').forEach(element => {
      this.observers[1].observe(element);
    });
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.classList.remove('lazy');
      img.classList.add('loaded');
    }
  }

  private loadComponent(element: HTMLElement) {
    const componentName = element.dataset.lazy;
    if (componentName) {
      // Trigger component loading
      element.dispatchEvent(new CustomEvent('loadComponent', {
        detail: { component: componentName }
      }));
      element.classList.add('loaded');
    }
  }

  // Resize observer for dynamic adjustments
  private setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        entries.forEach(entry => {
          this.handleResize(entry.target as HTMLElement);
        });
      });

      // Observe key containers
      document.querySelectorAll('[data-responsive]').forEach(element => {
        this.resizeObserver?.observe(element);
      });
    }
  }

  private handleResize(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const breakpoint = this.getBreakpoint(rect.width);

    // Update responsive classes
    element.setAttribute('data-breakpoint', breakpoint);

    // Trigger responsive events
    element.dispatchEvent(new CustomEvent('responsiveChange', {
      detail: { breakpoint, width: rect.width }
    }));
  }

  private getBreakpoint(width: number): string {
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    return 'xl';
  }

  // Mutation observer for dynamic content
  private setupMutationObserver() {
    if ('MutationObserver' in window) {
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          this.handleMutation(mutation);
        });
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-src', 'data-lazy']
      });
    }
  }

  private handleMutation(mutation: MutationRecord) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          this.optimizeNewElement(element);
        }
      });
    } else if (mutation.type === 'attributes') {
      const element = mutation.target as HTMLElement;
      if (mutation.attributeName === 'data-src') {
        this.observers[0].observe(element);
      } else if (mutation.attributeName === 'data-lazy') {
        this.observers[1].observe(element);
      }
    }
  }

  private optimizeNewElement(element: HTMLElement) {
    // Optimize images
    element.querySelectorAll('img[data-src]').forEach(img => {
      this.observers[0].observe(img);
    });

    // Optimize lazy components
    element.querySelectorAll('[data-lazy]').forEach(el => {
      this.observers[1].observe(el);
    });

    // Optimize responsive elements
    element.querySelectorAll('[data-responsive]').forEach(el => {
      this.resizeObserver?.observe(el);
    });
  }

  // Image optimization
  private optimizeImages() {
    // Add loading="lazy" to all images
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.setAttribute('loading', 'lazy');
    });

    // Optimize image formats
    document.querySelectorAll('img').forEach(img => {
      const src = img.src;
      if (src && !src.includes('data:')) {
        this.optimizeImageFormat(img);
      }
    });
  }

  private optimizeImageFormat(img: HTMLImageElement) {
    // Check browser support for modern formats
    const supportsWebP = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    const supportsAvif = document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;

    if (supportsAvif && !img.src.includes('.avif')) {
      // Try to load AVIF version
      const avifSrc = img.src.replace(/\.(jpg|jpeg|png|webp)$/, '.avif');
      this.testImageSupport(avifSrc).then(supported => {
        if (supported) img.src = avifSrc;
      });
    } else if (supportsWebP && !img.src.includes('.webp')) {
      // Try to load WebP version
      const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/, '.webp');
      this.testImageSupport(webpSrc).then(supported => {
        if (supported) img.src = webpSrc;
      });
    }
  }

  private async testImageSupport(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  // Animation optimization
  private optimizeAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    }

    // Optimize animation performance
    document.querySelectorAll('*').forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.animationName !== 'none' || computedStyle.transition !== 'none') {
        this.optimizeAnimationPerformance(element as HTMLElement);
      }
    });
  }

  private optimizeAnimationPerformance(element: HTMLElement) {
    // Add will-change for complex animations
    const computedStyle = window.getComputedStyle(element);
    if (
      computedStyle.transform !== 'none' ||
      computedStyle.opacity !== '1' ||
      computedStyle.filter !== 'none'
    ) {
      element.style.willChange = 'transform, opacity, filter';
    }

    // Use GPU acceleration for animations
    if (computedStyle.animationName !== 'none') {
      element.style.transform = 'translateZ(0)';
    }
  }

  // Scroll optimization
  private optimizeScrolling() {
    let ticking = false;
    let lastScrollY = window.scrollY;
    let scrollDirection = 'down';

    const optimizedScroll = () => {
      const currentScrollY = window.scrollY;
      scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';

      // Update scroll position
      lastScrollY = currentScrollY;

      // Dispatch scroll event with direction
      window.dispatchEvent(new CustomEvent('optimizedScroll', {
        detail: { scrollY: currentScrollY, direction: scrollDirection }
      }));

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(optimizedScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Optimize scroll-based animations
    this.setupScrollAnimations();
  }

  private setupScrollAnimations() {
    const scrollElements = document.querySelectorAll('[data-animate-on-scroll]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const animation = element.dataset.animateOnScroll;
          if (animation) {
            element.classList.add(animation);
            element.classList.add('animated');
          }
        }
      });
    }, {
      threshold: 0.1
    });

    scrollElements.forEach(element => {
      observer.observe(element);
    });

    this.observers.push(observer);
  }

  // Resource optimization
  private optimizeResources() {
    // Preload critical resources
    this.preloadCriticalResources();

    // Optimize font loading
    this.optimizeFontLoading();

    // Optimize third-party scripts
    this.optimizeThirdPartyScripts();

    // Setup resource hints
    this.setupResourceHints();
  }

  private preloadCriticalResources() {
    const criticalResources = [
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { href: '/icons/icon-192x192.png', as: 'image', type: 'image/png' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.setAttribute('type', resource.type);
      if (resource.crossOrigin) link.setAttribute('crossorigin', resource.crossOrigin);
      document.head.appendChild(link);
    });
  }

  private optimizeFontLoading() {
    // Use font-display: swap for all fonts
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  private optimizeThirdPartyScripts() {
    // Add async/defer to third-party scripts
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src && this.isThirdPartyScript(src)) {
        script.setAttribute('async', '');
        script.setAttribute('defer', '');
      }
    });
  }

  private isThirdPartyScript(src: string): boolean {
    const thirdPartyDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.net',
      'twitter.com',
      'linkedin.com',
      'hotjar.com',
      'mixpanel.com'
    ];

    return thirdPartyDomains.some(domain => src.includes(domain));
  }

  private setupResourceHints() {
    // DNS prefetch for third-party domains
    const domains = [
      '//fonts.googleapis.com',
      '//fonts.gstatic.com',
      '//www.google-analytics.com',
      '//api.twitter.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Preconnect for critical domains
    const criticalDomains = [
      '//fonts.googleapis.com',
      '//fonts.gstatic.com'
    ];

    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.setAttribute('crossorigin', '');
      document.head.appendChild(link);
    });
  }

  // Performance monitoring
  measurePerformance(name: string, callback: () => void) {
    const start = performance.now();
    callback();
    const end = performance.now();
    const duration = end - start;

    console.log(`${name} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  // Memory optimization
  optimizeMemory() {
    // Clean up unused event listeners
    this.cleanupEventListeners();

    // Optimize large data structures
    this.optimizeDataStructures();

    // Clear unused caches
    this.clearUnusedCaches();
  }

  private cleanupEventListeners() {
    // This would be implemented based on your specific needs
    // For now, it's a placeholder for memory optimization
  }

  private optimizeDataStructures() {
    // Optimize large arrays and objects
    if ('WeakMap' in window) {
      // Use WeakMap for object references when possible
    }
  }

  private clearUnusedCaches() {
    // Clear browser caches if they're too large
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('automedia-'))
            .map(name => {
              return caches.open(name).then(cache => {
                return cache.keys().then(keys => {
                  if (keys.length > 100) {
                    // Clean up old entries
                    return Promise.all(keys.slice(100).map(key => cache.delete(key)));
                  }
                });
              });
            })
        );
      });
    }
  }

  // Public methods
  addLazyElement(element: HTMLElement) {
    if (element.tagName === 'IMG') {
      this.observers[0].observe(element);
    } else {
      this.observers[1].observe(element);
    }
  }

  removeOptimizations() {
    // Clean up all observers
    this.observers.forEach(observer => observer.disconnect());
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.mutationObserver) this.mutationObserver.disconnect();
  }
}

// React Hook for optimization
export const useOptimization = () => {
  const optimization = OptimizationService.getInstance();

  const addLazyElement = (element: HTMLElement) => {
    optimization.addLazyElement(element);
  };

  const measurePerformance = (name: string, callback: () => void) => {
    return optimization.measurePerformance(name, callback);
  };

  const optimizeMemory = () => {
    optimization.optimizeMemory();
  };

  return {
    addLazyElement,
    measurePerformance,
    optimizeMemory
  };
};