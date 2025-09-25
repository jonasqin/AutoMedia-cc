# AutoMedia Testing Quick Start Guide

## Overview

This guide provides step-by-step instructions to quickly set up and run tests for the AutoMedia project. The testing strategy is designed to work with the current project state while providing a scalable approach for comprehensive testing.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local or Docker)
3. **Git**
4. **npm** or yarn

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Root level dependencies
npm install

# Server dependencies
cd server && npm install

# Client dependencies
cd client && npm install
```

### 2. Configure Test Environment

Create a test environment file:

```bash
# Server test environment
cp server/.env.example server/.env.test
```

Edit `.env.test` with test-specific settings:
```env
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://localhost:27017/automedia-test
JWT_SECRET=test-jwt-secret
REDIS_URL=redis://localhost:6379/1
```

### 3. Run Initial Tests

```bash
# Server tests
npm run server:test

# Client tests
npm run client:test

# E2E tests
npm run e2e
```

## Current Test Status

### ✅ Ready to Test
- **Frontend utilities** (already have sample tests)
- **E2E tests** (Playwright configured)
- **Database models** (18 models working)
- **Test infrastructure** (Jest/Vitest setup)

### 🔧 Need Fixes First
- **TypeScript compilation errors** in controllers
- **Missing utility functions** (logger, etc.)
- **Import/export inconsistencies**

### 📝 To Be Implemented
- **Service layer tests**
- **API integration tests**
- **Component tests**
- **Performance tests**

## Running Tests

### Server Tests (Jest)

```bash
# Run all server tests
npm run server:test

# Run with coverage
npm run server:test -- --coverage

# Run specific test file
npm run server:test -- AuthService.test.ts

# Run in watch mode
npm run server:test -- --watch
```

### Client Tests (Vitest)

```bash
# Run all client tests
npm run client:test

# Run with coverage
npm run client:test -- --coverage

# Run specific test file
npm run client:test -- LoginForm.test.tsx

# Run in watch mode
npm run client:test -- --watch

# Run with UI
npm run client:test -- --ui
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run e2e

# Run specific test file
npm run e2e -- auth.spec.ts

# Run in headed mode (visible browser)
npm run e2e -- --headed

# Run specific browser
npm run e2e -- --project=chromium
```

## Test Structure

### Server Test Structure
```
server/src/
├── __tests__/
│   ├── setup.ts           # Test database setup
│   ├── fixtures/          # Test data
│   ├── services/          # Service tests
│   ├── controllers/       # Controller tests
│   ├── middleware/        # Middleware tests
│   ├── models/           # Model tests
│   └── utils/            # Utility tests
└── jest.config.js        # Jest configuration
```

### Client Test Structure
```
client/src/
├── __tests__/
│   ├── setup.ts          # Test setup
│   ├── components/       # Component tests
│   ├── hooks/           # Hook tests
│   ├── utils/           # Utility tests
│   └── integrations/    # Integration tests
└── vitest.config.ts     # Vitest configuration
```

### E2E Test Structure
```
client/e2e/
├── auth.spec.ts         # Authentication tests
├── dashboard.spec.ts    # Dashboard tests
├── content.spec.ts      # Content management tests
├── performance.spec.ts  # Performance tests
└── responsive.spec.ts   # Responsive design tests
```

## Writing Tests

### Server Test Example

```typescript
// server/src/__tests__/services/auth.service.test.ts
import { AuthService } from '../../services/AuthService';
import { User } from '../../models/User';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const result = await authService.loginUser(loginData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
    });
  });
});
```

### Client Test Example

```typescript
// client/src/__tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('should render login form correctly', () => {
    render(<LoginForm />);

    expect(screen.getByText('Sign in to AutoMedia')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
// client/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

## Test Data Management

### Using Test Fixtures

```typescript
import { createTestFixtures } from '../fixtures/test-data';

describe('ContentService', () => {
  let fixtures: any;

  beforeEach(async () => {
    fixtures = await createTestFixtures();
  });

  it('should work with test data', () => {
    expect(fixtures.users).toHaveLength(2);
    expect(fixtures.content).toHaveLength(2);
  });
});
```

### Mocking External APIs

```typescript
// Mock Twitter API
vi.mock('twitter-api-v2', () => ({
  TwitterApi: vi.fn(() => ({
    v2: {
      search: vi.fn().mockResolvedValue(mockTwitterResponse),
    },
  })),
}));
```

## Common Testing Patterns

### 1. AAA Pattern (Arrange, Act, Assert)

```typescript
it('should delete content successfully', async () => {
  // Arrange
  const contentId = 'test-content-id';

  // Act
  await contentService.deleteContent(contentId);

  // Assert
  expect(contentDeleted).toHaveBeenCalledWith(contentId);
});
```

### 2. Testing Error Scenarios

```typescript
it('should handle invalid credentials', async () => {
  const invalidData = {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  };

  await expect(authService.loginUser(invalidData))
    .rejects.toThrow('Invalid credentials');
});
```

### 3. Testing Async Operations

```typescript
it('should handle loading states', async () => {
  render(<ContentCard content={mockContent} loading={true} />);

  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Fix compilation issues before running tests
2. **Database Connection**: Ensure MongoDB is running for integration tests
3. **Missing Dependencies**: Install all required packages
4. **Environment Variables**: Set up proper test environment variables
5. **Port Conflicts**: Use different ports for test environment

### Debugging Tests

```bash
# Run tests with verbose output
npm run server:test -- --verbose

# Run tests with debugging
npm run server:test -- --runInBand --detectOpenHandles

# Run specific test with debugging
npm run server:test -- --testNamePattern="should login user"
```

## Next Steps

1. **Fix TypeScript Issues**: Address compilation errors in controllers
2. **Run Existing Tests**: Execute current test suite to identify issues
3. **Add Missing Tests**: Implement tests for uncovered components
4. **Set Up CI/CD**: Configure automated testing on PRs
5. **Monitor Coverage**: Track and improve test coverage

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Library](https://react-testing-library.com/)

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review the full testing strategy document
3. Consult the implementation roadmap
4. Check existing test files for examples
5. Reach out to the development team

This quick start guide should help you get up and running with testing quickly. For more detailed information, refer to the comprehensive testing strategy and implementation roadmap documents.