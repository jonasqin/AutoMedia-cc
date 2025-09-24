import {
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  truncateText,
  slugify,
  isValidEmail,
  isValidUrl,
  isValidPassword,
  debounce,
} from '@/lib/utils';

describe('Date utilities', () => {
  test('formatDate formats date correctly', () => {
    const date = new Date('2024-01-15T10:30:00');
    expect(formatDate(date, 'short')).toMatch(/1\/15\/2024/);
    expect(formatDate(date, 'medium')).toMatch(/Jan 15, 2024/);
    expect(formatDate(date, 'long')).toMatch(/January 15, 2024/);
  });

  test('formatRelativeTime returns relative time', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
    expect(formatRelativeTime(oneDayAgo)).toBe('1d ago');
  });
});

describe('Number utilities', () => {
  test('formatNumber formats large numbers', () => {
    expect(formatNumber(1500000)).toBe('1.5M');
    expect(formatNumber(2500)).toBe('2.5K');
    expect(formatNumber(999)).toBe('999');
  });

  test('formatPercentage formats percentages', () => {
    expect(formatPercentage(85.666)).toBe('85.7%');
    expect(formatPercentage(100)).toBe('100.0%');
  });
});

describe('String utilities', () => {
  test('truncateText truncates long text', () => {
    const longText = 'This is a very long text that should be truncated';
    expect(truncateText(longText, 20)).toBe('This is a very lon...');
    expect(truncateText('Short text', 20)).toBe('Short text');
  });

  test('slugify converts text to slug', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('Multiple  Spaces  Here')).toBe('multiple-spaces-here');
  });
});

describe('Validation utilities', () => {
  test('isValidEmail validates email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('isValidUrl validates URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('invalid-url')).toBe(false);
  });

  test('isValidPassword validates passwords', () => {
    expect(isValidPassword('password123')).toBe(true);
    expect(isValidPassword('short')).toBe(false);
  });
});

describe('Debounce utility', () => {
  jest.useFakeTimers();

  test('debounce delays function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 1000);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});