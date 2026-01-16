# Testing Setup - Athletica

This document provides an overview of the testing infrastructure set up for the Athletica project.

## ✅ What Was Configured

### 1. Testing Dependencies Installed

**Unit & Integration Testing:**
- ✅ Vitest - Fast unit test runner
- ✅ @vitest/ui - Interactive test UI
- ✅ @testing-library/react - React component testing utilities
- ✅ @testing-library/user-event - User interaction simulation
- ✅ @testing-library/jest-dom - Custom DOM matchers
- ✅ jsdom - DOM environment for tests
- ✅ @vitejs/plugin-react - React support for Vitest

**E2E Testing:**
- ✅ @playwright/test - E2E testing framework
- ✅ Playwright Chromium browser installed

**API & Mocking:**
- ✅ Supertest - HTTP API testing
- ✅ MSW (Mock Service Worker) - API mocking

### 2. Configuration Files Created

#### `vitest.config.ts`
- Configured jsdom environment for DOM testing
- Set up path aliases (`@/*` → `./src/*`)
- Configured coverage with v8 provider
- Set coverage thresholds (80% for services/utils, 70% for components)
- Test file patterns and exclusions
- Setup file reference (`tests/setup.ts`)

#### `playwright.config.ts`
- Configured test directory (`e2e/`)
- Set up multiple browser projects (Chromium, Firefox, WebKit)
- Mobile viewport testing (iPhone, Pixel 5)
- Tablet viewport testing (iPad Pro)
- Screenshot/video capture on failure
- Test reporting (HTML, JSON, list)
- Local dev server integration

#### `tests/setup.ts`
- Global test setup
- DOM cleanup after each test
- Environment variable mocking
- Jest-DOM matchers imported

### 3. Directory Structure

```
./
├── tests/
│   ├── setup.ts                    # Global test setup
│   ├── README.md                   # Testing guide
│   ├── unit/                       # Unit tests
│   │   ├── components/             # Component tests
│   │   │   └── Button.test.tsx     # Example component test
│   │   └── utils/                  # Utility function tests
│   │       └── formatters.test.ts  # Example utility test
│   └── integration/                # Integration tests
│       └── api-example.test.ts     # Example API test
│
├── e2e/                            # E2E tests (Playwright)
│   ├── auth/
│   │   └── login.spec.ts           # Example login E2E test
│   ├── survey/                     # Survey flow tests
│   └── dashboard/                  # Dashboard tests
│
├── vitest.config.ts                # Vitest configuration
├── playwright.config.ts            # Playwright configuration
└── TESTING-SETUP.md                # This file
```

### 4. NPM Scripts Added

```json
{
  "test": "vitest",                                  // Run tests in watch mode
  "test:ui": "vitest --ui",                          // Run tests with UI
  "test:run": "vitest run",                          // Run tests once
  "test:coverage": "vitest run --coverage",          // Run with coverage
  "test:e2e": "playwright test",                     // Run E2E tests
  "test:e2e:ui": "playwright test --ui",             // E2E tests with UI
  "test:e2e:debug": "playwright test --debug",       // Debug E2E tests
  "test:e2e:report": "playwright show-report ..."    // View E2E report
}
```

### 5. Example Tests Created

✅ **Unit Test**: `tests/unit/utils/formatters.test.ts`
- Tests for `formatTime()` function
- Tests for `formatGender()` function
- Demonstrates utility function testing patterns

✅ **Component Test**: `tests/unit/components/Button.test.tsx`
- Tests Button component rendering
- Tests click event handling
- Tests disabled state
- Tests variant and size props
- Demonstrates React Testing Library usage

✅ **E2E Test**: `e2e/auth/login.spec.ts`
- Tests login page display
- Tests form validation
- Tests error handling
- Tests accessibility
- Demonstrates Playwright usage

✅ **Integration Test Template**: `tests/integration/api-example.test.ts`
- Template for API endpoint testing
- Examples of mocking strategies
- Integration test patterns

### 6. Documentation Created

✅ **`tests/README.md`**
- Comprehensive testing guide
- How to run tests
- How to write tests
- Mocking examples
- Best practices
- Debugging tips

✅ **`.ai/rules/vitest-unit-testing.mdc`**
- Enhanced unit testing guidelines
- React Testing Library patterns
- Integration testing patterns
- Mocking strategies (Supabase, OpenRouter)
- Coverage requirements
- Best practices and anti-patterns

### 7. GitIgnore Updated

Added test artifacts to `.gitignore`:
```
coverage/
test-results/
playwright-report/
.playwright/
```

## 🚀 Quick Start

### Running Unit Tests

```bash
# Watch mode (recommended for development)
npm test

# Run once
npm run test:run

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

### Running E2E Tests

```bash
# All browsers
npm run test:e2e

# With UI (recommended)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View last report
npm run test:e2e:report
```

### Writing Your First Test

1. **Create test file**: `tests/unit/my-feature.test.ts`
2. **Write test**:
   ```typescript
   import { describe, it, expect } from 'vitest';

   describe('My Feature', () => {
     it('should work correctly', () => {
       expect(1 + 1).toBe(2);
     });
   });
   ```
3. **Run**: `npm test`

## 📚 Key Resources

- **Test Plan**: `.ai/athletica-test-plan.md` - Comprehensive test plan with scenarios
- **Unit Testing Guide**: `.ai/rules/vitest-unit-testing.mdc` - Detailed guidelines
- **Testing README**: `tests/README.md` - Quick reference guide
- **Example Tests**: Check `tests/unit/` and `e2e/auth/` for examples

## ✅ Verification

Run the example test to verify setup:

```bash
npm run test:run -- tests/unit/utils/formatters.test.ts
```

Expected output:
```
✓ tests/unit/utils/formatters.test.ts (6 tests) 2ms
  Test Files  1 passed (1)
  Tests  6 passed (6)
```

## 🎯 Coverage Goals

Based on `.ai/athletica-test-plan.md`:

- **Services & Utils**: ≥ 80% coverage
- **Components**: ≥ 70% coverage
- **Overall Project**: ≥ 80% coverage

Check coverage:
```bash
npm run test:coverage
```

## 📋 Test Priorities (from Test Plan)

### P0 - Critical (Must have before production)
- Authentication & authorization
- AI plan generation
- RLS policies verification
- Workout completion toggle
- Critical user flows

### P1 - High (Should have before production)
- Password reset flow
- Survey validation
- Performance benchmarks
- Accessibility compliance
- Cross-browser compatibility

### P2 - Medium (Nice to have)
- Advanced performance optimization
- Edge case handling
- Comprehensive exploratory testing

## 🔧 Next Steps

1. **Write tests for existing code**:
   - Start with utilities in `src/lib/utils/`
   - Test React components in `src/components/`
   - Test API endpoints in `src/pages/api/`

2. **Set up CI/CD**:
   - Create GitHub Actions workflow
   - Run tests on every PR
   - Enforce coverage thresholds

3. **Add more E2E tests**:
   - Survey flow (`e2e/survey/`)
   - Dashboard functionality (`e2e/dashboard/`)
   - Profile page (`e2e/profile/`)

4. **Mock external services**:
   - Set up MSW for OpenRouter API
   - Mock Supabase for integration tests
   - Create test fixtures

## 💡 Tips

- Use `test.only()` to run a single test during development
- Use `test.skip()` to temporarily skip a test
- Run tests in watch mode while coding: `npm test`
- Use Playwright UI mode for debugging E2E tests: `npm run test:e2e:ui`
- Check `tests/README.md` for detailed examples and patterns

## 🆘 Troubleshooting

### Tests not running?
- Check Node.js version: `node --version` (should be 22.14.0)
- Reinstall dependencies: `npm install`

### Import path errors?
- Path alias `@/*` should map to `./src/*`
- Check `tsconfig.json` and `vitest.config.ts`

### Playwright browser not found?
- Install browsers: `npx playwright install`

### Coverage not generated?
- Install coverage provider: `npm install -D @vitest/coverage-v8`

---

**Setup completed successfully!** ✅

All test infrastructure is now in place and ready to use. See `tests/README.md` and `.ai/rules/vitest-unit-testing.mdc` for detailed usage guidelines.
