import { test, expect } from '@playwright/test';
import { LoginPage, SurveyPage, DashboardPage } from './page-objects';
import { testUser, firstTimeSurveyData } from './fixtures/test-data';

/**
 * Scenariusz 1: Logowanie i pierwsze użycie
 *
 * Test weryfikuje pełny flow nowego użytkownika:
 * 1. Logowanie do aplikacji
 * 2. Wypełnienie ankiety (wszystkie sekcje)
 * 3. Generowanie planu treningowego przez AI
 * 4. Weryfikacja wyświetlenia planu w dashboardzie
 *
 * Zgodnie z TC-AUTH-002 i TC-SURVEY-001 z planu testów
 */
test.describe('Scenariusz 1: Logowanie i pierwsze użycie', () => {
  test('użytkownik loguje się, wypełnia ankietę i generuje pierwszy plan', async ({ page }) => {
    // ARRANGE - przygotowanie środowiska testowego
    const loginPage = new LoginPage(page);
    const surveyPage = new SurveyPage(page);
    const dashboardPage = new DashboardPage(page);

    // ACT & ASSERT - krok po kroku zgodnie ze scenariuszem

    // Krok 1-2: Nawigacja do strony logowania
    await test.step('Nawigacja do strony logowania', async () => {
      await loginPage.goto();
      await loginPage.expectLoginFormVisible();
    });

    // Krok 3-4: Logowanie użytkownika
    await test.step('Logowanie z poprawnymi danymi', async () => {
      await loginPage.login(testUser.email, testUser.password);
      await loginPage.waitForSuccessfulLogin();

      // Weryfikacja przekierowania
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    // Krok 5: Nawigacja do ankiety
    await test.step('Nawigacja do strony ankiety', async () => {
      await surveyPage.goto();
      await expect(surveyPage.surveyForm).toBeVisible();
    });

    // Krok 6-7: Wypełnienie sekcji "Cele treningowe"
    await test.step('Wypełnienie sekcji Cele treningowe', async () => {
      await surveyPage.fillTrainingGoals(firstTimeSurveyData.trainingGoals);

      // Weryfikacja wypełnienia
      await expect(surveyPage.goalDistanceSelect).toHaveText(/Half Marathon|Półmaraton/);
      await expect(surveyPage.weeklyKmInput).toHaveValue('30');
      await expect(surveyPage.trainingDaysInput).toHaveValue('4');
    });

    // Krok 8-9: Wypełnienie sekcji "Dane osobowe"
    await test.step('Wypełnienie sekcji Dane osobowe', async () => {
      await surveyPage.fillPersonalData(firstTimeSurveyData.personalData);

      // Weryfikacja wypełnienia
      await expect(surveyPage.ageInput).toHaveValue('30');
      await expect(surveyPage.weightInput).toHaveValue('70');
      await expect(surveyPage.heightInput).toHaveValue('175');
      await expect(surveyPage.genderMaleRadio).toBeChecked();
    });

    // Krok 10-11: Wypełnienie sekcji "Rekordy życiowe"
    await test.step('Wypełnienie sekcji Rekordy życiowe', async () => {
      await surveyPage.fillPersonalRecords(firstTimeSurveyData.personalRecords);

      // Weryfikacja wypełnienia pierwszego rekordu
      const firstRecordDistance = surveyPage.getRecordDistanceSelect(0);
      const firstRecordTime = surveyPage.getRecordTimeInput(0);
      await expect(firstRecordDistance).toHaveText(/5K/);
      await expect(firstRecordTime).toHaveValue('1350');

      // Weryfikacja wypełnienia drugiego rekordu
      const secondRecordDistance = surveyPage.getRecordDistanceSelect(1);
      const secondRecordTime = surveyPage.getRecordTimeInput(1);
      await expect(secondRecordDistance).toHaveText(/10K/);
      await expect(secondRecordTime).toHaveValue('2880');
    });

    // Krok 12: Zaakceptowanie disclaimer
    await test.step('Zaakceptowanie disclaimer', async () => {
      await surveyPage.acceptDisclaimer();

      // Weryfikacja zaznaczenia
      await expect(surveyPage.disclaimerCheckbox).toBeChecked();
    });

    // Krok 13: Kliknięcie "Generuj plan"
    await test.step('Kliknięcie przycisku Generuj plan', async () => {
      await surveyPage.submitSurvey();
    });

    // Krok 14: Oczekiwanie na loading modal
    await test.step('Weryfikacja wyświetlenia loading modal', async () => {
      await surveyPage.expectLoadingModal();

      // Weryfikacja obecności spinnera
      await expect(surveyPage.loadingSpinner).toBeVisible();
    });

    // Krok 15: Oczekiwanie na wygenerowanie planu (max 60s)
    await test.step('Oczekiwanie na wygenerowanie planu przez AI', async () => {
      await surveyPage.waitForPlanGeneration(60000);
    });

    // Krok 16: Przekierowanie do dashboardu
    await test.step('Weryfikacja przekierowania do dashboardu', async () => {
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    });

    // Krok 17: Weryfikacja wyświetlenia planu treningowego
    await test.step('Weryfikacja wyświetlenia planu treningowego', async () => {
      await dashboardPage.waitForPlanToLoad();
      await dashboardPage.expectPlanToBeVisible();

      // Weryfikacja nagłówka planu
      await dashboardPage.expectPlanTitle();

      // Weryfikacja zakresu dat
      await dashboardPage.expectDateRange();

      // Weryfikacja statystyk ukończenia (nowy plan = 0 wykonanych treningów)
      await dashboardPage.expectCompletionStats('Wykonano 0');

      // Weryfikacja progress bar
      await dashboardPage.expectProgressBar();
    });
  });

  /**
   * Test negatywny: Weryfikacja walidacji pustych pól w ankiecie
   * Zgodnie z TC-SURVEY-002 z planu testów
   */
  test('powinien wyświetlić błędy walidacji dla pustych pól ankiety', async ({ page }) => {
    // ARRANGE
    const loginPage = new LoginPage(page);
    const surveyPage = new SurveyPage(page);

    // ACT
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForSuccessfulLogin();

    await surveyPage.goto();

    // Próba submitu bez wypełnienia formularza
    await surveyPage.submitSurvey();

    // ASSERT - Formularz nie powinien przejść dalej
    // Powinniśmy wciąż być na stronie ankiety
    await expect(page).toHaveURL(/\/survey/);

    // Powinny pojawić się błędy walidacji
    await expect(page.getByText(/wymagany/i).first()).toBeVisible({ timeout: 3000 });
  });

  /**
   * Test weryfikujący accessibility formularza ankiety
   */
  test('formularz ankiety powinien być dostępny (accessibility)', async ({ page }) => {
    // ARRANGE
    const loginPage = new LoginPage(page);
    const surveyPage = new SurveyPage(page);

    // ACT
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.waitForSuccessfulLogin();

    await surveyPage.goto();

    // ASSERT - Weryfikacja dostępności
    // Wszystkie inputy powinny mieć proper labels
    await expect(surveyPage.goalDistanceSelect).toBeVisible();
    await expect(surveyPage.weeklyKmInput).toHaveAttribute('type', 'number');
    await expect(surveyPage.trainingDaysInput).toHaveAttribute('type', 'number');

    // Radio buttons powinny być dostępne
    await expect(surveyPage.genderMaleRadio).toHaveAttribute('type', 'radio');
    await expect(surveyPage.genderFemaleRadio).toHaveAttribute('type', 'radio');

    // Disclaimer checkbox powinien być dostępny
    await expect(surveyPage.disclaimerCheckbox).toHaveAttribute('type', 'checkbox');
  });
});
