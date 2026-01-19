import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model dla strony dashboardu
 * Enkapsuluje interakcje ze stroną /dashboard
 */
export class DashboardPage {
  readonly page: Page;

  // Lokatory
  readonly trainingPlanView: Locator;
  readonly planHeader: Locator;
  readonly completionStats: Locator;

  constructor(page: Page) {
    this.page = page;

    // Inicjalizacja lokatorów
    this.trainingPlanView = page.getByTestId('training-plan-view');
    this.planHeader = page.getByTestId('plan-header');
    this.completionStats = page.getByTestId('plan-completion-stats');
  }

  /**
   * Nawiguje do strony dashboardu
   */
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Czeka aż plan treningowy zostanie załadowany
   * @param timeout - Maksymalny czas oczekiwania w ms (domyślnie 5s)
   */
  async waitForPlanToLoad(timeout = 5000) {
    await expect(this.trainingPlanView).toBeVisible({ timeout });
  }

  /**
   * Weryfikuje czy plan treningowy jest widoczny
   */
  async expectPlanToBeVisible() {
    await expect(this.trainingPlanView).toBeVisible();
    await expect(this.planHeader).toBeVisible();
  }

  /**
   * Weryfikuje czy wyświetlane są statystyki ukończenia
   * @param expectedText - Oczekiwany fragment tekstu w statystykach (np. "Wykonano 0 z")
   */
  async expectCompletionStats(expectedText: string) {
    await expect(this.completionStats).toBeVisible();
    await expect(this.completionStats).toContainText(expectedText);
  }

  /**
   * Weryfikuje czy wyświetlany jest empty state (brak planu)
   */
  async expectEmptyState() {
    // Empty state powinien zawierać przycisk "Wygeneruj plan" lub "Wypełnij ankietę"
    const emptyStateButton = this.page.getByRole('link', { name: /wygeneruj plan|wypełnij ankietę/i });
    await expect(emptyStateButton).toBeVisible();
  }

  /**
   * Zwraca lokator dla accordionu danego tygodnia
   * @param weekNumber - Numer tygodnia (1-10)
   */
  getWeekAccordion(weekNumber: number): Locator {
    return this.page.getByRole('button', { name: new RegExp(`tydzień ${weekNumber}`, 'i') });
  }

  /**
   * Rozwija accordion danego tygodnia
   * @param weekNumber - Numer tygodnia (1-10)
   */
  async expandWeek(weekNumber: number) {
    const weekAccordion = this.getWeekAccordion(weekNumber);

    // Sprawdź czy accordion jest już rozwinięty
    const isExpanded = await weekAccordion.getAttribute('aria-expanded');

    if (isExpanded !== 'true') {
      await weekAccordion.click();
      // Krótkie oczekiwanie na animację rozwinięcia
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Zwija accordion danego tygodnia
   * @param weekNumber - Numer tygodnia (1-10)
   */
  async collapseWeek(weekNumber: number) {
    const weekAccordion = this.getWeekAccordion(weekNumber);

    const isExpanded = await weekAccordion.getAttribute('aria-expanded');

    if (isExpanded === 'true') {
      await weekAccordion.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Weryfikuje czy tytuł planu treningowego jest widoczny
   */
  async expectPlanTitle() {
    await expect(this.page.getByRole('heading', { name: /twój plan treningowy/i })).toBeVisible();
  }

  /**
   * Weryfikuje zakres dat planu treningowego
   * Sprawdza czy wyświetlana jest data rozpoczęcia i zakończenia
   */
  async expectDateRange() {
    // Data range powinien zawierać dwa elementy daty rozdzielone myślnikiem
    await expect(this.planHeader.getByText(/-/)).toBeVisible();
  }

  /**
   * Zwraca tekst ze statystyk ukończenia
   * Przydatne do weryfikacji konkretnych wartości
   */
  async getCompletionStatsText(): Promise<string> {
    return await this.completionStats.textContent() || '';
  }

  /**
   * Weryfikuje progress bar
   */
  async expectProgressBar() {
    const progressBar = this.page.getByRole('progressbar');
    await expect(progressBar).toBeVisible();
  }
}
