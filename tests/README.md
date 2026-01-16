# Testing Guide

This directory contains unit and integration tests for the Athletica project.

## Test Structure

```
tests/
├── setup.ts              # Global test setup and configuration
├── unit/                 # Unit tests for isolated functions/components
│   ├── components/       # React component tests
│   └── utils/            # Utility function tests
└── integration/          # Integration tests for API endpoints and services

e2e/                      # E2E tests (separate from tests/ directory)
├── auth/                 # Authentication flow tests
├── survey/               # Survey form tests
└── dashboard/            # Dashboard functionality tests
```

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once
npm run test:run

# Run tests with UI (interactive)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode (recommended for debugging)
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions or components in isolation.

**Example - Testing a utility function:**

```typescript
import { describe, it, expect } from 'vitest';
import { formatTime } from '@/lib/utils/formatTime';

describe('formatTime', () => {
  it('should format time correctly', () => {
    expect(formatTime(90)).toBe('1:30');
  });
});
```

### Component Tests

Component tests use React Testing Library to test UI components.

**Example - Testing a React component:**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### E2E Tests

E2E tests use Playwright to test complete user flows.

**Example - Testing login flow:**

```typescript
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/password/i).fill('Test1234!');
  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
});
```

## Coverage Goals

Based on the test plan:

- **Services & Utils**: Minimum 80% coverage
- **Components**: Minimum 70% coverage
- **Overall**: Minimum 80% coverage

Run `npm run test:coverage` to check current coverage.

## Mocking

### Mocking External APIs

Use MSW (Mock Service Worker) to mock external API calls like OpenRouter:

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json({ /* mock response */ });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Mocking Supabase

Mock Supabase client for tests that require database access:

```typescript
import { vi } from 'vitest';

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
  })),
};
```

## Environment Variables

Tests use environment variables from `tests/setup.ts`. Override them in your test files if needed:

```typescript
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.TEST_USER_EMAIL = 'test@example.com';
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests in three clear sections
2. **One assertion per test**: Keep tests focused and readable
3. **Descriptive test names**: Use "should" statements that describe expected behavior
4. **Clean up**: Use `afterEach` to clean up test state
5. **Mock external dependencies**: Don't make real API calls in unit/integration tests
6. **Use TypeScript**: All test files should be `.ts` or `.tsx`
7. **Follow accessibility**: Use semantic queries (`getByRole`, `getByLabel`) over test IDs

## Debugging Tests

### Vitest

- Use `test.only()` to run a single test
- Use `test.skip()` to skip a test temporarily
- Add `console.log()` statements for debugging
- Use the Vitest UI: `npm run test:ui`

### Playwright

- Use `test.only()` to run a single test
- Use `page.pause()` to pause execution and inspect
- Use headed mode: `npx playwright test --headed`
- Use debug mode: `npm run test:e2e:debug`
- View trace: Open failed test traces in Playwright Trace Viewer

## CI/CD Integration

Tests run automatically in GitHub Actions on:

- Push to any branch
- Pull request creation/update

Check `.github/workflows/` for CI configuration.

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
