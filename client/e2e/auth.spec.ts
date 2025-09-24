import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Sign in to AutoMedia');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="toast-error"]')).toContainText('Invalid credentials');
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('[data-testid="register-link"]');

    await expect(page).toHaveURL('/register');
    await expect(page.locator('h2')).toContainText('Create your account');
  });

  test('should register new user', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    await page.click('[data-testid="register-link"]');
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
    await page.click('[data-testid="register-button"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Registration successful');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should show forgot password form', async ({ page }) => {
    await page.click('[data-testid="forgot-password-link"]');

    await expect(page.locator('[data-testid="forgot-password-form"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Reset your password');
  });

  test('should send password reset email', async ({ page }) => {
    await page.click('[data-testid="forgot-password-link"]');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.click('[data-testid="reset-password-button"]');

    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Password reset email sent');
  });
});