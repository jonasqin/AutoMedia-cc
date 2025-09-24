import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="total-posts-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-rate-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-generated-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="scheduled-posts-card"]')).toBeVisible();
  });

  test('should display analytics charts', async ({ page }) => {
    await expect(page.locator('[data-testid="posts-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="growth-chart"]')).toBeVisible();
  });

  test('should show recent posts table', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-posts-table"]')).toBeVisible();

    const rows = await page.locator('[data-testid="post-row"]').count();
    if (rows > 0) {
      await expect(page.locator('[data-testid="post-row"]').first()).toBeVisible();
    }
  });

  test('should filter posts by status', async ({ page }) => {
    await page.click('[data-testid="status-filter"]');
    await page.click('[data-testid="filter-published"]');

    await expect(page.locator('[data-testid="post-row"]')).toHaveCount(0);
  });

  test('should search posts', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'test post');
    await page.press('[data-testid="search-input"]', 'Enter');

    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should view post details', async ({ page }) => {
    const rows = await page.locator('[data-testid="post-row"]').count();
    if (rows > 0) {
      await page.locator('[data-testid="post-row"]').first().click();

      await expect(page).toHaveURL(/\/posts\/.+/);
      await expect(page.locator('[data-testid="post-detail"]')).toBeVisible();
    }
  });

  test('should show real-time updates', async ({ page }) => {
    await page.waitForTimeout(2000);

    const initialPostCount = await page.locator('[data-testid="post-row"]').count();

    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'NEW_POST',
          payload: {
            id: 'test-post',
            title: 'Real-time Test Post',
            status: 'published'
          }
        }
      }));
    });

    await expect(page.locator('[data-testid="toast-info"]')).toContainText('New post received');
  });

  test('should export data', async ({ page }) => {
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-csv"]');

    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should navigate to different sections', async ({ page }) => {
    await page.click('[data-testid="nav-posts"]');
    await expect(page).toHaveURL('/posts');

    await page.click('[data-testid="nav-analytics"]');
    await expect(page).toHaveURL('/analytics');

    await page.click('[data-testid="nav-dashboard"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should show user profile menu', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-option"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-option"]')).toBeVisible();
  });
});