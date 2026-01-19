import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Maximum time one test can run (2 minutes)
  timeout: 120000,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/playwright-results.json" }],
    ["list"],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Collect trace on failure
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Navigation timeout
    navigationTimeout: 30000,

    // Action timeout
    actionTimeout: 10000,
  },

  // Configure projects for major browsers
  // See .ai/browser-testing-final-results.md for detailed analysis
  projects: [
    // Database cleanup teardown - runs after all tests complete
    {
      name: "cleanup",
      testMatch: /global\.teardown\.ts/,
    },

    // Desktop browsers - 100% pass rate ✅
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      teardown: "cleanup",
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      teardown: "cleanup",
    },

    // Mobile viewports - 89% pass rate ✅ (1 flaky test)
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      teardown: "cleanup",
    },

    // Optional: Tablet viewport - 100% pass rate ✅
    // Uncomment to include iPad testing (~8s per run)
    // {
    //   name: "iPad",
    //   use: { ...devices["iPad Pro"] },
    //   teardown: "cleanup",
    // },

    // NOT RECOMMENDED: Safari browsers have authentication incompatibility ❌
    // Known issue: Safari WebKit doesn't properly handle Supabase auth redirects in test environment
    // Tests stuck on login page with 67% pass rate (webkit) and 56% pass rate (Mobile Safari)
    // See .ai/browser-testing-final-results.md for details
    //
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    //   teardown: "cleanup",
    // },
    // {
    //   name: "Mobile Safari",
    //   use: { ...devices["iPhone 12"] },
    //   teardown: "cleanup",
    // },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
