import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model dla strony logowania
 * Enkapsuluje interakcje ze stroną /auth/login
 */
export class LoginPage {
  readonly page: Page;

  // Lokatory
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Inicjalizacja lokatorów używając data-testid
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByTestId('login-error-message');
    this.forgotPasswordLink = page.getByRole('link', { name: /zapomniałem hasła/i });
    this.signupLink = page.getByRole('link', { name: /zarejestruj się/i });
  }

  /**
   * Nawiguje do strony logowania
   */
  async goto() {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wypełnia formularz logowania i klika submit
   * @param email - Email użytkownika
   * @param password - Hasło użytkownika
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Czeka na pomyślne zalogowanie (redirect do /dashboard)
   * @param timeout - Maksymalny czas oczekiwania w ms (domyślnie 10s)
   */
  async waitForSuccessfulLogin(timeout = 10000) {
    await this.page.waitForURL(/\/dashboard/, { timeout });
  }

  /**
   * Weryfikuje czy wyświetlany jest komunikat błędu logowania
   * @param message - Oczekiwana treść błędu (opcjonalnie)
   */
  async expectLoginError(message?: string) {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });

    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  /**
   * Weryfikuje czy formularz logowania jest widoczny
   */
  async expectLoginFormVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Klika link "Zapomniałem hasła"
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Klika link "Zarejestruj się"
   */
  async clickSignup() {
    await this.signupLink.click();
  }
}
