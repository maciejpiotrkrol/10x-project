# Quick Start - Uruchomienie testu E2E

Przewodnik krok po kroku do uruchomienia Scenariusza 1 po raz pierwszy.

## Krok 1: Przygotowanie środowiska

### 1.1 Skopiuj plik konfiguracyjny

```bash
cp .env.test.example .env.test
```

### 1.2 Wypełnij dane testowe w `.env.test`

```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=Test1234!
BASE_URL=http://localhost:3000
```

## Krok 2: Utwórz użytkownika testowego

Użytkownik testowy musi istnieć w bazie danych. Możesz go utworzyć na dwa sposoby:

### Opcja A: Przez UI (zalecane dla pierwszego razu)

1. Uruchom aplikację:
   ```bash
   npm run dev
   ```

2. Otwórz http://localhost:3000/auth/signup

3. Zarejestruj użytkownika z danymi z `.env.test`:
   - Email: wartość z `TEST_USER_EMAIL`
   - Hasło: wartość z `TEST_USER_PASSWORD`

4. Zweryfikuj email (jeśli wymagane)

### Opcja B: Bezpośrednio w bazie danych

Jeśli masz dostęp do Supabase:

```sql
-- Wstaw użytkownika testowego (użyj Supabase Dashboard lub CLI)
-- Email i hasło z .env.test
```

## Krok 3: Zainstaluj zależności (jeśli nie zrobiono wcześniej)

```bash
# Zainstaluj Playwright browsers
npx playwright install chromium
```

## Krok 4: Upewnij się że aplikacja działa

```bash
# Terminal 1 - uruchom aplikację
npm run dev

# Sprawdź czy http://localhost:3000 działa
```

## Krok 5: Uruchom test

### Opcja A: Tryb UI (zalecane dla pierwszego razu)

```bash
# Terminal 2 - uruchom test w trybie UI
npm run test:e2e:ui
```

1. W oknie Playwright UI wybierz `login-and-first-survey.spec.ts`
2. Kliknij "Run"
3. Obserwuj wykonanie testu krok po kroku

### Opcja B: Tryb headless (szybki)

```bash
# Terminal 2 - uruchom test
npm run test:e2e
```

### Opcja C: Tryb debug (do debugowania)

```bash
# Terminal 2 - uruchom w trybie debug
npm run test:e2e:debug
```

## Krok 6: Weryfikacja wyniku

### Jeśli test przeszedł ✅

Zobaczysz zielony output:

```
✓ Scenariusz 1: Logowanie i pierwsze użycie > użytkownik loguje się, wypełnia ankietę i generuje pierwszy plan (60-90s)

1 passed (90s)
```

### Jeśli test nie przeszedł ❌

1. **Sprawdź logi** - przeczytaj komunikat błędu
2. **Sprawdź screenshots** - automatycznie zapisane w `test-results/`
3. **Zobacz trace** - szczegółowy przebieg testu:
   ```bash
   npx playwright show-report
   ```

## Troubleshooting

### Problem: "Test user not found" lub błąd logowania

**Rozwiązanie:**
- Sprawdź czy użytkownik istnieje w bazie
- Sprawdź czy email i hasło w `.env.test` są poprawne
- Spróbuj zalogować się ręcznie przez UI

### Problem: "Timeout waiting for plan generation"

**Rozwiązanie:**
- Sprawdź czy OpenRouter API key jest poprawny
- Sprawdź logi serwera (`npm run dev`)
- Sprawdź czy masz limit API w OpenRouter
- Zwiększ timeout w teście (domyślnie 60s)

### Problem: "Element not found"

**Rozwiązanie:**
- Sprawdź czy wszystkie `data-testid` zostały dodane do komponentów (Etap 1)
- Uruchom test w trybie debug: `npm run test:e2e:debug`
- Zobacz screenshot w `test-results/`

### Problem: "Port 3000 is already in use"

**Rozwiązanie:**
- Aplikacja już działa na porcie 3000
- To jest OK! Playwright użyje istniejącej instancji
- Jeśli chcesz świeży start, zatrzymaj `npm run dev` i uruchom ponownie

## Następne kroki

Po pomyślnym uruchomieniu testu:

1. **Eksploruj inne testy:**
   - `auth/login.spec.ts` - testy logowania
   - Dodaj własne testy zgodnie z planem testów

2. **Uruchom na różnych przeglądarkach:**
   ```bash
   # Chromium (domyślny)
   npx playwright test --project=chromium

   # Firefox
   npx playwright test --project=firefox

   # Mobile Chrome
   npx playwright test --project="Mobile Chrome"
   ```

3. **Zintegruj z CI/CD:**
   - Dodaj testy do GitHub Actions
   - Zobacz dokumentację w `e2e/README.md`

4. **Twórz nowe scenariusze:**
   - Użyj Page Object Models z `page-objects/`
   - Dodaj nowe fixtures do `fixtures/test-data.ts`
   - Postępuj zgodnie z planem testów w `.ai/athletica-test-plan.md`

## Potrzebujesz pomocy?

- 📖 Przeczytaj `e2e/README.md` - pełna dokumentacja
- 📖 Zobacz `page-objects/README.md` - jak używać POM
- 🐛 Sprawdź Playwright docs: https://playwright.dev
- 💬 Otwórz issue w repozytorium

---

**Powodzenia z testami! 🚀**
