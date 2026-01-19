# Testy E2E - Athletica

Testy End-to-End dla aplikacji Athletica używające Playwright.

## Struktura katalogów

```
e2e/
├── page-objects/           # Page Object Models
│   ├── LoginPage.ts        # POM dla strony logowania
│   ├── SurveyPage.ts       # POM dla strony ankiety
│   ├── DashboardPage.ts    # POM dla dashboardu
│   ├── types.ts            # Typy danych testowych
│   ├── index.ts            # Barrel export
│   └── README.md           # Dokumentacja POM
├── fixtures/               # Dane testowe (fixtures)
│   └── test-data.ts        # Centralne dane testowe
├── auth/                   # Testy autentykacji
│   └── login.spec.ts       # Testy logowania
├── login-and-first-survey.spec.ts  # Scenariusz 1: Główny test E2E
└── README.md               # Ten plik
```

## Uruchamianie testów

### Wszystkie testy

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom w trybie UI (interaktywny)
npm run test:e2e:ui

# Uruchom w trybie debug
npm run test:e2e:debug
```

### Konkretny test

```bash
# Uruchom tylko Scenariusz 1
npx playwright test login-and-first-survey

# Uruchom tylko testy logowania
npx playwright test auth/login

# Uruchom test w konkretnej przeglądarce
npx playwright test --project=chromium
```

### Generowanie raportu

```bash
# Pokaż ostatni raport HTML
npx playwright show-report
```

## Wymagania środowiska

### Zmienne środowiskowe

Utwórz plik `.env.test` w katalogu głównym projektu:

```env
# Dane użytkownika testowego
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test1234!

# Base URL (opcjonalne, domyślnie localhost:3000)
BASE_URL=http://localhost:3000
```

### Przygotowanie danych testowych

Przed uruchomieniem testów upewnij się, że:

1. **Użytkownik testowy istnieje w bazie danych**
   - Email: wartość z `TEST_USER_EMAIL`
   - Hasło: wartość z `TEST_USER_PASSWORD`

2. **Aplikacja działa lokalnie**
   ```bash
   npm run dev
   ```

3. **Baza danych jest dostępna i zmigrowana**
   ```bash
   supabase db reset  # lub odpowiednia komenda dla Twojego setup'u
   ```

## Scenariusze testowe

### Scenariusz 1: Logowanie i pierwsze użycie

**Plik:** `login-and-first-survey.spec.ts`

**Opis:** Test weryfikuje pełny flow nowego użytkownika:
1. Logowanie do aplikacji
2. Wypełnienie ankiety (wszystkie sekcje)
3. Generowanie planu treningowego przez AI
4. Weryfikacja wyświetlenia planu w dashboardzie

**Czas trwania:** ~60-90 sekund (w zależności od AI)

**Zgodność z planem testów:** TC-AUTH-002, TC-SURVEY-001

### Testy logowania

**Plik:** `auth/login.spec.ts`

**Scenariusze:**
- Wyświetlanie formularza logowania
- Walidacja pustych pól
- Błędne dane logowania
- Poprawne logowanie
- Nawigacja do "Forgot Password"
- Accessibility

## Debugowanie testów

### Tryb UI

Najwygodniejszy sposób na debugowanie:

```bash
npm run test:e2e:ui
```

W trybie UI możesz:
- Oglądać testy krok po kroku
- Zatrzymywać wykonanie
- Inspekcjonować elementy
- Przeglądać timeline

### Tryb Debug

```bash
npm run test:e2e:debug
```

Lub z konkretnym testem:

```bash
npx playwright test login-and-first-survey --debug
```

### Trace Viewer

Po nieudanym teście, trace jest automatycznie zapisywany:

```bash
npx playwright show-trace trace.zip
```

### Screenshots i Videos

Screenshots i videos są automatycznie zapisywane przy niepowodzeniu testu w katalogu `test-results/`.

## Wzorce testowe

### Używanie Page Object Models

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage, SurveyPage, DashboardPage } from './page-objects';
import { testUser, firstTimeSurveyData } from './fixtures/test-data';

test('przykładowy test', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);
  await loginPage.waitForSuccessfulLogin();
});
```

### Używanie test.step()

Dla lepszej czytelności raportów:

```typescript
test('test z krokami', async ({ page }) => {
  await test.step('Logowanie użytkownika', async () => {
    // ... kroki logowania
  });

  await test.step('Wypełnienie ankiety', async () => {
    // ... kroki ankiety
  });
});
```

### Dane testowe

Wszystkie dane testowe powinny być w `fixtures/test-data.ts`:

```typescript
import { testUser, firstTimeSurveyData } from './fixtures/test-data';
```

## Konfiguracja Playwright

Konfiguracja w `playwright.config.ts`:

- **Timeout:** 120s (2 minuty)
- **Przeglądarki:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, iPad
- **Base URL:** http://localhost:3000 (lub z .env)
- **Screenshots:** tylko przy błędach
- **Videos:** tylko przy błędach
- **Traces:** przy pierwszym retry

## Best Practices

1. **Używaj data-testid**
   - Wszystkie selektory używają `data-testid` dla stabilności

2. **Używaj Page Object Models**
   - Nie używaj bezpośrednich selektorów w testach
   - Enkapsuluj logikę w POM

3. **Izolacja testów**
   - Każdy test powinien być niezależny
   - Nie polegaj na stanie z poprzednich testów

4. **Czekaj na elementy**
   - Używaj `expect().toBeVisible()` zamiast ręcznych waitów
   - Playwright automatycznie czeka na elementy

5. **Używaj test.step()**
   - Ułatwia debugowanie
   - Lepsze raporty

6. **Cleanup**
   - Jeśli test tworzy dane, oczyść je po zakończeniu

## Troubleshooting

### Test timeout

Jeśli test przekracza timeout (120s):
- Sprawdź czy aplikacja działa (`npm run dev`)
- Sprawdź czy AI service jest dostępny
- Zwiększ timeout w `playwright.config.ts`

### Element nie znaleziony

Jeśli test nie może znaleźć elementu:
- Sprawdź czy `data-testid` istnieje w komponencie
- Użyj Playwright Inspector: `npx playwright test --debug`
- Sprawdź czy element jest widoczny (nie ukryty)

### Flaky tests

Jeśli test czasami przechodzi, czasami nie:
- Dodaj odpowiednie `waitFor` przed asercjami
- Sprawdź czy nie ma race conditions
- Użyj `test.step()` do identyfikacji problemu

### Problemy z AI generation

Jeśli generowanie planu nie działa:
- Sprawdź klucz API OpenRouter
- Sprawdź logi serwera
- Użyj mock'ów dla AI (jeśli dostępne)

## CI/CD

Testy są automatycznie uruchamiane w CI/CD:

```yaml
- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Kontakt

W razie problemów z testami E2E:
- Sprawdź dokumentację Playwright: https://playwright.dev
- Zobacz Page Object Models: `./page-objects/README.md`
- Otwórz issue w repozytorium projektu
