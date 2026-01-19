import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto("/auth/login");
  });

  test("should display login form", async ({ page }) => {
    // TC-AUTH-002: Login page should display form with email and password fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zaloguj/i })).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    // TC-AUTH-002-NEG-3: Empty fields should show validation errors
    await page.getByRole("button", { name: /zaloguj/i }).click();

    // Wait for validation messages to appear (longer timeout for mobile browsers)
    await expect(page.locator("text=/jest wymagany|jest wymagane/i").first()).toBeVisible({
      timeout: 15000
    });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // TC-AUTH-002-NEG-1: Invalid credentials should show error message
    await page.getByLabel(/email/i).fill("nonexistent@example.com");
    await page.getByLabel(/hasło/i).fill("wrongpassword");
    await page.getByRole("button", { name: /zaloguj/i }).click();

    // Wait for error toast or message
    await expect(page.locator("text=/nieprawidłowy.*email.*hasło/i")).toBeVisible({ timeout: 5000 });
  });

  test("should navigate to forgot password page", async ({ page }) => {
    // TC-AUTH-003: Forgot password link should navigate to reset password page
    await page.getByRole("link", { name: /zapomniałeś.*hasła/i }).click();

    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // TC-AUTH-002: Happy path - successful login
    // Note: This requires a test user to exist in the database
    // In real tests, you would set up test data in beforeEach or use API to create test user

    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "Test1234!";

    // Ensure form is fully loaded (Safari needs this)
    await page.waitForLoadState("networkidle");

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/hasło/i).fill(testPassword);
    await page.getByRole("button", { name: /zaloguj/i }).click();

    // Wait for network activity after submission (Safari needs this)
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

    // Should see user navigation elements
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("should have accessible form elements", async ({ page }) => {
    // Accessibility: Form should have proper labels and ARIA attributes
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);

    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Check for autocomplete attributes
    await expect(emailInput).toHaveAttribute("autocomplete");
    await expect(passwordInput).toHaveAttribute("autocomplete");
  });
});
