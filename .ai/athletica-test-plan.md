# Plan Testów - Athletica

## 1. Wprowadzenie i Cele Testowania

### 1.1. Kontekst projektu

Athletica to aplikacja webowa do generowania spersonalizowanych 10-tygodniowych planów treningowych dla biegaczy amatorów, wykorzystująca sztuczną inteligencję (OpenRouter/Claude 3.5 Haiku). Aplikacja umożliwia użytkownikom:

- Rejestrację i logowanie z resetowaniem hasła
- Wypełnienie ankiety z danymi osobowymi, celami treningowymi i rekordami życiowymi
- Wygenerowanie planu treningowego przez AI na podstawie zebranych danych
- Przeglądanie 70-dniowego planu treningowego z podziałem na tygodnie
- Oznaczanie poszczególnych treningów jako wykonane/niewykonane
- Przeglądanie profilu użytkownika (read-only)

### 1.2. Cele testowania

Główne cele procesu testowania:

1. **Zapewnienie funkcjonalności kluczowych ścieżek użytkownika** (signup → survey → plan generation → dashboard)
2. **Weryfikacja bezpieczeństwa danych** poprzez testy RLS policies i autoryzacji
3. **Walidacja integracji z zewnętrznymi serwisami** (Supabase Auth, OpenRouter AI)
4. **Potwierdzenie jakości UI/UX** poprzez testy dostępności i responsywności
5. **Identyfikacja i eliminacja błędów krytycznych** przed wdrożeniem produkcyjnym
6. **Weryfikacja wydajności aplikacji** w kontekście SSR i optimistic UI updates

### 1.3. Kryteria sukcesu

Projekt przejdzie do produkcji, gdy:

- 100% testów krytycznych (P0) zakończy się sukcesem
- 95% testów wysokiego priorytetu (P1) zakończy się sukcesem
- Nie będzie żadnych błędów krytycznych (Critical) ani blokerów
- Wszystkie znalezione błędy wysokiego priorytetu (High) zostaną naprawione
- Aplikacja przejdzie pozytywnie audyt bezpieczeństwa (RLS policies)
- Wydajność API endpoints < 2s (95 percentyl)

---

## 2. Zakres Testów

### 2.1. W zakresie testów (In Scope)

#### Funkcjonalności MVP:

- **Moduł autentykacji**: Signup, login, logout, forgot password, reset password
- **Moduł ankiety (Survey)**: Multi-step form z walidacją (dane osobowe, cele, rekordy)
- **Moduł generowania planów**: Integracja z AI, zapis do bazy danych, deaktywacja starych planów
- **Moduł dashboardu**: Wyświetlanie planu, grupowanie po tygodniach, toggle completion
- **Moduł profilu**: Read-only wyświetlanie danych użytkownika
- **Nawigacja**: Navbar, BottomNav, routing między stronami

#### Komponenty techniczne:

- API endpoints (wszystkie w `src/pages/api/`)
- Services (ai.service, training-plan.service)
- Custom hooks (useOptimisticWorkouts, useScrollToToday, useWorkoutToggle)
- Middleware Astro (Supabase injection)
- Database schema (migracje, RLS policies, constraints)
- Komponenty React (formularze, karty, accordiony)
- Validation schemas (Zod)

#### Aspekty niefunkcjonalne:

- Bezpieczeństwo (RLS, input validation, XSS, SQL injection)
- Wydajność (response times, rendering performance)
- Dostępność (WCAG 2.1 AA)
- Responsywność (mobile, tablet, desktop)
- Compatibility (Chrome, Firefox, Safari, Edge - ostatnie 2 wersje)

### 2.2. Poza zakresem testów (Out of Scope)

Funkcjonalności planowane po MVP:

- Import/export planów treningowych
- Social sharing
- Integracje zewnętrzne (Strava, Garmin)
- Aplikacje mobilne (iOS, Android)
- Edycja poszczególnych treningów
- Notatki do treningów
- Kontekstualne porady AI (technika, dieta, regeneracja)
- Historia planów treningowych
- Statystyki i wykresy postępów

---

## 3. Typy Testów do Przeprowadzenia

### 3.1. Testy Jednostkowe (Unit Tests)

**Cel**: Weryfikacja pojedynczych funkcji, komponentów i modułów w izolacji.

**Narzędzie**: Vitest + React Testing Library

**Zakres**:

1. **Services**:
   - `ai.service.ts`: Testowanie buildPrompt(), parsowanie odpowiedzi AI, error handling
   - `training-plan.service.ts`: Testowanie calculateCompletionStats()

2. **Utils/Helpers**:
   - `date-helpers.ts`: Kalkulacje dat, timezone handling
   - `workout-helpers.ts`: Funkcje pomocnicze
   - `formatGender.ts`, `formatTime.ts`: Formatowanie danych

3. **Validation Schemas**:
   - `auth.schemas.ts`: Walidacja email, password (min 8 znaków)
   - Zod schemas w API endpoints (generate.ts, [id].ts)

4. **Custom Hooks**:
   - `useOptimisticWorkouts`: Testowanie optimistic updates i rollback
   - `useScrollToToday`: Testowanie logiki znalezienia dzisiejszego treningu
   - `useWorkoutToggle`: Testowanie toggle completion logic
   - `useFABVisibility`: Testowanie widoczności FAB

5. **Komponenty React** (izolowane):
   - `WorkoutDayCard`: Renderowanie treningów i dni odpoczynku
   - `WeekAccordion`: Grupowanie treningów
   - `PlanHeader`: Wyświetlanie statystyk
   - Komponenty formularzy: LoginForm, SignupForm, SurveyForm sections

**Pokrycie kodu (Code Coverage)**: Min. 80% dla services i utils, 70% dla komponentów.

### 3.2. Testy Integracyjne (Integration Tests)

**Cel**: Weryfikacja współpracy między modułami i zewnętrznymi serwisami.

**Narzędzie**: Vitest + Supertest (dla API) + Playwright (dla E2E flows)

**Zakres**:

1. **API Endpoints**:
   - POST `/api/auth/signup` → Supabase Auth integration
   - POST `/api/auth/login` → Session creation
   - POST `/api/training-plans/generate` → AI service → Database (transactional flow)
   - PATCH `/api/workout-days/[id]` → Database update + RLS verification
   - GET `/api/training-plans/active` → Database query with joins

2. **Database Operations**:
   - Transactional flow w `createTrainingPlan()`: Profile upsert → Records delete+insert → Plan deactivate → New plan create → Workout days create
   - RLS policies: Testy autoryzacji dla różnych użytkowników
   - Constraints: `no_completed_rest_days`, unique constraints

3. **AI Integration**:
   - OpenRouter API: Testowanie response parsing, error handling (503, 429, 500)
   - Walidacja struktury JSON (70 workout days, required fields)

4. **Middleware**:
   - Astro middleware: Supabase client injection
   - Session verification w API endpoints

5. **Frontend-Backend Integration**:
   - Survey submission → Plan generation → Redirect do dashboard
   - Workout toggle → Optimistic UI → API call → Rollback on error

**Kluczowe scenariusze integracyjne**:

- Nowy użytkownik: Signup → Email verification → Login → Survey → Plan generation → Dashboard
- Istniejący użytkownik: Login → Dashboard → Toggle workout → Logout
- Generowanie nowego planu: Survey → Confirmation dialog → Deactivate old plan → Generate new plan

### 3.3. Testy End-to-End (E2E Tests)

**Cel**: Weryfikacja pełnych ścieżek użytkownika od początku do końca.

**Narzędzie**: Playwright

**Zakres**:

**Scenariusz 1: Rejestracja i pierwsze użycie**

1. Odwiedzenie strony głównej
2. Kliknięcie "Zarejestruj się"
3. Wypełnienie formularza rejestracji (email, hasło)
4. Potwierdzenie emaila (jeśli wymagane)
5. Logowanie
6. Wypełnienie ankiety (wszystkie sekcje)
7. Zaakceptowanie disclaimer
8. Kliknięcie "Generuj plan"
9. Oczekiwanie na wygenerowanie planu (loading modal)
10. Przekierowanie do dashboardu
11. Weryfikacja wyświetlenia planu treningowego

**Scenariusz 2: Logowanie i zarządzanie planem**

1. Logowanie
2. Nawigacja do dashboardu
3. Rozwinięcie tygodnia z dzisiejszym treningiem
4. Oznaczenie treningu jako wykonany
5. Weryfikacja aktualizacji progress bara
6. Odznaczenie treningu
7. Weryfikacja aktualizacji progress bara
8. Nawigacja do profilu
9. Weryfikacja wyświetlenia danych

**Scenariusz 3: Reset hasła**

1. Kliknięcie "Forgot Password"
2. Wprowadzenie emaila
3. Wysłanie linku resetującego
4. Otwarcie linku (z emaila)
5. Ustawienie nowego hasła
6. Logowanie z nowym hasłem

**Scenariusz 4: Generowanie nowego planu (nadpisanie)**

1. Logowanie z aktywnym planem
2. Nawigacja do ankiety (/survey)
3. Zmiana danych w ankiecie
4. Kliknięcie "Generuj plan"
5. Potwierdzenie w dialog "Confirmation"
6. Oczekiwanie na generowanie
7. Weryfikacja nowego planu w dashboardzie

**Scenariusz 5: Mobile navigation**

1. Uruchomienie w mobile viewport
2. Weryfikacja responsywności formularzy
3. Testowanie BottomNav navigation
4. Scroll do dzisiejszego treningu (FAB button)
5. Toggle workout completion na mobile

### 3.4. Testy Wydajnościowe (Performance Tests)

**Cel**: Zapewnienie akceptowalnych czasów odpowiedzi i płynności aplikacji.

**Narzędzie**: Lighthouse, WebPageTest, k6 (dla API load testing)

**Metryki do monitorowania**:

1. **API Response Times**:
   - POST `/api/training-plans/generate`: < 15s (95 percentyl) - AI call
   - GET `/api/training-plans/active`: < 500ms (95 percentyl)
   - PATCH `/api/workout-days/[id]`: < 300ms (95 percentyl)
   - POST `/api/auth/login`: < 1s (95 percentyl)

2. **Page Load Performance** (Lighthouse):
   - First Contentful Paint (FCP): < 1.5s
   - Largest Contentful Paint (LCP): < 2.5s
   - Time to Interactive (TTI): < 3.5s
   - Cumulative Layout Shift (CLS): < 0.1

3. **SSR Rendering**:
   - Dashboard page (with plan): < 800ms server render time
   - Profile page: < 500ms server render time

4. **Optimistic UI**:
   - Toggle workout: Immediate UI update (< 50ms)
   - Rollback on error: < 100ms

**Load Testing Scenariusze**:

- **Baseline**: 10 concurrent users generując plany jednocześnie
- **Peak**: 50 concurrent users navigating dashboard + toggling workouts
- **Stress test**: 100 concurrent users (find breaking point)

**Performance Budget**:

- Bundle size (JS): < 300KB (gzipped)
- Initial page load: < 2s (3G Fast network)
- API 95th percentile: < 2s (excluding AI generation)

### 3.5. Testy Bezpieczeństwa (Security Tests)

**Cel**: Wykrycie i eliminacja podatności bezpieczeństwa.

**Narzędzie**: OWASP ZAP, Manual penetration testing, Supabase RLS testing

**Zakres**:

1. **Row Level Security (RLS) Policies**:
   - Testowanie dostępu do danych innych użytkowników
   - Próba odczytu workout_days innego użytkownika
   - Próba update/delete danych innych użytkowników
   - Weryfikacja policy dla `anon` role (should deny all)

2. **Authentication & Authorization**:
   - Próba dostępu do chronionych endpointów bez tokena
   - Próba użycia wygasłego/niewłaściwego tokena
   - Session hijacking attempts
   - CSRF protection

3. **Input Validation**:
   - SQL Injection w formularzach (email, workout_description)
   - XSS injection w polach tekstowych
   - Path traversal w API endpoints
   - Payload size limits (DoS prevention)

4. **API Security**:
   - Rate limiting (jeśli zaimplementowany)
   - API key exposure (OpenRouter key)
   - Sensitive data in error messages
   - HTTPS enforcement

5. **Database Constraints**:
   - Próba oznaczenia rest day jako completed (should fail)
   - Próba wstawienia invalid enum values
   - Foreign key constraint violations

**Testy specyficzne dla RLS**:

```sql
-- Test jako user A
SELECT * FROM workout_days WHERE training_plan_id IN (
  SELECT id FROM training_plans WHERE user_id = '<user_b_id>'
);
-- Expected: 0 rows (blocked by RLS)

-- Test update jako user A
UPDATE workout_days SET is_completed = true
WHERE id = '<user_b_workout_id>';
-- Expected: 0 rows affected (blocked by RLS)
```

### 3.6. Testy Dostępności (Accessibility Tests)

**Cel**: Zapewnienie zgodności z WCAG 2.1 Level AA i użyteczności dla osób z niepełnosprawnościami.

**Narzędzie**: axe DevTools, Lighthouse Accessibility Audit, Manual keyboard testing

**Zakres**:

1. **Semantic HTML**:
   - Proper heading hierarchy (h1 → h2 → h3)
   - Semantic landmarks: `<main>`, `<nav>`, `<section>`
   - Form labels properly associated with inputs

2. **ARIA Attributes**:
   - `aria-label` na interactive elements
   - `aria-expanded` na accordions
   - `aria-live` regions dla dynamic updates (toast notifications)
   - `aria-current` na navigation

3. **Keyboard Navigation**:
   - Tab order logiczny i intuicyjny
   - Focus visible indicators
   - Escape key zamyka dialogi
   - Enter/Space aktywują przyciski

4. **Screen Reader Compatibility**:
   - Testowanie z NVDA (Windows) / VoiceOver (macOS)
   - Alt text dla wszystkich obrazów (jeśli są)
   - Meaningful link text (avoid "click here")

5. **Color Contrast**:
   - Minimum 4.5:1 dla normalnego tekstu
   - Minimum 3:1 dla large text i UI components
   - Nie poleganie wyłącznie na kolorze do przekazania informacji

6. **Form Accessibility**:
   - Error messages announced by screen readers
   - Required fields clearly marked
   - Autocomplete attributes dla common fields

**Kluczowe komponenty do przetestowania**:

- LoginForm, SignupForm, ResetPasswordForm
- SurveyForm (wszystkie sekcje)
- WeekAccordion (keyboard expand/collapse)
- WorkoutDayCard (keyboard toggle completion)
- ConfirmDialog (focus trap)
- LoadingModal (aria-busy state)

### 3.7. Testy Responsywności (Responsive Tests)

**Cel**: Zapewnienie poprawnego działania na różnych urządzeniach i rozmiarach ekranów.

**Narzędzie**: Playwright (device emulation), BrowserStack, Manual testing

**Viewports do przetestowania**:

1. **Mobile** (320px - 767px):
   - iPhone SE (375x667)
   - iPhone 12/13 (390x844)
   - Samsung Galaxy S21 (360x800)

2. **Tablet** (768px - 1023px):
   - iPad (768x1024)
   - iPad Pro (1024x1366)

3. **Desktop** (1024px+):
   - 1280x720 (HD)
   - 1920x1080 (Full HD)
   - 2560x1440 (2K)

**Aspekty do weryfikacji**:

- Layout nie psuje się na żadnym viewport
- Formularze są użyteczne na mobile (touch targets min. 44x44px)
- Navigation przełącza się między Navbar (desktop) a BottomNav (mobile)
- Text readable bez zoomu
- Images skalują się proporcjonalnie
- Accordiony działają poprawnie na mobile
- FAB button nie zasłania contentu

### 3.8. Testy Kompatybilności (Cross-Browser Tests)

**Cel**: Weryfikacja działania w różnych przeglądarkach.

**Narzędzie**: BrowserStack, Playwright (multi-browser)

**Przeglądarki do przetestowania**:

- **Chrome**: Ostatnie 2 wersje (desktop + mobile)
- **Firefox**: Ostatnie 2 wersje (desktop)
- **Safari**: Ostatnie 2 wersje (desktop + iOS)
- **Edge**: Ostatnia wersja (desktop)

**Kluczowe funkcjonalności do przetestowania cross-browser**:

- Astro View Transitions
- React hooks (useOptimistic pattern)
- Fetch API calls
- Date parsing (timezone consistency)
- CSS Grid/Flexbox layouts
- Tailwind CSS rendering

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Moduł Autentykacji

#### TC-AUTH-001: Rejestracja nowego użytkownika (Happy Path)

**Priorytet**: P0 (Krytyczny)
**Typ**: E2E

**Warunki wstępne**:
- Aplikacja dostępna
- Email testowy nie istnieje w systemie

**Kroki**:
1. Nawiguj do `/auth/signup`
2. Wprowadź email: `test+{timestamp}@example.com`
3. Wprowadź hasło: `Test1234!` (min. 8 znaków)
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat**:
- Użytkownik zostaje przekierowany do `/survey`
- Sesja zostaje utworzona (cookie obecny)
- Rekord w tabeli `auth.users` zostaje stworzony

**Dane testowe**: Różne formaty email, długości hasła

---

#### TC-AUTH-002: Logowanie istniejącego użytkownika

**Priorytet**: P0 (Krytyczny)
**Typ**: E2E

**Warunki wstępne**:
- Użytkownik `test@example.com` istnieje w systemie
- Hasło: `Test1234!`

**Kroki**:
1. Nawiguj do `/auth/login`
2. Wprowadź email: `test@example.com`
3. Wprowadź hasło: `Test1234!`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat**:
- Użytkownik zostaje przekierowany do `/dashboard`
- Sesja zostaje utworzona
- Navbar pokazuje nazwę użytkownika / avatar

**Przypadki negatywne**:
- TC-AUTH-002-NEG-1: Błędne hasło → Error toast "Nieprawidłowy email lub hasło"
- TC-AUTH-002-NEG-2: Nieistniejący email → Error toast
- TC-AUTH-002-NEG-3: Puste pola → Validation errors

---

#### TC-AUTH-003: Reset hasła (Forgot Password Flow)

**Priorytet**: P1 (Wysoki)
**Typ**: E2E

**Warunki wstępne**:
- Użytkownik `test@example.com` istnieje

**Kroki**:
1. Nawiguj do `/auth/login`
2. Kliknij "Zapomniałeś hasła?"
3. Wprowadź email: `test@example.com`
4. Kliknij "Wyślij link resetujący"
5. Sprawdź email (w test environment: Supabase Inbucket)
6. Kliknij link z emaila
7. Wprowadź nowe hasło: `NewTest1234!`
8. Potwierdź nowe hasło
9. Kliknij "Zresetuj hasło"

**Oczekiwany rezultat**:
- Email z linkiem zostaje wysłany
- Link prowadzi do `/auth/reset-password?token=...`
- Po resecie: przekierowanie do `/auth/login`
- Logowanie z nowym hasłem działa
- Logowanie ze starym hasłem nie działa

---

#### TC-AUTH-004: Wylogowanie użytkownika

**Priorytet**: P1 (Wysoki)
**Typ**: E2E

**Warunki wstępne**:
- Użytkownik zalogowany

**Kroki**:
1. Kliknij "Wyloguj" w Navbar
2. Potwierdź wylogowanie (jeśli confirmation dialog)

**Oczekiwany rezultat**:
- Przekierowanie do `/auth/login`
- Sesja zostaje usunięta (cookie cleared)
- Próba dostępu do `/dashboard` → redirect do login

---

#### TC-AUTH-005: Sesja wygasła podczas użytkowania

**Priorytet**: P1 (Wysoki)
**Typ**: Integration

**Warunki wstępne**:
- Użytkownik zalogowany
- Token JWT wygasł (symulacja poprzez zmianę czasu systemowego lub manualną invalidację)

**Kroki**:
1. Zaloguj się
2. Symuluj wygaśnięcie sesji
3. Próbuj oznaczyć trening jako wykonany (PATCH /api/workout-days/[id])

**Oczekiwany rezultat**:
- API zwraca 401 Unauthorized
- Toast error: "Sesja wygasła. Zaloguj się ponownie."
- Przekierowanie do `/auth/login` po 1.5s

---

### 4.2. Moduł Ankiety (Survey)

#### TC-SURVEY-001: Wypełnienie pełnej ankiety (Happy Path)

**Priorytet**: P0 (Krytyczny)
**Typ**: E2E

**Warunki wstępne**:
- Użytkownik zalogowany
- Brak aktywnego planu treningowego

**Kroki**:

**Sekcja 1: Dane osobowe (PersonalDataSection)**
1. Wprowadź wiek: `30`
2. Wprowadź wagę: `70` kg
3. Wprowadź wzrost: `175` cm
4. Wybierz płeć: `M`
5. Kliknij "Dalej"

**Sekcja 2: Cele treningowe (TrainingGoalsSection)**
6. Wybierz dystans docelowy: `Half Marathon`
7. Wprowadź tygodniowy kilometraż: `30` km
8. Wybierz ilość dni treningowych: `4` dni/tydzień
9. Kliknij "Dalej"

**Sekcja 3: Rekordy życiowe (PersonalRecordsSection)**
10. Dodaj rekord 5K: `00:22:30` (22 min 30 sek)
11. Dodaj rekord 10K: `00:48:00` (48 min)
12. Kliknij "Dalej"

**Sekcja 4: Disclaimer**
13. Zaznacz checkbox: "Rozumiem i akceptuję..."
14. Kliknij "Generuj plan treningowy"

**Oczekiwany rezultat**:
- Loading modal z animacją
- Request do `POST /api/training-plans/generate` zostaje wysłany
- AI generuje 70 workout days
- Plan zostaje zapisany w bazie
- Przekierowanie do `/dashboard`
- Plan widoczny w dashboardzie

**Czas oczekiwany**: 5-15 sekund (AI generation)

---

#### TC-SURVEY-002: Walidacja formularza - puste pola

**Priorytet**: P1 (Wysoki)
**Typ**: Integration

**Warunki wstępne**:
- Użytkownik na stronie `/survey`

**Kroki**:
1. Pozostaw wszystkie pola puste
2. Kliknij "Dalej"

**Oczekiwany rezultat**:
- Formularze nie przechodzą dalej
- Error messages wyświetlane przy pustych polach:
  - "Wiek jest wymagany"
  - "Waga jest wymagana"
  - "Wzrost jest wymagany"
  - "Płeć jest wymagana"

---

#### TC-SURVEY-003: Walidacja formularza - nieprawidłowe wartości

**Priorytet**: P1 (Wysoki)
**Typ**: Integration

**Warunki testowe**:

| Pole | Wartość testowa | Oczekiwany błąd |
|------|----------------|-----------------|
| Wiek | `0` | "Age must be at least 1" |
| Wiek | `150` | "Age must be less than 120" |
| Waga | `0` | "Weight must be greater than 0" |
| Waga | `400` | "Weight must be less than 300kg" |
| Wzrost | `0` | "Height must be greater than 0" |
| Wzrost | `350` | "Height must be less than 300cm" |
| Tygodniowy km | `-10` | "Weekly km must be greater than 0" |
| Dni treningowe | `1` | "Minimum 2 training days per week" |
| Dni treningowe | `8` | "Maximum 7 training days per week" |

**Oczekiwany rezultat**:
- Client-side validation blokuje submit
- Server-side validation (Zod) zwraca 400 Bad Request z details

---

#### TC-SURVEY-004: Dodawanie i usuwanie rekordów życiowych

**Priorytet**: P1 (Wysoki)
**Typ**: E2E

**Kroki**:
1. Nawiguj do sekcji "Rekordy życiowe"
2. Kliknij "Dodaj rekord"
3. Wybierz dystans: `5K`
4. Wprowadź czas: `00:20:00`
5. Kliknij "Zapisz"
6. Dodaj drugi rekord: `10K` - `00:45:00`
7. Usuń pierwszy rekord (5K)
8. Kliknij "Dalej"

**Oczekiwany rezultat**:
- Rekordy dynamicznie dodawane/usuwane w UI
- Validation: minimum 1 rekord wymagany
- Przejście do kolejnej sekcji działa
- Tylko 10K record zostaje wysłany do API

---

#### TC-SURVEY-005: Nadpisanie istniejącego planu (Confirmation Dialog)

**Priorytet**: P0 (Krytyczny)
**Typ**: E2E

**Warunki wstępne**:
- Użytkownik ma aktywny plan treningowy
- Nawiguje do `/survey`

**Kroki**:
1. Wypełnij ankietę
2. Kliknij "Generuj plan treningowy"
3. Dialog "Confirmation" pojawia się z ostrzeżeniem: "Posiadasz już aktywny plan. Wygenerowanie nowego planu spowoduje nadpisanie obecnego..."
4. Kliknij "Anuluj"
5. Weryfikuj, że formularze nie zostały wysłane
6. Ponownie kliknij "Generuj plan treningowy"
7. Kliknij "Potwierdź"

**Oczekiwany rezultat**:
- Po anulowaniu: brak requestu do API
- Po potwierdzeniu:
  - Request do API wysłany
  - Stary plan zostaje zdeaktywowany (`is_active = false`)
  - Nowy plan zostaje utworzony (`is_active = true`)
  - Unique constraint `idx_training_plans_user_active` nie jest naruszony

---

### 4.3. Moduł Generowania Planów (AI Integration)

#### TC-AI-001: Pomyślne wygenerowanie planu przez AI

**Priorytet**: P0 (Krytyczny)
**Typ**: Integration

**Warunki wstępne**:
- OpenRouter API key skonfigurowany
- AI service dostępny

**Kroki**:
1. Wywołaj POST `/api/training-plans/generate` z valid payload:
```json
{
  "profile": {
    "goal_distance": "Marathon",
    "weekly_km": 50,
    "training_days_per_week": 5,
    "age": 35,
    "weight": 75,
    "height": 180,
    "gender": "M"
  },
  "personal_records": [
    {"distance": "10K", "time_seconds": 2700},
    {"distance": "Half Marathon", "time_seconds": 5400}
  ]
}
```

**Oczekiwany rezultat**:
- Status: 201 Created
- Response zawiera:
  - `training_plan` object z `id`, `start_date`, `end_date`, `is_active: true`
  - `workout_days` array (dokładnie 70 elementów)
  - Każdy workout day ma: `day_number`, `date`, `workout_description`, `is_rest_day`, `is_completed`
- Database verification:
  - Profile został upserted
  - Personal records zostały replaced
  - Training plan został created
  - 70 workout days zostały created
  - Stary plan (jeśli był) został zdeaktywowany

**Weryfikacja AI output**:
- Workout descriptions w języku polskim
- Rest days: `workout_description = "Odpoczynek"`, `is_rest_day = true`
- Trenujące dni: detailed descriptions, `is_rest_day = false`
- Day numbers: 1-70 (sequential)

---

#### TC-AI-002: AI service unavailable (503 Error)

**Priorytet**: P0 (Krytyczny)
**Typ**: Integration

**Warunki wstępne**:
- Symulacja OpenRouter API returning 503 Service Unavailable

**Kroki**:
1. Mock OpenRouter response: `503 Service Unavailable`
2. Wywołaj POST `/api/training-plans/generate`

**Oczekiwany rezultat**:
- Status: 503 Service Unavailable
- Response body:
```json
{
  "error": {
    "message": "AI service temporarily unavailable. Please try again later."
  }
}
```
- Database: **NIE POWINNO** dojść do żadnych zmian (no profile upsert, no plan creation)
- Frontend: Error toast z user-friendly message

---

#### TC-AI-003: AI zwraca nieprawidłową strukturę JSON

**Priorytet**: P1 (Wysoki)
**Typ**: Integration

**Warunki wstępne**:
- Mock AI response z invalid structure

**Scenariusze testowe**:

1. **Brak pola `workout_days`**:
   - AI zwraca: `{"plan": "some text"}`
   - Expected: 500 error "Failed to parse AI-generated training plan"

2. **Nieprawidłowa ilość dni** (nie 70):
   - AI zwraca: `{"workout_days": [... 50 elements ...]}`
   - Expected: 500 error "Expected 70 workout days, got 50"

3. **Invalid JSON** (syntax error):
   - AI zwraca: `{"workout_days": [invalid json}`
   - Expected: 500 error "Failed to parse AI-generated training plan"

4. **Brakujące wymagane pola**:
   - AI zwraca workout bez `day_number` lub `workout_description`
   - Expected: 500 error lub validation error

**Oczekiwany rezultat**:
- Błędy obsłużone gracefully
- Database rollback (brak partial state)
- User-friendly error message

---

#### TC-AI-004: OpenRouter rate limiting (429 Error)

**Priorytet**: P1 (Wysoki)
**Typ**: Integration

**Warunki wstępne**:
- Symulacja OpenRouter returning 429 Too Many Requests

**Kroki**:
1. Mock OpenRouter response: `429 Too Many Requests`
2. Wywołaj POST `/api/training-plans/generate`

**Oczekiwany rezultat**:
- Status: 503 Service Unavailable
- Error message: "AI service temporarily unavailable. Please try again later."
- (Optional) Retry logic z exponential backoff

---

### 4.4. Moduł Dashboardu

#### TC-DASH-001: Wyświetlenie aktywnego planu treningowego

**Priorytet**: P0 (Krytyczny)
**Typ**: E2E

**Warunki wstępne**:
- Użytkownik zalogowany
- Aktywny plan treningowy istnieje (70 workout days)

**Kroki**:
1. Nawiguj do `/dashboard`

**Oczekiwany rezultat**:
- PlanHeader wyświetla:
  - Start date i end date planu
  - Progress bar z completion percentage
  - "Wykonano X z Y treningów"
- 10 WeekAccordion komponentów (jeden na tydzień)
- Tydzień zawierający dzisiejszą datę jest automatycznie rozwinięty
- Dzisiejszy trening jest highlighted
- Auto-scroll do dzisiejszego treningu

**Weryfikacja danych**:
- Workout days pogrupowane po 7 na tydzień
- Day numbers: 1-7, 8-14, ..., 64-70
- Rest days wyświetlane z "Odpoczynek" i disabled checkbox

---

#### TC-DASH-002: Oznaczenie treningu jako wykonany (Toggle Completion)

**Priorytet**: P0 (Krytyczny)
**Typ**: E2E + Integration

**Warunki wstępne**:
- Użytkownik na dashboardzie
- Trening ID: `workout-123`, `is_completed: false`, `is_rest_day: false`

**Kroki**:
1. Kliknij checkbox przy treningu `workout-123`

**Oczekiwany rezultat (Optimistic UI)**:
- Checkbox zmienia stan natychmiast (< 50ms)
- Trening card wizualnie oznaczony jako completed (np. opacity, strikethrough)
- Progress bar aktualizuje się natychmiast

**Weryfikacja API call**:
- Request: `PATCH /api/workout-days/workout-123`
- Body: `{"is_completed": true}`
- Response: 200 OK z updated workout day
- Database: `is_completed = true`, `completed_at = NOW()`

**Weryfikacja rollback przy błędzie**:
- Symuluj network error (disconnect)
- Checkbox powinien powrócić do stanu `unchecked`
- Toast error: "Brak połączenia z internetem..."

---

#### TC-DASH-003: Odznaczenie wykonanego treningu

**Priorytet**: P1 (Wysoki)
**Typ**: E2E

**Warunki wstępne**:
- Trening ID: `workout-123`, `is_completed: true`, `completed_at: "2025-01-15T10:00:00Z"`

**Kroki**:
1. Kliknij checkbox (uncheck)

**Oczekiwany rezultat**:
- Checkbox natychmiast unchecked
- API call: `PATCH /api/workout-days/workout-123` z `{"is_completed": false}`
- Database: `is_completed = false`, `completed_at = NULL`
- Progress bar zmniejsza się
- Toast: "Oznaczenie cofnięte"

---

#### TC-DASH-004: Próba oznaczenia rest day jako wykonany

**Priorytet**: P1 (Wysoki)
**Typ**: E2E + Integration

**Warunki wstępne**:
- Trening ID: `workout-rest`, `is_rest_day: true`, `is_completed: false`

**Kroki**:
1. Próbuj kliknąć checkbox przy rest day

**Oczekiwany rezultat (Client-side prevention)**:
- Checkbox jest disabled (nie można kliknąć)
- Tooltip: "Dni odpoczynku nie mogą być oznaczone jako wykonane"

**Weryfikacja server-side**:
- Symuluj API call: `PATCH /api/workout-days/workout-rest` z `{"is_completed": true}`
- Response: 400 Bad Request
- Error: "Rest days cannot be marked as completed"
- Code: "REST_DAY_COMPLETION_NOT_ALLOWED"
- Database constraint `no_completed_rest_days` blokuje operację

---

#### TC-DASH-005: Progress bar i completion statistics

**Priorytet**: P1 (Wysoki)
**Typ**: Integration

**Warunki wstępne**:
- Plan z 70 dniami (50 workout days, 20 rest days)
- 25 treningów wykonanych

**Kroki**:
1. Załaduj dashboard
2. Weryfikuj PlanHeader

**Oczekiwany rezultat**:
- Total workouts: `50`
- Completed workouts: `25`
- Total rest days: `20`
- Completion percentage: `50%` (25/50 * 100)
- Progress bar wypełniony w 50%
- Text: "Wykonano 25 z 50 treningów"

**Edge case**:
- Wszystkie treningi wykonane (50/50):
  - Completion percentage: `100%`
  - `is_plan_completed: true`
  - Congratulations popup (jeśli zaimplementowany)

---

#### TC-DASH-006: Scroll do dzisiejszego treningu (FAB button)

**Priorytet**: P2 (Średni)
**Typ**: E2E

**Warunki wstępne**:
- Plan treningowy obejmuje dzisiejszą datę
- Użytkownik scrolluje dashboard poza viewport dzisiejszego treningu

**Kroki**:
1. Załaduj dashboard
2. Scrolluj w górę lub w dół (poza dzisiejszy trening)
3. Kliknij Floating Action Button (FAB) "Przewiń do dziś"

**Oczekiwany rezultat**:
- Smooth scroll do dzisiejszego treningu
- Dzisiejszy trening highlighted (np. border, background color)
- FAB widoczny tylko gdy dzisiejszy trening poza viewport

---

#### TC-DASH-007: Dashboard bez aktywnego planu

**Priorytet**: P1 (Wysoki)
**Typ**: E2E

**Warunki wstępne**:
- Użytkownik zalogowany
- Brak aktywnego planu (`GET /api/training-plans/active` zwraca null)

**Kroki**:
1. Nawiguj do `/dashboard`

**Oczekiwany rezultat**:
- Empty state message:
  - "Nie masz jeszcze planu treningowego"
  - Button: "Utwórz plan" → redirect do `/survey`
- Brak WeekAccordion components
- Brak PlanHeader

---

### 4.5. Moduł Profilu

#### TC-PROFILE-001: Wyświetlenie danych użytkownika

**Priorytet**: P1 (Wysoki)
**Typ**: E2E

**Warunki wstępne**:
- Użytkownik zalogowany
- Profile i personal records istnieją w bazie

**Kroki**:
1. Nawiguj do `/profile`

**Oczekiwany rezultat**:
- **PersonalDataCard** wyświetla:
  - Wiek: `30 lat`
  - Waga: `70 kg`
  - Wzrost: `175 cm`
  - Płeć: `Mężczyzna` (formatowanie M → Mężczyzna, F → Kobieta)

- **TrainingGoalsCard** wyświetla:
  - Cel: `Półmaraton`
  - Tygodniowy kilometraż: `30 km`
  - Dni treningowe: `4 dni/tydzień`

- **PersonalRecordsCard** wyświetla:
  - Lista rekordów (5K: 22:30, 10K: 48:00)
  - Formatowanie czasu: MM:SS

- **ActionsCard** wyświetla:
  - Button: "Wygeneruj nowy plan" → redirect do `/survey`
  - (Optional) Button: "Usuń konto"

**Weryfikacja read-only**:
- Brak możliwości edycji danych inline
- Brak input fields, tylko display

---

#### TC-PROFILE-002: Profile bez danych (nowy użytkownik)

**Priorytet**: P2 (Średni)
**Typ**: E2E

**Warunki wstępne**:
- Nowy użytkownik (signup + login)
- Brak profile i personal records

**Kroki**:
1. Nawiguj do `/profile`

**Oczekiwany rezultat**:
- Empty state:
  - "Uzupełnij ankietę, aby zobaczyć swój profil"
  - Button: "Wypełnij ankietę" → redirect do `/survey`

---

### 4.6. Row Level Security (RLS) Tests

#### TC-RLS-001: Użytkownik nie może odczytać danych innego użytkownika

**Priorytet**: P0 (Krytyczny)
**Typ**: Security

**Warunki wstępne**:
- User A (ID: `user-a-uuid`) z aktywnym planem
- User B (ID: `user-b-uuid`) zalogowany

**Kroki**:
1. Zaloguj się jako User B
2. Próbuj wywołać `GET /api/training-plans/active` (which queries training_plans for User B)
3. Manualnie spróbuj odczytać dane User A poprzez direct Supabase query:
```sql
SELECT * FROM training_plans WHERE user_id = 'user-a-uuid';
```

**Oczekiwany rezultat**:
- API endpoint zwraca tylko dane User B
- Direct query zwraca 0 rows (RLS policy blocks)
- Brak możliwości odczytu danych User A

---

#### TC-RLS-002: Użytkownik nie może zmodyfikować workout days innego użytkownika

**Priorytet**: P0 (Krytyczny)
**Typ**: Security

**Warunki wstępne**:
- User A ma workout day ID: `workout-a-uuid`
- User B zalogowany

**Kroki**:
1. Zaloguj się jako User B
2. Wywołaj `PATCH /api/workout-days/workout-a-uuid` z `{"is_completed": true}`

**Oczekiwany rezultat**:
- Response: 404 Not Found (nie 403, dla security reasons)
- Error message: "Workout day not found"
- Code: "WORKOUT_DAY_NOT_FOUND"
- Database: 0 rows updated (RLS blocks UPDATE)

---

#### TC-RLS-003: Anonymous user nie może dostać się do żadnych danych

**Priorytet**: P0 (Krytyczny)
**Typ**: Security

**Warunki wstępne**:
- Brak sesji (użytkownik niezalogowany)

**Kroki**:
1. Wywołaj API endpoints bez tokena:
   - `GET /api/training-plans/active`
   - `GET /api/profile`
   - `PATCH /api/workout-days/[id]`

**Oczekiwany rezultat**:
- Wszystkie endpoints zwracają 401 Unauthorized
- RLS policies dla `anon` role deny all operations

---

#### TC-RLS-004: Weryfikacja RLS dla wszystkich tabel

**Priorytet**: P0 (Krytyczny)
**Typ**: Security

**Tabele do przetestowania**: `profiles`, `personal_records`, `training_plans`, `workout_days`

**Operacje do przetestowania dla każdej tabeli**:

| Operacja | Policy | Expected behavior |
|----------|--------|-------------------|
| SELECT | "Users can view own X" | Only user's own data returned |
| INSERT | "Users can insert own X" | Only if user_id = auth.uid() |
| UPDATE | "Users can update own X" | Only user's own data updated |
| DELETE | "Users can delete own X" | Only user's own data deleted |
| ALL (anon) | "Anon users have no access" | All operations denied for anon |

**Test methodology**:
1. Create test users: User A, User B
2. User A creates data
3. User B attempts to access User A's data
4. Verify RLS blocks all unauthorized operations

---

### 4.7. Database Constraints Tests

#### TC-DB-001: Unique constraint - tylko jeden aktywny plan na użytkownika

**Priorytet**: P0 (Krytyczny)
**Typ**: Integration

**Warunki wstępne**:
- User ma aktywny plan (is_active = true)

**Kroki**:
1. Próbuj INSERT nowego planu z `is_active = true` dla tego samego użytkownika

**Oczekiwany rezultat**:
- Database zwraca unique constraint violation error
- Constraint: `idx_training_plans_user_active`
- Error code: 23505 (PostgreSQL unique violation)

**Weryfikacja przez aplikację**:
- Aplikacja najpierw deaktywuje stary plan (`UPDATE is_active = false`)
- Następnie tworzy nowy plan
- Constraint nie jest naruszony

---

#### TC-DB-002: CHECK constraint - rest days nie mogą być completed

**Priorytet**: P0 (Krytyczny)
**Typ**: Integration

**Warunki wstępne**:
- Workout day z `is_rest_day = true`

**Kroki**:
1. Direct database UPDATE:
```sql
UPDATE workout_days
SET is_completed = true
WHERE id = 'rest-day-uuid';
```

**Oczekiwany rezultat**:
- Database zwraca CHECK constraint violation
- Constraint: `no_completed_rest_days`
- Error code: 23514 (PostgreSQL check violation)
- 0 rows updated

**Weryfikacja przez API**:
- `PATCH /api/workout-days/[id]` zwraca 400 Bad Request
- Error message: "Rest days cannot be marked as completed"

---

#### TC-DB-003: Foreign key cascade delete

**Priorytet**: P1 (Wysoki)
**Typ**: Integration

**Warunki wstępne**:
- User A ma training plan
- Training plan ma 70 workout days

**Kroki**:
1. DELETE training plan:
```sql
DELETE FROM training_plans WHERE id = 'plan-uuid';
```

**Oczekiwany rezultat**:
- Training plan usunięty
- Wszystkie 70 workout days automatycznie usunięte (CASCADE)
- Foreign key constraint: `training_plan_id` references `training_plans(id) ON DELETE CASCADE`

---

#### TC-DB-004: CHECK constraints - value ranges

**Priorytet**: P1 (Wysoki)
**Typ**: Integration

**Constraints do przetestowania**:

| Tabela | Kolumna | Constraint | Invalid value | Expected error |
|--------|---------|------------|---------------|----------------|
| profiles | age | `age > 0 and age < 120` | `0` | Violation |
| profiles | age | `age > 0 and age < 120` | `150` | Violation |
| profiles | weight | `weight > 0 and weight < 300` | `-5` | Violation |
| profiles | height | `height > 0 and height < 300` | `400` | Violation |
| profiles | training_days_per_week | `between 2 and 7` | `1` | Violation |
| profiles | training_days_per_week | `between 2 and 7` | `8` | Violation |
| workout_days | day_number | `between 1 and 70` | `0` | Violation |
| workout_days | day_number | `between 1 and 70` | `71` | Violation |
| personal_records | time_seconds | `time_seconds > 0` | `-100` | Violation |

**Test methodology**:
- Direct INSERT/UPDATE z invalid values
- Verify database rejects with constraint violation
- Verify application-level Zod validation catches errors before DB

---

## 5. Środowisko Testowe

### 5.1. Środowiska

#### Development (Local)
- **URL**: `http://localhost:3000`
- **Node.js**: 22.14.0 (nvm)
- **Database**: Supabase Local (Docker) lub Supabase Cloud (dev project)
- **AI Service**: OpenRouter API (test API key z rate limiting)
- **Auth**: SKIP_AUTH=true dla testów bez autentykacji

#### Staging
- **URL**: `https://staging.athletica.app`
- **Hosting**: DigitalOcean (Docker deployment)
- **Database**: Supabase Cloud (staging project)
- **AI Service**: OpenRouter API (separate API key)
- **Auth**: Supabase Auth (staging configuration)

#### Production
- **URL**: `https://athletica.app`
- **Hosting**: DigitalOcean (Docker deployment)
- **Database**: Supabase Cloud (production project)
- **AI Service**: OpenRouter API (production API key with spending limits)
- **Auth**: Supabase Auth (production configuration)

### 5.2. Konfiguracja środowiska testowego

#### Environment Variables (.env)

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxx...

# Development Mode (bypass auth)
SKIP_AUTH=true  # tylko dla testów lokalnych!

# Node Environment
NODE_ENV=development
```

#### Database Setup (Supabase Local)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase instance
supabase start

# Run migrations
supabase db reset

# Seed test data (optional)
supabase db seed
```

#### Test Data Seeding

Przygotować seed scripts dla:
- **Test users**: 5 użytkowników z różnymi rolami
- **Profiles**: Complete profiles dla każdego użytkownika
- **Training plans**: 2 aktywne plany, 3 historyczne
- **Workout days**: Różne stany completion (0%, 50%, 100%)

---

## 6. Narzędzia do Testowania

### 6.1. Automatyzacja testów

#### Unit & Integration Tests
- **Vitest**: Test runner dla unit i integration tests
- **React Testing Library**: Testowanie React components
- **Supertest**: Testowanie API endpoints
- **MSW (Mock Service Worker)**: Mockowanie API calls (OpenRouter)

#### E2E Tests
- **Playwright**: Cross-browser E2E testing
  - Browsers: Chromium, Firefox, WebKit
  - Mobile emulation: iPhone, iPad, Android
  - Parallel execution
  - Screenshots i videos on failure

#### Performance Testing
- **Lighthouse CI**: Automated performance audits
- **WebPageTest**: Real-world performance testing
- **k6**: Load testing dla API endpoints

#### Security Testing
- **OWASP ZAP**: Vulnerability scanning
- **Supabase CLI**: RLS policy testing
- **npm audit**: Dependency vulnerability scanning

### 6.2. Monitoring i raportowanie

#### Test Reporting
- **Vitest UI**: Interactive test results
- **Playwright HTML Reporter**: E2E test reports z screenshots
- **Allure**: Agregowane raporty testów

#### CI/CD Integration
- **GitHub Actions**: Automated test execution
  - Trigger: Pull request, push to main
  - Jobs: Unit tests, Integration tests, E2E tests, Lint
  - Artifacts: Test reports, screenshots, videos

#### Error Tracking (Production)
- **Sentry**: Frontend i backend error tracking
- **Supabase Logs**: Database query logs
- **Pino**: Structured logging (Node.js)

### 6.3. Accessibility Testing
- **axe DevTools**: Browser extension dla accessibility audits
- **Lighthouse Accessibility**: Automated a11y scoring
- **NVDA / VoiceOver**: Manual screen reader testing

---

## 7. Harmonogram Testów

### 7.1. Fazy testowania

#### Faza 1: Unit & Integration Tests (Tydzień 1-2)
- **Czas trwania**: 10 dni roboczych
- **Zakres**:
  - Implementacja unit tests dla services, utils, hooks
  - Implementacja integration tests dla API endpoints
  - Code coverage target: 80%
- **Odpowiedzialność**: Backend Developer, Frontend Developer
- **Deliverables**: Test suite z passing tests, coverage report

#### Faza 2: E2E Tests (Tydzień 3)
- **Czas trwania**: 5 dni roboczych
- **Zakres**:
  - Implementacja Playwright E2E tests
  - Kluczowe user flows (signup → survey → dashboard)
  - Cross-browser testing
- **Odpowiedzialność**: QA Engineer, Frontend Developer
- **Deliverables**: E2E test suite, browser compatibility matrix

#### Faza 3: Security & RLS Testing (Tydzień 4)
- **Czas trwania**: 5 dni roboczych
- **Zakres**:
  - RLS policy verification
  - Penetration testing (OWASP Top 10)
  - Input validation testing
- **Odpowiedzialność**: Backend Developer, Security Specialist
- **Deliverables**: Security audit report, RLS test results

#### Faza 4: Performance Testing (Tydzień 4-5)
- **Czas trwania**: 3 dni robocze
- **Zakres**:
  - Lighthouse audits
  - API load testing (k6)
  - SSR rendering performance
- **Odpowiedzialność**: Full Stack Developer, DevOps
- **Deliverables**: Performance report, bottleneck analysis

#### Faza 5: Accessibility & Responsive Testing (Tydzień 5)
- **Czas trwania**: 3 dni robocze
- **Zakres**:
  - WCAG 2.1 AA compliance
  - Screen reader testing
  - Mobile/tablet testing
- **Odpowiedzialność**: Frontend Developer, UX Designer
- **Deliverables**: A11y audit report, responsive testing matrix

#### Faza 6: Regression Testing (Tydzień 6)
- **Czas trwania**: 3 dni robocze
- **Zakres**:
  - Re-run all automated tests
  - Manual exploratory testing
  - Bug bash session
- **Odpowiedzialność**: Całość zespołu
- **Deliverables**: Final test report, bug list

#### Faza 7: UAT (User Acceptance Testing) (Tydzień 7)
- **Czas trwania**: 5 dni roboczych
- **Zakres**:
  - Beta testing z 10-20 użytkownikami
  - Zbieranie feedbacku
  - Minor bug fixes
- **Odpowiedzialność**: Product Owner, QA
- **Deliverables**: UAT sign-off, production readiness checklist

### 7.2. Harmonogram CI/CD

```yaml
# GitHub Actions Workflow

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 22.14.0
      - Install dependencies
      - Run unit tests (Vitest)
      - Upload coverage report

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - Checkout code
      - Setup Node.js
      - Start Supabase local
      - Run integration tests
      - Upload test results

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - Checkout code
      - Setup Node.js
      - Install Playwright
      - Run E2E tests (${{ matrix.browser }})
      - Upload screenshots/videos on failure

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run npm audit
      - Run OWASP ZAP scan
      - Upload security report

  performance-test:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - Checkout code
      - Build production bundle
      - Run Lighthouse CI
      - Upload performance report
```

---

## 8. Kryteria Akceptacji Testów

### 8.1. Exit Criteria - Testy mogą być zakończone gdy:

#### Kryteria ilościowe:
- ✅ **Test Pass Rate**: ≥ 98% (wszystkie typy testów)
- ✅ **Code Coverage**: ≥ 80% dla services/utils, ≥ 70% dla components
- ✅ **E2E Test Coverage**: 100% kluczowych user flows
- ✅ **Performance**: 100% Lighthouse scores ≥ 90 (Performance, Accessibility, Best Practices, SEO)

#### Kryteria jakościowe:
- ✅ **Zero Critical Bugs**: Brak błędów Critical lub Blocker
- ✅ **High Priority Bugs**: ≤ 3 High priority bugs (z planem naprawy)
- ✅ **Security**: Zero luk bezpieczeństwa High/Critical (OWASP ZAP)
- ✅ **RLS**: 100% RLS policies przetestowane i działające poprawnie
- ✅ **Accessibility**: WCAG 2.1 AA compliance (≥ 95%)

#### Dokumentacja:
- ✅ Test reports wygenerowane i przejrzane
- ✅ Bug tracking system zaktualizowany
- ✅ Regression test suite kompletny
- ✅ Production readiness checklist signed-off

### 8.2. Success Metrics

#### Funkcjonalność:
- **Auth Success Rate**: 100% (signup, login, password reset)
- **Plan Generation Success Rate**: ≥ 95% (excluding AI service outages)
- **Workout Toggle Success Rate**: 100%

#### Wydajność:
- **API Response Time (p95)**: < 2s (excluding AI generation)
- **AI Generation Time (p95)**: < 15s
- **Page Load Time (p95)**: < 2s
- **First Contentful Paint**: < 1.5s

#### Bezpieczeństwo:
- **RLS Policy Pass Rate**: 100% (zero data leaks)
- **Input Validation Pass Rate**: 100% (zero SQL injection / XSS)
- **Auth Bypass Attempts**: 0 successful

#### Dostępność:
- **Keyboard Navigation**: 100% accessible
- **Screen Reader Compatibility**: 100% critical flows navigable
- **Color Contrast**: 100% WCAG AA compliant

---

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1. Zespół testowy

#### QA Lead / Test Manager
**Odpowiedzialność**:
- Planowanie strategii testowej
- Koordynacja działań zespołu testowego
- Review test plans i test cases
- Raportowanie postępów do Product Ownera
- Zarządzanie bug tracking procesem
- Sign-off na production readiness

**Deliverables**:
- Test Plan (ten dokument)
- Test Status Reports (weekly)
- Final Test Summary Report

---

#### QA Engineers (2 osoby)
**Odpowiedzialność**:
- Implementacja automated tests (E2E, Integration)
- Wykonywanie manual exploratory testing
- Testowanie regresji
- Bug reporting i verification
- Testowanie accessibility i responsive design
- Koordynacja UAT z użytkownikami

**Deliverables**:
- Test cases w Jira/TestRail
- Automated test scripts (Playwright)
- Bug reports
- Test execution reports

---

#### Backend Developer
**Odpowiedzialność**:
- Unit tests dla services (`ai.service.ts`, `training-plan.service.ts`)
- Integration tests dla API endpoints
- Database schema testing (migrations, constraints)
- RLS policy implementation i testing
- Performance optimization (API response times)

**Deliverables**:
- Unit test suite (Vitest)
- API integration tests (Supertest)
- RLS test scripts
- Performance benchmarks

---

#### Frontend Developer
**Odpowiedzialność**:
- Unit tests dla React components
- Unit tests dla custom hooks (useOptimisticWorkouts, etc.)
- Integration tests dla user flows
- Responsive design testing
- Accessibility implementation i testing (ARIA attributes)
- Browser compatibility testing

**Deliverables**:
- Component tests (React Testing Library)
- Hook tests (Vitest)
- Accessibility audit results
- Responsive testing matrix

---

#### DevOps Engineer
**Odpowiedzialność**:
- CI/CD pipeline setup (GitHub Actions)
- Test environment provisioning (Staging, UAT)
- Database migrations w test environments
- Performance testing infrastructure (k6 setup)
- Monitoring i logging setup (Sentry, Supabase Logs)

**Deliverables**:
- CI/CD workflows (.github/workflows)
- Staging environment
- Performance test scripts (k6)
- Monitoring dashboards

---

#### Product Owner
**Odpowiedzialność**:
- Definicja acceptance criteria
- Priorytetyzacja bug fixes
- UAT coordination
- Final sign-off na production deployment
- Stakeholder communication

**Deliverables**:
- User stories z acceptance criteria
- UAT test scenarios
- Production deployment approval

---

### 9.2. Struktura komunikacji

#### Daily Standups (15 min)
- **Uczestnicy**: Cały zespół
- **Agenda**:
  - Co zrobiono wczoraj (testing progress)
  - Co robimy dziś
  - Blockers i dependencies

#### Test Status Meetings (30 min, 2x tydzień)
- **Uczestnicy**: QA Lead, QA Engineers, Developers
- **Agenda**:
  - Test execution status (pass/fail rates)
  - Bug review (new, open, resolved)
  - Risk assessment
  - Adjustments do test plan

#### Bug Triage Meetings (45 min, weekly)
- **Uczestnicy**: Cały zespół
- **Agenda**:
  - Review new bugs
  - Assign severity/priority
  - Assign owners
  - Schedule fixes

---

## 10. Procedury Raportowania Błędów

### 10.1. Bug Report Template (Jira)

#### Obowiązkowe pola:

**Summary**: Krótki, opisowy tytuł (max 80 znaków)
- ✅ Dobry: "Login fails with 500 error when email contains special characters"
- ❌ Zły: "Login broken"

**Description**: Szczegółowy opis problemu
```markdown
## Opis
Użytkownik nie może się zalogować gdy email zawiera znak "+" (np. test+alias@example.com).
API zwraca 500 Internal Server Error.

## Environment
- URL: https://staging.athletica.app/auth/login
- Browser: Chrome 120.0.6099.109
- OS: macOS 14.2
- User: test+bug@example.com

## Kroki reprodukcji
1. Nawiguj do /auth/login
2. Wprowadź email: test+alias@example.com
3. Wprowadź hasło: Test1234!
4. Kliknij "Zaloguj się"

## Oczekiwany rezultat
Użytkownik zostaje zalogowany i przekierowany do /dashboard

## Aktualny rezultat
- Error toast: "Internal server error"
- Console error: "POST /api/auth/login 500"
- User pozostaje na stronie logowania

## Dodatkowe informacje
- Network tab screenshot: [załącznik]
- Console logs: [załącznik]
- Podobny issue: ATHS-123
```

**Severity** (wybierz jedną):
- **Critical**: System crash, data loss, security breach
- **High**: Major functionality broken, no workaround
- **Medium**: Functionality broken, workaround exists
- **Low**: Minor issue, cosmetic, edge case

**Priority** (wybierz jedną):
- **P0**: Blocker - must fix before deployment
- **P1**: High - fix in current sprint
- **P2**: Medium - fix in next sprint
- **P3**: Low - backlog

**Component**: (wybierz z listy)
- Auth
- Survey
- Dashboard
- Profile
- API
- Database
- Performance
- Security
- Accessibility

**Attachments**:
- Screenshots (required dla UI bugs)
- Console logs
- Network tab HAR file
- Video recording (dla complex interactions)

### 10.2. Bug Lifecycle

```
[New]
  ↓
[Triaged] → Assigned severity, priority, owner
  ↓
[In Progress] → Developer working on fix
  ↓
[Ready for Testing] → Fix deployed to test environment
  ↓
[Verified] → QA confirms fix works
  ↓
[Closed] → Bug resolved

Alternative paths:
- [Duplicate] → Link to original bug
- [Won't Fix] → Explain reason
- [Cannot Reproduce] → Request more info or close
```

### 10.3. Bug Triage Criteria

#### Severity Assignment Guidelines:

**Critical**:
- Authentication nie działa (100% users affected)
- Data loss lub corruption
- Security vulnerability (RLS bypass, XSS, SQL injection)
- Payment processing broken (if applicable)

**High**:
- Kluczowa funkcjonalność nie działa (plan generation fails)
- Significant UX degradation
- Performance degradation > 50%
- Accessibility blocker (WCAG AA violation)

**Medium**:
- Funkcjonalność działa ale z błędami
- Minor UX issues
- Performance degradation 20-50%
- Workaround exists but inconvenient

**Low**:
- Cosmetic issues (text alignment, colors)
- Edge cases affecting < 5% users
- Minor performance degradation < 20%
- Enhancement requests

---

### 10.4. Bug Reporting Guidelines

#### Dla QA:
1. **Reproduce consistently** przed reportowaniem
2. **Sprawdź duplicates** w Jira
3. **Attach evidence**: screenshots, logs, videos
4. **Minimize steps**: Najkrótsze możliwe kroki reprodukcji
5. **Test na clean state**: Clear cache, fresh login
6. **Include version info**: Environment, browser, build number

#### Dla Developers:
1. **Root cause analysis** w komentarzach
2. **Link related code** (GitHub commit, PR)
3. **Add fix verification steps** dla QA
4. **Update status promptly**
5. **Comment on blockers** immediately

---

## 11. Ryzyka i Mitygacje

### 11.1. Ryzyka testowe

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| **OpenRouter AI unavailable podczas testów** | Średnie | Wysoki | Mock AI responses w testach, retry logic, fallback test data |
| **RLS policies incorrectly configured** | Niskie | Krytyczny | Automated RLS tests, peer review, security audit |
| **Test data corruption** | Niskie | Średni | Database snapshots, seed scripts, separate test DB |
| **Browser compatibility issues** | Średnie | Średni | Playwright multi-browser testing, BrowserStack |
| **Performance regression** | Średnie | Wysoki | Lighthouse CI, performance budgets, k6 load tests |
| **Insufficient test coverage** | Średnie | Wysoki | Code coverage thresholds (80%), mandatory PR checks |
| **Late discovery of critical bugs** | Niskie | Krytyczny | Early integration testing, daily test runs, shift-left approach |
| **Test environment instability** | Średnie | Średni | Infrastructure as Code, automated provisioning, health checks |
| **Accessibility violations** | Średnie | Średni | Automated a11y testing (axe), manual screen reader testing |
| **Dependency vulnerabilities** | Średnie | Wysoki | npm audit w CI/CD, Dependabot alerts, regular updates |

### 11.2. Strategia mitygacji

#### Risk Mitigation Plan:

1. **AI Service Dependency**:
   - Implement MSW (Mock Service Worker) dla AI responses
   - Create test fixtures z realistic AI outputs
   - Monitor OpenRouter status page
   - Implement circuit breaker pattern

2. **Security Testing**:
   - Penetration testing przez external security firm (jeśli budget)
   - Automated OWASP ZAP scans w CI/CD
   - Code review checklist z security focus
   - Regular security training dla zespołu

3. **Performance**:
   - Establish performance budgets (bundle size, API times)
   - Performance regression alerts w CI/CD
   - CDN dla static assets
   - Database query optimization (indexes)

4. **Test Data Management**:
   - Automated seed scripts
   - Database snapshots before destructive tests
   - Separate Supabase projects: dev, staging, prod
   - Data anonymization dla production data w testach

5. **Browser Compatibility**:
   - Playwright matrix testing (Chrome, Firefox, Safari, Edge)
   - BrowserStack dla real device testing
   - Polyfills dla older browser support (jeśli needed)

---

## 12. Dokumentacja i Artefakty

### 12.1. Dokumentacja testowa

Następujące dokumenty będą tworzone i utrzymywane:

1. **Test Plan** (ten dokument)
   - Format: Markdown
   - Lokalizacja: `.ai/athletica-test-plan.md`
   - Wersjonowanie: Git
   - Odpowiedzialność: QA Lead

2. **Test Cases**
   - Format: Jira / TestRail
   - Linkowanie do user stories
   - Odpowiedzialność: QA Engineers

3. **Test Data Specifications**
   - Format: JSON / SQL seed scripts
   - Lokalizacja: `tests/fixtures/`
   - Odpowiedzialność: Backend Developer

4. **Test Results Reports**
   - Format: HTML (Playwright), JSON (Vitest)
   - Lokalizacja: `test-results/` (gitignored, CI artifacts)
   - Automatyczne generowanie przez test runners

5. **Bug Reports**
   - Format: Jira tickets
   - Template: Zobacz sekcja 10.1
   - Odpowiedzialność: Cały zespół

6. **Performance Benchmarks**
   - Format: Lighthouse JSON, k6 JSON
   - Lokalizacja: `benchmarks/`
   - Wersjonowanie dla regression tracking

7. **Security Audit Report**
   - Format: PDF
   - Zawiera: OWASP ZAP results, RLS test results, penetration test findings
   - Odpowiedzialność: Security Specialist / Backend Developer

### 12.2. Test Artifacts

#### Generowane automatycznie:

- **Coverage Reports**: `coverage/` (HTML, LCOV)
- **E2E Screenshots**: `test-results/screenshots/`
- **E2E Videos**: `test-results/videos/`
- **Lighthouse Reports**: `lighthouse-reports/`
- **Performance Traces**: `traces/` (Playwright traces)

#### Zachowane w Git:

- Test scripts (Vitest, Playwright)
- Mock data (MSW handlers)
- Seed scripts (`supabase/seed.sql`)
- CI/CD workflows (`.github/workflows/`)

#### Archiwizowane (Cloud Storage):

- UAT session recordings
- Production deployment checklists
- Historical performance benchmarks

---

## 13. Podsumowanie

### 13.1. Kluczowe punkty

Plan testów dla projektu **Athletica** obejmuje kompleksowe podejście do zapewnienia jakości aplikacji webowej, z naciskiem na:

1. **Bezpieczeństwo**: RLS policies, input validation, authorization testing
2. **Funkcjonalność**: Pełne pokrycie kluczowych user flows (auth, survey, plan generation, dashboard)
3. **Wydajność**: Lighthouse audits, API load testing, optimistic UI performance
4. **Dostępność**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support
5. **Responsywność**: Mobile-first approach, cross-device testing

### 13.2. Priorytety testowe

**P0 (Must Have przed production)**:
- Autentykacja i autoryzacja
- Generowanie planów AI
- RLS policies verification
- Workout completion toggle
- Critical user flows (signup → survey → dashboard)

**P1 (Should Have przed production)**:
- Password reset flow
- Survey validation
- Performance benchmarks
- Accessibility compliance
- Cross-browser compatibility

**P2 (Nice to Have)**:
- Advanced performance optimization
- Edge case handling
- Comprehensive exploratory testing

### 13.3. Success Criteria Recap

Projekt jest gotowy do production deployment gdy:

✅ **Funkcjonalność**: 100% P0 tests passed, 95% P1 tests passed
✅ **Bezpieczeństwo**: Zero Critical/High vulnerabilities, 100% RLS tests passed
✅ **Wydajność**: Lighthouse scores ≥ 90, API p95 < 2s
✅ **Dostępność**: WCAG 2.1 AA compliance ≥ 95%
✅ **Stabilność**: Zero Critical bugs, ≤ 3 High bugs with mitigation plan

### 13.4. Następne kroki

1. **Week 1-2**: Implementacja unit i integration tests
2. **Week 3**: E2E test suite development
3. **Week 4**: Security i performance testing
4. **Week 5**: Accessibility i responsive testing
5. **Week 6**: Regression testing i bug fixes
6. **Week 7**: UAT i final sign-off
7. **Week 8**: Production deployment

---

**Document Version**: 1.0
**Last Updated**: 2025-01-16
**Author**: QA Team - Athletica Project
**Status**: Draft → Pending Approval → Approved

---

## Appendix A: Glossary

- **RLS**: Row Level Security - mechanizm bezpieczeństwa w PostgreSQL/Supabase
- **SSR**: Server-Side Rendering - renderowanie stron po stronie serwera (Astro)
- **Optimistic UI**: Wzorzec UI aktualizujący się natychmiast przed potwierdzeniem API
- **MVP**: Minimum Viable Product - minimalna wersja produktu
- **E2E**: End-to-End - testy symulujące pełne ścieżki użytkownika
- **UAT**: User Acceptance Testing - testy akceptacyjne z użytkownikami
- **WCAG**: Web Content Accessibility Guidelines - wytyczne dostępności
- **AI Service**: OpenRouter API wykorzystujące Claude 3.5 Haiku
- **Workout Day**: Pojedynczy dzień w 70-dniowym planie treningowym
- **Rest Day**: Dzień odpoczynku (nie może być oznaczony jako completed)

## Appendix B: Test Data Examples

### Example Profile Data
```json
{
  "goal_distance": "Half Marathon",
  "weekly_km": 35.5,
  "training_days_per_week": 4,
  "age": 32,
  "weight": 68.5,
  "height": 172,
  "gender": "F"
}
```

### Example Personal Records
```json
[
  {"distance": "5K", "time_seconds": 1350},
  {"distance": "10K", "time_seconds": 2880},
  {"distance": "Half Marathon", "time_seconds": 6300}
]
```

### Example Workout Day
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "training_plan_id": "660e8400-e29b-41d4-a716-446655440111",
  "day_number": 15,
  "date": "2025-01-30",
  "workout_description": "Bieg długi 16 km w tempie rozmowy (5:45-6:00/km)",
  "is_rest_day": false,
  "is_completed": false,
  "completed_at": null
}
```

---

**End of Test Plan**
