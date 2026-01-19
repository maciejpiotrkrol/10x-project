# Page Object Models (POM)

Ten katalog zawiera Page Object Models dla testów E2E aplikacji Athletica.

## Struktura

```
page-objects/
├── types.ts              # Typy danych testowych
├── LoginPage.ts          # POM dla strony logowania
├── SurveyPage.ts         # POM dla strony ankiety
├── DashboardPage.ts      # POM dla strony dashboardu
├── index.ts              # Barrel export
└── README.md             # Ten plik
```

## Użycie

### Import Page Objects

```typescript
import { LoginPage, SurveyPage, DashboardPage } from './page-objects';
import type { SurveyData } from './page-objects';
```

### Przykład testu

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage, SurveyPage, DashboardPage } from './page-objects';

test('użytkownik loguje się i generuje plan', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const surveyPage = new SurveyPage(page);
  const dashboardPage = new DashboardPage(page);

  // Logowanie
  await loginPage.goto();
  await loginPage.login('test@example.com', 'Test1234!');
  await loginPage.waitForSuccessfulLogin();

  // Wypełnienie ankiety
  await surveyPage.goto();
  await surveyPage.fillTrainingGoals({
    goalDistance: 'Half Marathon',
    weeklyKm: 30,
    trainingDays: 4,
  });
  await surveyPage.fillPersonalData({
    age: 30,
    weight: 70,
    height: 175,
    gender: 'M',
  });
  await surveyPage.fillPersonalRecords([
    { distance: '5K', timeSeconds: 1350 },
    { distance: '10K', timeSeconds: 2880 },
  ]);
  await surveyPage.acceptDisclaimer();
  await surveyPage.submitSurvey();

  // Weryfikacja
  await surveyPage.expectLoadingModal();
  await surveyPage.waitForPlanGeneration();
  await dashboardPage.expectPlanToBeVisible();
});
```

## Wzorce

### Lokatory

Wszystkie lokatory używają `data-testid` dla stabilności testów:

```typescript
this.emailInput = page.getByTestId('login-email-input');
```

### Metody akcji

Metody wykonujące akcje na stronie:

```typescript
async login(email: string, password: string) {
  await this.emailInput.fill(email);
  await this.passwordInput.fill(password);
  await this.submitButton.click();
}
```

### Metody asercji

Metody weryfikujące stan strony (prefiks `expect`):

```typescript
async expectLoginError(message?: string) {
  await expect(this.errorMessage).toBeVisible();
  if (message) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### Helper methods

Metody pomocnicze łączące wiele akcji:

```typescript
async fillCompleteSurvey(trainingGoals, personalData, personalRecords) {
  await this.fillTrainingGoals(trainingGoals);
  await this.fillPersonalData(personalData);
  await this.fillPersonalRecords(personalRecords);
  await this.acceptDisclaimer();
}
```

## Konwencje

1. **Nazewnictwo metod:**
   - Akcje: czasownik + rzeczownik (np. `fillPersonalData`, `clickSubmit`)
   - Asercje: `expect` + rzeczownik (np. `expectLoginError`, `expectPlanVisible`)
   - Gettery: `get` + rzeczownik (np. `getWeekAccordion`)

2. **Parametry opcjonalne:**
   - Timeout domyślnie ustawiony na sensowne wartości
   - Można nadpisać jeśli potrzeba

3. **Dokumentacja:**
   - Każda metoda publiczna ma JSDoc
   - Opisuje co robi, jakie przyjmuje parametry i co zwraca

4. **Readonly properties:**
   - Page i lokatory są readonly dla bezpieczeństwa
