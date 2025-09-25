# AutoMedia Testing Guide

## Overview

This comprehensive testing guide covers the complete testing solution for the AutoMedia project's PRD core functionality. The testing framework ensures high-quality, reliable, and performant code across all six core feature areas.

## Test Architecture

### Testing Pyramid
```
           /\
          /  \
         / E2E \
        /--------\
       / Integration \
      /--------------\
     /     Unit       \
    /------------------\
```

- **Unit Tests (60%)**: Individual component testing
- **Integration Tests (30%)**: Component interaction testing
- **E2E Tests (10%)**: Full user journey testing

### Test Categories

| Category | Description | Coverage Target | Tools |
|----------|-------------|----------------|-------|
| **Unit Tests** | Individual functions and methods | 85% | Jest |
| **Integration Tests** | API endpoints and service interactions | 80% | Supertest |
| **API Tests** | RESTful endpoint validation | 90% | Supertest |
| **Database Tests** | Model operations and queries | 85% | MongoDB Memory Server |
| **WebSocket Tests** | Real-time communication | 80% | Socket.IO Client |
| **Performance Tests** | Load and stress testing | N/A | Artillery, Custom |
| **Security Tests** | Authentication and authorization | 95% | Jest, Supertest |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- Redis 6+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Install test dependencies
npm install --dev

# Setup environment
cp .env.example .env
```

### Running Tests

#### All Tests
```bash
# Run complete test suite
npm test

# Run with coverage
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

#### Specific Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# API tests only
npm run test:api

# Performance tests only
npm run test:performance

# WebSocket tests only
npm run test:socket
```

#### Watch Mode
```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file in watch mode
npm run test:watch -- auth.service.test.ts
```

## Test Structure

```
server/src/__tests__/
├── setup.ts                    # Global test setup
├── globalSetup.ts             # Global setup for all tests
├── globalTeardown.ts           # Global cleanup
├── jest.config.js             # Jest configuration
├── integration/               # Integration tests
│   ├── auth.integration.test.ts
│   ├── topic.integration.test.ts
│   └── socket.integration.test.ts
├── services/                  # Service layer tests
│   ├── twitter.service.test.ts
│   ├── ai.service.test.ts
│   └── cron.service.test.ts
├── models/                    # Model tests
│   ├── user.model.test.ts
│   ├── content.model.test.ts
│   └── topic.model.test.ts
├── controllers/               # Controller tests
│   ├── auth.controller.test.ts
│   ├── topic.controller.test.ts
│   └── content.controller.test.ts
├── middleware/                # Middleware tests
│   └── auth.middleware.test.ts
└── performance/               # Performance tests
    └── api.performance.test.ts
```

## Testing Core Features

### 1. Authentication & Authorization

#### Key Tests
- User registration validation
- JWT token generation and validation
- Password hashing and verification
- Protected route middleware
- Rate limiting and security

#### Running Auth Tests
```bash
# Run all authentication tests
npm run test:auth

# Run specific auth test
npm test -- auth.integration.test.ts
```

#### Coverage Requirements
- **Overall**: 95%
- **Critical paths**: 100%
- **Error handling**: 90%

### 2. Twitter Service Integration

#### Key Tests
- API connection and authentication
- User data retrieval and caching
- Tweet search and filtering
- Rate limit handling
- Data processing and validation

#### Running Twitter Tests
```bash
# Run Twitter service tests
npm test -- twitter.service.test.ts

# Run with mocked responses
npm test -- twitter.service.test.ts --testNamePattern="mock"
```

#### Mocking Strategy
```javascript
// Mock Twitter API responses
jest.mock('twitter-api-v2', () => ({
  TwitterApi: jest.fn().mockImplementation(() => ({
    v2: {
      get: jest.fn().mockResolvedValue(mockResponse),
      userByUsername: jest.fn().mockResolvedValue(userData),
    },
  })),
}));
```

### 3. AI Service Integration

#### Key Tests
- Multi-provider content generation
- Cost calculation and tracking
- Token management and quotas
- Error handling for API failures
- Generation history and statistics

#### Running AI Tests
```bash
# Run AI service tests
npm test -- ai.service.test.ts

# Test specific providers
npm test -- ai.service.test.ts --testNamePattern="OpenAI"
npm test -- ai.service.test.ts --testNamePattern="Gemini"
```

### 4. Topic Management

#### Key Tests
- Topic CRUD operations
- Keyword-based content collection
- Cron job scheduling
- Priority-based processing
- User-specific access control

#### Running Topic Tests
```bash
# Run topic integration tests
npm test -- topic.integration.test.ts

# Test cron functionality
npm test -- topic.integration.test.ts --testNamePattern="cron"
```

### 5. Content Management

#### Key Tests
- Content CRUD operations
- Search and filtering
- Text search with MongoDB
- Sentiment analysis integration
- Engagement metrics tracking

#### Running Content Tests
```bash
# Run content model tests
npm test -- content.model.test.ts

# Test search functionality
npm test -- content.model.test.ts --testNamePattern="search"
```

### 6. Real-time Communication

#### Key Tests
- WebSocket connection establishment
- Room-based messaging
- Authentication for sockets
- Broadcast functionality
- Connection health monitoring

#### Running Socket Tests
```bash
# Run WebSocket integration tests
npm test -- socket.integration.test.ts

# Test specific features
npm test -- socket.integration.test.ts --testNamePattern="broadcast"
```

## Performance Testing

### Load Testing Configuration
The project uses Artillery for load testing with the following scenarios:

#### Authentication Flow
- User registration
- Login and token refresh
- Profile management
- Logout

#### Topic Management
- CRUD operations
- Content collection
- Search and filtering

#### Content Retrieval
- Pagination
- Search queries
- Real-time updates

### Running Performance Tests

```bash
# Install Artillery globally
npm install -g artillery

# Run performance test
artillery run docs/testing/performance-testing.yml

# Run with custom duration
artillery run docs/testing/performance-testing.yml --duration 300

# Run with custom reports
artillery run docs/testing/performance-testing.yml --output custom-report.json
```

### Performance Metrics

#### Key Metrics
- **Response Time**: < 2s for 95% of requests
- **Error Rate**: < 5% under load
- **Throughput**: > 100 requests/second
- **Memory Usage**: < 512MB under load
- **CPU Usage**: < 70% under load

#### Monitoring
```bash
# Monitor system resources during tests
artillery run --monitor docs/testing/performance-testing.yml

# Generate performance report
artillery report --output performance-report.html
```

## Test Data Management

### Fixtures
Test fixtures are located in `src/__tests__/fixtures/`:

```typescript
// users.fixture.ts
export const testUsers = [
  {
    email: 'test@example.com',
    password: 'Password123!',
    profile: {
      firstName: 'Test',
      lastName: 'User',
    },
  },
  // ... more test users
];

// topics.fixture.ts
export const testTopics = [
  {
    name: 'Test Topic',
    keywords: ['test', 'topic'],
    description: 'A test topic',
    weight: 5,
  },
  // ... more test topics
];
```

### Database Seeding
```typescript
// seed-database.ts
import { User, Topic, Content } from '../models';
import { testUsers, testTopics } from './fixtures';

export async function seedDatabase() {
  // Create test users
  for (const userData of testUsers) {
    const user = new User(userData);
    await user.save();
  }

  // Create test topics
  for (const topicData of testTopics) {
    const topic = new Topic(topicData);
    await topic.save();
  }
}
```

## CI/CD Integration

### GitHub Actions
The project includes GitHub Actions for automated testing:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "npm run test:staged",
      "npm run lint"
    ]
  }
}
```

## Test Reports and Documentation

### Coverage Reports
- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **Text Report**: Console output

### Performance Reports
- **HTML Report**: `performance-report.html`
- **JSON Report**: `performance-report.json`
- **Summary**: Console output

### Documentation
- **Test Plan**: `docs/testing/test-plan.md`
- **Testing Guide**: `docs/testing/testing-guide.md`
- **Performance Config**: `docs/testing/performance-testing.yml`

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Test Independence**: Tests should not depend on each other
4. **Mock External Dependencies**: Use mocks for external APIs
5. **Error Scenarios**: Test both success and failure cases

### Example Test Structure
```typescript
describe('ServiceName', () => {
  beforeEach(() => {
    // Setup test data
  });

  describe('methodName', () => {
    it('should return expected result when called with valid input', async () => {
      // Arrange
      const input = { data: 'test' };

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when called with invalid input', async () => {
      // Arrange
      const input = { data: 'invalid' };

      // Act & Assert
      await expect(service.methodName(input))
        .rejects.toThrow('Expected error message');
    });
  });
});
```

### Performance Testing Best Practices
1. **Realistic Scenarios**: Simulate real user behavior
2. **Gradual Load Increase**: Ramp up traffic gradually
3. **Monitor Resources**: Track CPU, memory, and network usage
4. **Test Different Load Levels**: Test normal, peak, and stress scenarios
5. **Analyze Results**: Identify bottlenecks and optimization opportunities

## Troubleshooting

### Common Issues

#### Test Timeout
```bash
# Increase test timeout
npm test -- --testTimeout=60000
```

#### Memory Issues
```bash
# Run tests with limited memory
node --max-old-space-size=4096 node_modules/.bin/jest
```

#### Connection Issues
```bash
# Reset test database
npm run test:reset-db

# Clear test cache
npm run test:clear-cache
```

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug

# Run specific test in debug mode
npm run test:debug -- auth.integration.test.ts
```

## Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts` or `*.spec.ts`
3. Include unit and integration tests
4. Update documentation if needed
5. Ensure coverage requirements are met

### Test Review Checklist
- [ ] Tests cover all happy paths
- [ ] Tests cover all error scenarios
- [ ] Tests are independent and isolated
- [ ] Mocks are properly implemented
- [ ] Performance impact is considered
- [ ] Documentation is updated
- [ ] Coverage requirements are met

## Conclusion

This comprehensive testing framework ensures the AutoMedia project maintains high quality, reliability, and performance across all core features. The combination of unit, integration, and performance tests provides complete coverage of the PRD requirements.

For questions or support, please refer to the project documentation or contact the development team.