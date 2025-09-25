module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/*.ts',
    '!src/middleware/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 4,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    // Critical files require higher coverage
    './src/services/twitterService.ts': {
      branches: 90,
      functions: 90,
      lines: 95,
      statements: 95,
    },
    './src/services/aiService.ts': {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90,
    },
    './src/middleware/auth.ts': {
      branches: 95,
      functions: 95,
      lines: 100,
      statements: 100,
    },
    './src/routes/auth.ts': {
      branches: 90,
      functions: 90,
      lines: 95,
      statements: 95,
    },
  },

  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },

  // Module name mapper for easier imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Global setup and teardown
  globalSetup: '<rootDir>/__tests__/globalSetup.ts',
  globalTeardown: '<rootDir>/__tests__/globalTeardown.ts',

  // Transform ignore for node_modules
  transformIgnorePatterns: [
    '/node_modules/',
  ],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  // Slow test threshold (in ms)
  slowTestThreshold: 5000,

  // Detect open handles and leaks
  detectOpenHandles: true,
  detectLeaks: true,

  // Test name pattern
  testNamePattern: '^(.*\\.(test|spec))\\.ts$',

  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',

  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/coverage/',
    '\\.d\\.ts$',
    '\\.test\\.ts$',
    '\\.spec\\.ts$',
  ],

  // Coverage watermarks
  coverageWatermarks: {
    statements: [80, 95],
    branches: [80, 90],
    functions: [80, 90],
    lines: [85, 95],
  },
};