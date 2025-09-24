import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load login page within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    expect(loadTime).toBeLessThan(3000);

    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should login and load dashboard efficiently', async ({ page }) => {
    await page.goto('/');

    const loginStart = Date.now();
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    const loginEnd = Date.now();
    const loginTime = loginEnd - loginStart;

    expect(loginTime).toBeLessThan(2000);

    const dashboardStart = Date.now();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    const dashboardEnd = Date.now();
    const dashboardLoadTime = dashboardEnd - dashboardStart;

    expect(dashboardLoadTime).toBeLessThan(3000);
  });

  test('should handle large amounts of data efficiently', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    const dataLoadStart = Date.now();
    await page.click('[data-testid="nav-posts"]');
    await expect(page.locator('[data-testid="posts-list"]')).toBeVisible();
    const dataLoadEnd = Date.now();
    const dataLoadTime = dataLoadEnd - dataLoadStart;

    expect(dataLoadTime).toBeLessThan(5000);
  });

  test('should maintain performance with mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileStart = Date.now();
    await page.goto('/');
    const mobileEnd = Date.now();
    const mobileLoadTime = mobileEnd - mobileStart;

    expect(mobileLoadTime).toBeLessThan(4000);

    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should optimize bundle size and lazy loading', async ({ page }) => {
    await page.goto('/');

    const bundleMetrics = await page.evaluate(() => {
      const performance = window.performance;
      return {
        resourceCount: performance.getEntriesByType('resource').length,
        totalSize: performance.getEntriesByType('resource').reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
        largestContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0
      };
    });

    expect(bundleMetrics.totalSize).toBeLessThan(2000000);
    expect(bundleMetrics.largestContentfulPaint).toBeLessThan(2500);
  });

  test('should handle slow network conditions gracefully', async ({ page }) => {
    await page.context().setOffline(true);

    await page.goto('/');

    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

    await page.context().setOffline(false);
    await page.reload();

    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should implement proper caching strategies', async ({ page }) => {
    const firstLoadStart = Date.now();
    await page.goto('/');
    const firstLoadEnd = Date.now();
    const firstLoadTime = firstLoadEnd - firstLoadStart;

    await page.reload();

    const secondLoadStart = Date.now();
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    const secondLoadEnd = Date.now();
    const secondLoadTime = secondLoadEnd - secondLoadStart;

    expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.5);
  });

  test('should maintain performance with concurrent operations', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    const concurrentStart = Date.now();

    await Promise.all([
      page.click('[data-testid="nav-posts"]'),
      page.click('[data-testid="nav-analytics"]'),
      page.click('[data-testid="nav-twitter"]'),
    ]);

    await expect(page.locator('[data-testid="posts-list"]')).toBeVisible();
    const concurrentEnd = Date.now();
    const concurrentTime = concurrentEnd - concurrentStart;

    expect(concurrentTime).toBeLessThan(8000);
  });

  test('should optimize image loading', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    const images = await page.locator('img').all();
    const imageLoadTimes = [];

    for (const image of images) {
      const src = await image.getAttribute('src');
      if (src && !src.includes('data:')) {
        const loadTime = await page.evaluate((imgSrc) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(performance.now());
            img.src = imgSrc;
          });
        }, src);

        imageLoadTimes.push(loadTime);
      }
    }

    if (imageLoadTimes.length > 0) {
      const averageImageLoadTime = imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length;
      expect(averageImageLoadTime).toBeLessThan(1000);
    }
  });

  test('should implement proper error boundaries for performance', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    await page.route('**/api/analytics**', route => route.abort('failed'));

    const errorHandlingStart = Date.now();
    await page.click('[data-testid="nav-analytics"]');
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    const errorHandlingEnd = Date.now();
    const errorHandlingTime = errorHandlingEnd - errorHandlingStart;

    expect(errorHandlingTime).toBeLessThan(3000);
  });

  test('should monitor performance metrics in production', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });

    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000);
    expect(performanceMetrics.loadComplete).toBeLessThan(3000);
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500);
  });
});