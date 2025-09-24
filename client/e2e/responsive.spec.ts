import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile Small', width: 320, height: 568 },   // iPhone 5
  { name: 'Mobile Medium', width: 375, height: 667 },  // iPhone 6/7/8
  { name: 'Mobile Large', width: 414, height: 736 },   // iPhone 6/7/8 Plus
  { name: 'Tablet', width: 768, height: 1024 },        // iPad
  { name: 'Desktop', width: 1920, height: 1080 }        // Desktop
];

test.describe.configure({ mode: 'parallel' });

for (const viewport of viewports) {
  test.describe(`Responsive Design - ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
    });

    test(`should display properly on ${viewport.name}`, async ({ page }) => {
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Check if viewport is mobile
      const isMobile = viewport.width < 768;

      if (isMobile) {
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      }
    });

    test(`should login successfully on ${viewport.name}`, async ({ page }) => {
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    });

    test(`should display dashboard with proper layout on ${viewport.name}`, async ({ page }) => {
      // Login first
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/dashboard');

      // Check dashboard layout
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-grid"]')).toBeVisible();

      // Check if sidebar is visible on desktop
      if (viewport.width >= 1024) {
        await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      }

      // Check responsive grid layout
      const cards = await page.locator('[data-testid="metric-card"]').count();
      expect(cards).toBeGreaterThan(0);

      // Check if cards are properly sized
      const firstCard = await page.locator('[data-testid="metric-card"]').first();
      const cardWidth = await firstCard.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width;
      });

      if (viewport.width < 768) {
        // Mobile: cards should take full width
        expect(cardWidth).toBeLessThanOrEqual(viewport.width);
      } else if (viewport.width < 1024) {
        // Tablet: cards should be in grid
        expect(cardWidth).toBeLessThanOrEqual(viewport.width / 2);
      } else {
        // Desktop: cards should be in grid
        expect(cardWidth).toBeLessThanOrEqual(viewport.width / 4);
      }
    });

    test(`should handle content generation on ${viewport.name}`, async ({ page }) => {
      // Login first
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/dashboard');

      // Navigate to content generation
      await page.click('[data-testid="nav-generate"]');
      await expect(page).toHaveURL('/generate');

      // Check content generation layout
      await expect(page.locator('[data-testid="content-generator"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-options-panel"]')).toBeVisible();

      // On mobile, check if options are collapsible
      if (viewport.width < 768) {
        await expect(page.locator('[data-testid="mobile-options-toggle"]')).toBeVisible();
      }
    });

    test(`should handle twitter integration on ${viewport.name}`, async ({ page }) => {
      // Login first
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/dashboard');

      // Navigate to Twitter integration
      await page.click('[data-testid="nav-twitter"]');
      await expect(page).toHaveURL('/twitter');

      // Check Twitter layout
      await expect(page.locator('[data-testid="twitter-integration"]')).toBeVisible();

      // Check tweet card responsiveness
      await page.click('[data-testid="fetch-tweets-button"]');
      await expect(page.locator('[data-testid="tweets-container"]')).toBeVisible({ timeout: 10000 });

      const tweets = await page.locator('[data-testid="tweet-card"]').count();
      if (tweets > 0) {
        const firstTweet = await page.locator('[data-testid="tweet-card"]').first();
        const tweetWidth = await firstTweet.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width;
        });

        if (viewport.width < 768) {
          // Mobile: tweets should take full width with padding
          expect(tweetWidth).toBeLessThanOrEqual(viewport.width - 32);
        }
      }
    });

    test(`should handle analytics on ${viewport.name}`, async ({ page }) => {
      // Login first
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/dashboard');

      // Navigate to analytics
      await page.click('[data-testid="nav-analytics"]');
      await expect(page).toHaveURL('/analytics');

      // Check analytics layout
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();

      // Check chart responsiveness
      await expect(page.locator('[data-testid="charts-container"]')).toBeVisible();

      const charts = await page.locator('[data-testid="chart"]').count();
      if (charts > 0) {
        const firstChart = await page.locator('[data-testid="chart"]').first();
        const chartWidth = await firstChart.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width;
        });

        if (viewport.width < 768) {
          // Mobile: charts should be stacked
          expect(chartWidth).toBeLessThanOrEqual(viewport.width - 32);
        } else if (viewport.width < 1024) {
          // Tablet: charts might be in 2-column grid
          expect(chartWidth).toBeLessThanOrEqual(viewport.width / 2 - 32);
        }
      }
    });

    test(`should handle forms properly on ${viewport.name}`, async ({ page }) => {
      // Login first
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/dashboard');

      // Navigate to settings
      await page.click('[data-testid="nav-settings"]');
      await expect(page).toHaveURL('/settings');

      // Check form layout
      await expect(page.locator('[data-testid="settings-form"]')).toBeVisible();

      // Check form fields
      const formFields = await page.locator('[data-testid="form-field"]').count();
      expect(formFields).toBeGreaterThan(0);

      // Check button visibility
      await expect(page.locator('[data-testid="save-button"]')).toBeVisible();

      // On mobile, check if form is scrollable
      if (viewport.width < 768) {
        const form = await page.locator('[data-testid="settings-form"]');
        const formHeight = await form.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.height;
        });

        // Form should be scrollable if taller than viewport
        if (formHeight > viewport.height) {
          const isScrollable = await form.evaluate((el) => {
            return el.scrollHeight > el.clientHeight;
          });
          expect(isScrollable).toBe(true);
        }
      }
    });

    test(`should handle navigation properly on ${viewport.name}`, async ({ page }) => {
      // Login first
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/dashboard');

      // Test navigation based on viewport
      if (viewport.width < 768) {
        // Mobile navigation
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();

        await page.click('[data-testid="mobile-nav-posts"]');
        await expect(page).toHaveURL('/posts');

        await page.click('[data-testid="mobile-menu-button"]');
        await page.click('[data-testid="mobile-nav-analytics"]');
        await expect(page).toHaveURL('/analytics');
      } else {
        // Desktop navigation
        await page.click('[data-testid="nav-posts"]');
        await expect(page).toHaveURL('/posts');

        await page.click('[data-testid="nav-analytics"]');
        await expect(page).toHaveURL('/analytics');
      }
    });

    test(`should handle user profile on ${viewport.name}`, async ({ page }) => {
      // Login first
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/dashboard');

      // Test user profile access
      if (viewport.width < 768) {
        // Mobile: access through menu
        await page.click('[data-testid="mobile-menu-button"]');
        await page.click('[data-testid="mobile-nav-profile"]');
      } else {
        // Desktop: access through user menu
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="profile-menu-item"]');
      }

      await expect(page).toHaveURL('/profile');
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

      // Check profile layout
      await expect(page.locator('[data-testid="profile-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="profile-info"]')).toBeVisible();
    });

    test(`should handle modals properly on ${viewport.name}`, async ({ page }) => {
      // Login first
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL('/dashboard');

      // Open a modal
      await page.click('[data-testid="help-button"]');
      await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();

      // Check modal responsiveness
      const modal = await page.locator('[data-testid="help-modal"]');
      const modalWidth = await modal.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width;
      });

      if (viewport.width < 768) {
        // Mobile: modal should be full width with padding
        expect(modalWidth).toBeLessThanOrEqual(viewport.width - 32);
      } else {
        // Desktop: modal should have fixed max width
        expect(modalWidth).toBeLessThanOrEqual(600);
      }

      // Close modal
      await page.click('[data-testid="close-modal"]');
      await expect(page.locator('[data-testid="help-modal"]')).not.toBeVisible();
    });
  });
}

// Additional responsive tests
test.describe('Responsive Design - Accessibility', () => {
  test('should have proper focus management on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check keyboard navigation
    await page.press('[data-testid="email-input"]', 'Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

    await page.press('[data-testid="password-input"]', 'Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
  });

  test('should handle touch interactions properly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Test touch targets
    const loginButton = await page.locator('[data-testid="login-button"]');
    const buttonRect = await loginButton.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    // Touch targets should be at least 44px
    expect(buttonRect.width).toBeGreaterThanOrEqual(44);
    expect(buttonRect.height).toBeGreaterThanOrEqual(44);
  });

  test('should have proper text size for readability', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check base font size
    const bodyFontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontSize;
    });

    expect(parseFloat(bodyFontSize)).toBeGreaterThanOrEqual(16);
  });

  test('should have proper contrast ratio', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Test contrast ratio of important elements
    const titleElement = await page.locator('h2').first();
    const styles = await titleElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor
      };
    });

    // Basic check that colors are defined
    expect(styles.color).toBeTruthy();
    expect(styles.backgroundColor).toBeTruthy();
  });
});