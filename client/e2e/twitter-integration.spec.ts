import { test, expect } from '@playwright/test';

test.describe('Twitter Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show Twitter connection status', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await expect(page).toHaveURL('/twitter');

    await expect(page.locator('[data-testid="twitter-connection-status"]')).toBeVisible();
  });

  test('should connect Twitter account', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');

    await expect(page.locator('[data-testid="connect-twitter-button"]')).toBeVisible();
    await page.click('[data-testid="connect-twitter-button"]');

    await expect(page.locator('[data-testid="twitter-auth-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="twitter-oauth-link"]')).toBeVisible();
  });

  test('should display connected account info', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');

    const connectedAccount = await page.locator('[data-testid="twitter-account-info"]').count();
    if (connectedAccount > 0) {
      await expect(page.locator('[data-testid="twitter-username"]')).toBeVisible();
      await expect(page.locator('[data-testid="twitter-avatar"]')).toBeVisible();
      await expect(page.locator('[data-testid="disconnect-button"]')).toBeVisible();
    }
  });

  test('should fetch tweets', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display tweets with engagement metrics', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });

    const tweets = await page.locator('[data-testid="tweet-card"]').count();
    if (tweets > 0) {
      await expect(page.locator('[data-testid="tweet-card"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="tweet-text"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="tweet-likes"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="tweet-retweets"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="tweet-replies"]').first()).toBeVisible();
    }
  });

  test('should filter tweets by date range', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });

    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-12-31');
    await page.click('[data-testid="apply-date-filter"]');

    await expect(page.locator('[data-testid="filtered-tweets"]')).toBeVisible();
  });

  test('should search tweets', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });

    await page.fill('[data-testid="tweet-search"]', 'marketing');
    await page.press('[data-testid="tweet-search"]', 'Enter');

    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should view tweet analytics', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });

    const tweets = await page.locator('[data-testid="tweet-card"]').count();
    if (tweets > 0) {
      await page.locator('[data-testid="tweet-card"]').first().click();

      await expect(page.locator('[data-testid="tweet-analytics-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="tweet-impressions"]')).toBeVisible();
      await expect(page.locator('[data-testid="tweet-engagement-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="tweet-demographics"]')).toBeVisible();
    }
  });

  test('should export tweet data', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });

    const tweets = await page.locator('[data-testid="tweet-card"]').count();
    if (tweets > 0) {
      await page.click('[data-testid="export-tweets-button"]');
      await page.click('[data-testid="export-csv"]');

      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('should show real-time tweet updates', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });

    await page.evaluate(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: {
          type: 'NEW_TWEET',
          payload: {
            id: 'test-tweet',
            text: 'Real-time test tweet',
            likes: 10,
            retweets: 5
          }
        }
      }));
    });

    await expect(page.locator('[data-testid="toast-info"]')).toContainText('New tweet received');
  });

  test('should handle Twitter API rate limits', async ({ page }) => {
    await page.route('**/api/twitter/tweets**', route => route.fulfill({
      status: 429,
      body: JSON.stringify({ error: 'Rate limit exceeded' })
    }));

    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Rate limit');
  });

  test('should display tweet trends', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="trends-tab"]');

    await expect(page.locator('[data-testid="trends-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="trending-topics"]')).toBeVisible();
  });

  test('should show hashtag analysis', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="hashtags-tab"]');

    await expect(page.locator('[data-testid="hashtags-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="hashtag-cloud"]')).toBeVisible();
  });

  test('should disconnect Twitter account', async ({ page }) => {
    await page.click('[data-testid="nav-twitter"]');

    const connectedAccount = await page.locator('[data-testid="disconnect-button"]').count();
    if (connectedAccount > 0) {
      await page.click('[data-testid="disconnect-button"]');
      await page.click('[data-testid="confirm-disconnect"]');

      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Account disconnected');
      await expect(page.locator('[data-testid="connect-twitter-button"]')).toBeVisible();
    }
  });

  test('should show mobile-responsive tweet view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('[data-testid="nav-twitter"]');
    await page.click('[data-testid="fetch-tweets-button"]');

    await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });

    const tweets = await page.locator('[data-testid="tweet-card"]').count();
    if (tweets > 0) {
      await expect(page.locator('[data-testid="tweet-card"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="tweet-card"]').first()).toHaveCSS('max-width', '375px');
    }

    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});