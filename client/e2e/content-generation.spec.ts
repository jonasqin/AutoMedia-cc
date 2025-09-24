import { test, expect } from '@playwright/test';

test.describe('Content Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to content generation page', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await expect(page).toHaveURL('/generate');
    await expect(page.locator('[data-testid="content-generator"]')).toBeVisible();
  });

  test('should display AI generation options', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');

    await expect(page.locator('[data-testid="ai-model-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="tone-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="length-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="topic-input"]')).toBeVisible();
  });

  test('should generate content with AI', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.fill('[data-testid="topic-input"]', 'Social media marketing trends 2024');
    await page.selectOption('[data-testid="ai-model-select"]', 'gpt-4');
    await page.selectOption('[data-testid="tone-select"]', 'professional');
    await page.selectOption('[data-testid="length-select"]', 'medium');
    await page.click('[data-testid="generate-button"]');

    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({ timeout: 30000 });
  });

  test('should show generation history', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.click('[data-testid="history-tab"]');

    await expect(page.locator('[data-testid="generation-history"]')).toBeVisible();

    const historyItems = await page.locator('[data-testid="history-item"]').count();
    if (historyItems > 0) {
      await expect(page.locator('[data-testid="history-item"]').first()).toBeVisible();
    }
  });

  test('should edit generated content', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.fill('[data-testid="topic-input"]', 'Test topic for editing');
    await page.click('[data-testid="generate-button"]');

    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({ timeout: 30000 });

    await page.fill('[data-testid="content-editor"]', 'Edited content with new ideas');
    await page.click('[data-testid="save-content-button"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Content saved successfully');
  });

  test('should preview content before posting', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.fill('[data-testid="topic-input"]', 'Preview test content');
    await page.click('[data-testid="generate-button"]');

    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({ timeout: 30000 });

    await page.click('[data-testid="preview-button"]');
    await expect(page.locator('[data-testid="content-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-post-button"]')).toBeVisible();
  });

  test('should schedule post', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.fill('[data-testid="topic-input"]', 'Scheduled post content');
    await page.click('[data-testid="generate-button"]');

    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({ timeout: 30000 });

    await page.click('[data-testid="schedule-button"]');
    await page.fill('[data-testid="schedule-date"]', '2024-12-25T10:00');
    await page.click('[data-testid="confirm-schedule-button"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Post scheduled successfully');
  });

  test('should use templates', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.click('[data-testid="templates-tab"]');

    await expect(page.locator('[data-testid="templates-grid"]')).toBeVisible();

    const templates = await page.locator('[data-testid="template-card"]').count();
    if (templates > 0) {
      await page.locator('[data-testid="template-card"]').first().click();
      await expect(page.locator('[data-testid="template-applied"]')).toBeVisible();
    }
  });

  test('should show character count and limits', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.fill('[data-testid="topic-input"]', 'Character count test');
    await page.click('[data-testid="generate-button"]');

    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({ timeout: 30000 });

    const characterCount = await page.locator('[data-testid="character-count"]').textContent();
    expect(characterCount).toMatch(/\d+ \/ \d+/);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/generate**', route => route.abort('failed'));

    await page.click('[data-testid="nav-generate"]');
    await page.fill('[data-testid="topic-input"]', 'API error test');
    await page.click('[data-testid="generate-button"]');

    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Generation failed');
  });

  test('should support bulk generation', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.click('[data-testid="bulk-mode"]');

    await page.fill('[data-testid="bulk-topics"]', 'Topic 1\nTopic 2\nTopic 3');
    await page.click('[data-testid="bulk-generate-button"]');

    await expect(page.locator('[data-testid="bulk-generation-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="bulk-results"]')).toBeVisible({ timeout: 60000 });
  });

  test('should export generated content', async ({ page }) => {
    await page.click('[data-testid="nav-generate"]');
    await page.click('[data-testid="history-tab"]');

    const historyItems = await page.locator('[data-testid="history-item"]').count();
    if (historyItems > 0) {
      await page.locator('[data-testid="export-history-button"]').click();
      await page.click('[data-testid="export-json"]');

      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toMatch(/\.json$/);
    }
  });
});