# Architektura UI dla Athletica MVP

## 1. Przegląd struktury UI

Athletica to aplikacja webowa do generowania spersonalizowanych 10-tygodniowych planów treningowych dla biegaczy. Architektura UI została zaprojektowana z myślą o prostocie, intuicyjności i skupieniu na kluczowych funkcjonalnościach MVP. Aplikacja wykorzystuje hybrydowe podejście Astro + React, gdzie statyczne elementy są renderowane przez Astro (SSR), a interaktywne komponenty obsługiwane są przez React.

### Kluczowe zasady architektury:

1. **Web-first approach** - interfejs projektowany najpierw dla desktop/tablet
2. **Hybrid rendering** - SSR (Astro) dla początkowego ładowania + React dla interaktywności
3. **Optimistic UI** - natychmiastowa informacja zwrotna dla użytkownika
4. **Single theme** - tylko jasny motyw w MVP
5. **Minimal navigation** - skupienie na kluczowych ścieżkach użytkownika
6. **Progressive disclosure** - informacje wyświetlane stopniowo (accordion dla tygodni)

### Struktura aplikacji:

- **Publiczne widoki**: Landing page, strony autoryzacji
- **Chronione widoki**: Dashboard, Ankieta, Profil
- **Nawigacja**: Top navbar (desktop/tablet) + Bottom navigation bar (mobile)
- **Layout system**: 3 główne layouty (Public, Auth, Dashboard)

---

## 2. Lista widoków

### 2.1. Landing Page (/)

**Główny cel:** Przyciągnięcie nowych użytkowników i przedstawienie wartości aplikacji

**Kluczowe informacje do wyświetlenia:**
- Nazwa aplikacji i krótki opis (value proposition)
- Główne korzyści (cele, AI, trening)
- Call-to-action: „Zacznij za darmo"

**Kluczowe komponenty widoku:**
- Hero section z głównym CTA
- 3 ikony przedstawiające kluczowe funkcje:
  - 🎯 Spersonalizowane cele
  - 🤖 AI-powered generation
  - 📊 Śledzenie postępów
- Button: „Zacznij za darmo" → /auth/signup

**UX, dostępność i bezpieczeństwo:**
- Single-page layout (bez scrollowania)
- Automatyczne przekierowanie zalogowanych użytkowników do /dashboard
- Semantyczny HTML (header, main, section)
- Wysokie kontrasty dla czytelności
- Focus-visible states dla nawigacji klawiaturowej
- Alt text dla ikon

**Względy techniczne:**
- Statyczny Astro component
- Middleware sprawdza status auth → przekierowanie jeśli zalogowany
- Meta tags dla SEO (title, description)

---

### 2.2. Login Page (/auth/login)

**Główny cel:** Umożliwienie zalogowanym użytkownikom dostępu do konta

**Kluczowe informacje do wyświetlenia:**
- Formularz logowania (email, hasło)
- Link do resetowania hasła
- Link do rejestracji

**Kluczowe komponenty widoku:**
- AuthForm component (React)
  - Input: Email (type="email", required, walidacja formatu)
  - Input: Hasło (type="password", required, min 8 znaków)
  - Button: „Zaloguj się" (loading state podczas requestu)
  - Link: „Zapomniałem hasła" → /auth/reset-password
  - Link: „Nie masz konta? Zarejestruj się" → /auth/signup
- Inline error messages (czerwony tekst pod inputami)
- Toast notifications dla błędów API

**UX, dostępność i bezpieczeństwo:**
- Real-time validation (po blur lub submit)
- Clear error messages (user-friendly)
- Password visibility toggle (opcjonalnie)
- HTTPS only (produkcja)
- Rate limiting na poziomie Supabase
- Semantic form structure (label + input)
- Aria-invalid dla błędnych pól
- Aria-describedby dla komunikatów błędów
- Focus management (pierwszy error field)

**Flow po zalogowaniu:**
1. Supabase Auth SDK: `signInWithPassword()`
2. Sprawdzenie czy użytkownik ma profil (GET /api/profile)
3. Przekierowanie:
   - Brak profilu → /survey
   - Profil istnieje → /dashboard

**Względy techniczne:**
- AuthLayout.astro (centered form container)
- React Hook Form + Zod validation
- Supabase client-side auth
- Session storage dla JWT token

---

### 2.3. Signup Page (/auth/signup)

**Główny cel:** Umożliwienie nowym użytkownikom założenia konta

**Kluczowe informacje do wyświetlenia:**
- Formularz rejestracji (email, hasło, potwierdzenie hasła)
- Link do logowania dla istniejących użytkowników

**Kluczowe komponenty widoku:**
- AuthForm component (React) - variant: signup
  - Input: Email (type="email", required, walidacja formatu)
  - Input: Hasło (type="password", required, min 8 znaków)
  - Input: Powtórz hasło (type="password", required, musi być identyczne)
  - Button: „Zarejestruj się" (loading state)
  - Link: „Masz już konto? Zaloguj się" → /auth/login
- Inline error messages
- Toast notification dla sukcesu/błędu

**UX, dostępność i bezpieczeństwo:**
- Real-time password match validation
- Clear error messages
- Email uniqueness check (backend)
- Password hashing (Supabase handles)
- ARIA labels dla wszystkich inputów
- Focus management
- Semantic form structure

**Flow po rejestracji:**
1. Supabase Auth SDK: `signUp()`
2. Automatyczne logowanie
3. Przekierowanie → /survey

**Względy techniczne:**
- Ten sam AuthForm component co login (props dla variant)
- React Hook Form + Zod validation
- Walidacja: hasła muszą być identyczne
- Supabase client-side auth

---

### 2.4. Reset Password Page (/auth/reset-password)

**Główny cel:** Umożliwienie resetowania zapomnianego hasła

**Kluczowe informacje do wyświetlenia:**
- Formularz z polem email
- Informacja o wysłaniu linku resetującego
- Link powrotny do logowania

**Kluczowe komponenty widoku:**
- AuthForm component (React) - variant: reset
  - Input: Email (type="email", required)
  - Button: „Wyślij link resetujący" (loading state)
  - Success message: „Link został wysłany na podany adres email"
  - Link: „Powrót do logowania" → /auth/login
- Toast notification

**UX, dostępność i bezpieczeństwo:**
- Clear instructions po wysłaniu linku
- Email format validation
- Rate limiting (Supabase)
- Nie ujawniać czy email istnieje w systemie (security)
- ARIA live region dla success message

**Flow resetowania:**
1. User wpisuje email
2. Supabase Auth SDK: `resetPasswordForEmail()`
3. Email wysłany z magicznym linkiem
4. User klika link → przekierowanie do strony ustawiania nowego hasła
5. Nowe hasło zapisane

**Względy techniczne:**
- AuthLayout.astro
- Ten sam AuthForm component (props dla reset variant)
- Supabase handles email sending

---

### 2.5. Survey Page (/survey)

**Główny cel:** Zebranie danych użytkownika do wygenerowania spersonalizowanego planu treningowego

**Kluczowe informacje do wyświetlenia:**
- Formularz ankiety (single-step, podzielony wizualnie na sekcje)
- Disclaimer prawny z checkboxem akceptacji

**Kluczowe komponenty widoku:**
- SurveyForm component (React)

  **Sekcja 1: Cele treningowe (Card)**
  - Select: Cel-dystans (5K, 10K, Half Marathon, Marathon)
  - Input: Średni tygodniowy kilometraż (number, > 0)
  - Input: Liczba dni treningowych w tygodniu (number, 2-7)

  **Sekcja 2: Dane osobowe (Card)**
  - Input: Wiek (number, 1-119)
  - Input: Waga w kg (number, 0-300)
  - Input: Wzrost w cm (number, 0-300)
  - Radio Group: Płeć (M, F)

  **Sekcja 3: Rekordy życiowe (Card)**
  - Dynamiczna lista rekordów (minimum 1)
  - Dla każdego rekordu:
    - Select: Dystans (5K, 10K, Half Marathon, Marathon)
    - Input: Czas w sekundach (number, > 0)
    - Button: „Usuń rekord" (jeśli więcej niż 1)
  - Button: „+ Dodaj kolejny rekord"

  **Sekcja 4: Disclaimer prawny (Card)**
  - Tekst disclaimer (scrollable jeśli długi)
  - Checkbox: „Akceptuję powyższe warunki" (required)

  - Button: „Wygeneruj plan" (disabled jeśli formularz niepoprawny)

- LoadingModal component (podczas generowania AI)

**UX, dostępność i bezpieczeństwo:**
- Real-time validation z React Hook Form + Zod
- Inline error messages pod każdym polem
- Wizualne grupowanie sekcji (Card borders)
- Clear labels dla wszystkich inputów
- Helper text dla złożonych pól (np. "Podaj czas w sekundach")
- Persist form data w sessionStorage (nie tracić po refresh)
- Confirmation dialog jeśli aktywny plan już istnieje
- Semantic fieldsets dla grup pól
- ARIA labels i descriptions
- Focus management (pierwszy błąd)
- Scroll to first error on submit

**Flow generowania planu:**
1. User wypełnia formularz
2. Client-side validation (Zod)
3. Submit → sprawdzenie czy ma aktywny plan (GET /api/training-plans/active)
4. Jeśli plan istnieje → Confirmation Dialog:
   - "Masz już aktywny plan treningowy. Wygenerowanie nowego planu spowoduje nadpisanie obecnego. Czy chcesz kontynuować?"
   - Buttons: "Anuluj" | "Tak, wygeneruj nowy plan"
5. Jeśli potwierdzone (lub brak planu) → LoadingModal
6. POST /api/training-plans/generate (profile + personal_records)
7. Loading modal z komunikatami:
   - "Analizujemy Twoje dane..."
   - "Tworzenie spersonalizowanego planu..."
   - "To może potrwać 20-30 sekund"
8. Timeout po 60 sekundach → error message
9. Success → redirect /dashboard

**Względy techniczne:**
- DashboardLayout.astro (navbar visible)
- React Hook Form dla zarządzania stanem formularza
- Zod schemas dla validation
- sessionStorage dla persystencji danych
- Conditional rendering: ConfirmDialog (Shadcn Dialog)
- LoadingModal (not closable, animated spinner)

---

### 2.6. Dashboard Page (/dashboard)

**Główny cel:** Wyświetlenie aktywnego planu treningowego i umożliwienie śledzenia postępów

**Kluczowe informacje do wyświetlenia:**
- 10-tygodniowy plan treningowy (70 dni)
- Statystyki wykonania planu
- Status każdego dnia (rest, pending, completed)
- Bieżący dzień (today)

**Kluczowe komponenty widoku:**
- TrainingPlanView component (React)

  **Header planu:**
  - Tytuł: "Twój plan treningowy"
  - Data rozpoczęcia i zakończenia
  - Statystyki (Card):
    - Wykonane treningi: X/Y
    - Procent ukończenia: Z%
    - Progress bar (wizualizacja postępu)

  **Lista dni (pogrupowana po tygodniach):**
  - WeekAccordion component (10 tygodni)
    - Header: "Tydzień X: Y/Z treningów wykonanych"
    - Collapsible content (Shadcn Accordion)
    - Zawiera 7x WorkoutDayCard

  - WorkoutDayCard component
    - Data (DD.MM.YYYY)
    - Dzień (day_number / 70)
    - Status visual indicator:
      - Rest day: muted background, ikona 🛌, tekst "Odpoczynek"
      - Pending: neutral border, checkbox unchecked
      - Completed: zielony border, checkbox checked, ikona ✓
    - Opis treningu (truncated w collapsed state)
    - Button/Checkbox: "Oznacz jako wykonany" (tylko non-rest days)
    - Expandable (click na Card) → pełny opis

  - FAB (Floating Action Button): "↓ Dzisiaj"
    - Sticky w prawym dolnym rogu
    - Scroll to today's card (smooth scroll)
    - Visible only gdy today card nie jest w viewport

- EmptyState component (jeśli brak aktywnego planu)
  - Message: "Nie masz aktywnego planu treningowego"
  - Button: "Wygeneruj plan" → /survey

- CompletionModal component (jeśli plan ukończony)
  - Popup z gratulacjami (US-012)
  - "Gratulacje! Ukończyłeś swój plan treningowy!"
  - Button: "Wygeneruj nowy plan" → /survey

**UX, dostępność i bezpieczeństwo:**
- Auto-scroll to today's card on load (smooth scroll, block: 'center')
- Optimistic UI dla marking completed:
  - Natychmiastowa zmiana stanu (visual feedback)
  - API request w tle (PATCH /api/workout-days/:id)
  - Rollback jeśli error + Toast notification
- Skeleton loaders podczas początkowego ładowania
- Collapsible weeks (accordion) → progressive disclosure
- Clear visual distinction: rest vs workout vs completed
- Touch-friendly targets (min 44x44px) na mobile
- Keyboard navigation (Tab, Enter dla expand/collapse)
- ARIA expanded/collapsed dla accordion
- ARIA live region dla completion status changes
- Focus management po marking completed

**Flow interakcji:**
1. Page load → SSR fetch active plan (GET /api/training-plans/active)
2. Render plan z all workout days
3. Auto-scroll to today's card
4. User clicks checkbox na workout card
5. Optimistic update (visual change)
6. Background API request (PATCH /api/workout-days/:id)
7. Success → Toast: "Trening oznaczony jako wykonany"
8. Error → Rollback + Toast: "Nie udało się zaktualizować. Spróbuj ponownie."

**Przypadki brzegowe:**
- Brak aktywnego planu → EmptyState component
- Plan ukończony (all workouts done lub end_date passed) → CompletionModal
- Network error → Toast with retry button
- API timeout → Toast: "Sprawdź połączenie internetowe"

**Względy techniczne:**
- DashboardLayout.astro
- SSR: Fetch active plan server-side (Astro)
- Pass data as props to TrainingPlanView (React)
- Local state dla optimistic updates
- Group days by weeks (day_number 1-7, 8-14, etc.)
- Scroll API: element.scrollIntoView({ behavior: 'smooth', block: 'center' })
- IntersectionObserver dla FAB visibility

---

### 2.7. Profile Page (/profile)

**Główny cel:** Wyświetlenie danych użytkownika z ostatniej ankiety (read-only)

**Kluczowe informacje do wyświetlenia:**
- Dane z ostatniej wypełnionej ankiety
- Button do wygenerowania nowego planu

**Kluczowe komponenty widoku:**
- ProfileView component (React)

  **Sekcja 1: Cele treningowe (Card)**
  - Cel-dystans: [wartość]
  - Średni tygodniowy kilometraż: [wartość] km
  - Liczba dni treningowych: [wartość] dni/tydzień

  **Sekcja 2: Dane osobowe (Card)**
  - Wiek: [wartość] lat
  - Waga: [wartość] kg
  - Wzrost: [wartość] cm
  - Płeć: [M/F]

  **Sekcja 3: Rekordy życiowe (Card)**
  - Lista rekordów (format: dystans → czas)
  - Np. "5K: 20:00, 10K: 42:30"

  **Actions (Card)**
  - Button: "Wygeneruj nowy plan" → /survey
  - Button: "Wyloguj się" (opcjonalnie, jeśli nie w navbar)

- EmptyState component (jeśli brak profilu)
  - Message: "Uzupełnij ankietę, aby rozpocząć"
  - Button: "Wypełnij ankietę" → /survey

**UX, dostępność i bezpieczeństwo:**
- Read-only display (brak edycji inline)
- Edycja tylko przez generowanie nowego planu
- Clear labels dla każdej wartości
- Responsive layout (stack na mobile)
- Skeleton loaders podczas ładowania
- Semantic HTML (dl, dt, dd dla definition lists)
- ARIA labels dla read-only values

**Flow:**
1. Page load → SSR fetch profile (GET /api/profile)
2. Fetch personal records (GET /api/personal-records)
3. Render ProfileView z danymi
4. User clicks "Wygeneruj nowy plan"
5. Redirect → /survey (pre-filled z obecnymi danymi)

**Przypadki brzegowe:**
- Brak profilu (404 z API) → EmptyState + redirect /survey
- Network error → Toast + retry button

**Względy techniczne:**
- DashboardLayout.astro
- SSR: Fetch profile + personal records server-side
- Pass data as props to ProfileView (React)
- Pre-fill survey data w sessionStorage when redirecting to /survey

---

## 3. Mapa podróży użytkownika

### 3.1. Podróż nowego użytkownika (First-time user)

**Krok 1: Odkrywanie aplikacji**
- Landing Page (/)
- User widzi value proposition
- CTA: "Zacznij za darmo"

**Krok 2: Rejestracja**
- Click CTA → /auth/signup
- Wypełnienie formularza rejestracji (email, hasło)
- Walidacja client-side
- Submit → Supabase Auth
- Automatyczne logowanie
- Redirect → /survey

**Krok 3: Wypełnienie ankiety**
- Survey Page (/survey)
- Wypełnienie 3 sekcji danych (cele, dane osobowe, rekordy)
- Akceptacja disclaimer
- Walidacja real-time
- Persist w sessionStorage (ochrona przed utratą danych)

**Krok 4: Generowanie planu**
- Click "Wygeneruj plan"
- LoadingModal pojawia się
- Komunikaty postępu (20-60s)
- POST /api/training-plans/generate
- AI generuje 70-dniowy plan
- Success → redirect /dashboard

**Krok 5: Przeglądanie planu**
- Dashboard Page (/dashboard)
- Auto-scroll do dzisiejszego dnia
- Przegląd tygodni (accordion)
- Zapoznanie się z treningami

**Krok 6: Śledzenie postępów**
- Wykonanie treningu
- Oznaczenie jako wykonany (checkbox)
- Optimistic UI update
- Toast confirmation
- Kontynuacja przez 10 tygodni

**Krok 7: Ukończenie planu**
- Last workout completed LUB end_date passed
- CompletionModal z gratulacjami
- CTA: "Wygeneruj nowy plan"
- Możliwość rozpoczęcia nowego cyklu

---

### 3.2. Podróż powracającego użytkownika (Returning user)

**Krok 1: Powrót do aplikacji**
- Landing Page (/)
- Middleware wykrywa zalogowanego usera
- Automatyczny redirect → /dashboard

**Krok 2: Dashboard**
- Dashboard Page (/dashboard)
- Widok aktywnego planu (gdzie przerwał)
- Auto-scroll do dzisiejszego dnia
- Sprawdzenie co ma do zrobienia dzisiaj

**Krok 3: Interakcje**
- Oznaczanie treningów jako wykonane
- Przeglądanie nadchodzących treningów
- Sprawdzanie statystyk (procent ukończenia)

**Krok 4: Przeglądanie profilu (opcjonalnie)**
- Click "Profil" w navbar
- Profile Page (/profile)
- Przegląd swoich danych
- Powrót do Dashboard

**Krok 5: Generowanie nowego planu (opcjonalnie)**
- Click "Nowy Plan" w navbar LUB button w Profile
- Redirect → /survey (pre-filled)
- Edycja danych jeśli potrzeba
- Confirmation Dialog (nadpisanie obecnego planu)
- Confirm → nowy plan wygenerowany

---

### 3.3. Alternatywne ścieżki

**Ścieżka A: Reset hasła**
- Landing → Login
- Click "Zapomniałem hasła"
- Reset Password Page (/auth/reset-password)
- Wpisanie email
- Email wysłany z magic link
- Click link w mailu
- Ustawienie nowego hasła
- Redirect → /auth/login
- Zalogowanie z nowym hasłem

**Ścieżka B: Brak aktywnego planu**
- Returning user → Dashboard
- GET /api/training-plans/active → 404
- EmptyState component
- "Nie masz aktywnego planu"
- CTA → /survey
- Generowanie pierwszego/nowego planu

**Ścieżka C: Błędy i edge cases**
- API timeout podczas generowania → Error modal z retry
- Network error przy marking completed → Rollback + toast z retry
- Session expired → Redirect /auth/login + toast "Sesja wygasła"
- Validation errors w survey → Inline errors + focus first error

---

## 4. Układ i struktura nawigacji

### 4.1. Główna nawigacja (Top Navbar)

**Desktop i Tablet (≥768px):**
- Logo Athletica (left) → click: /dashboard
- Menu items (center/right):
  - Dashboard → /dashboard
  - Profil → /profile
  - Nowy Plan → /survey
  - Wyloguj się → logout action
- Sticky positioning (zawsze widoczna)
- Horizontal layout

**Mobile (<768px):**
- Top navbar tylko logo (left)
- Bottom navigation bar (fixed bottom):
  - Icon: 🏠 Dashboard → /dashboard
  - Icon: 👤 Profil → /profile
  - Icon: ➕ Nowy Plan → /survey
- Active state: accent color + indicator
- Hide on scroll down, show on scroll up (auto-hide behavior)

**Wyjątki nawigacji:**
- Landing page: brak nawigacji (tylko CTA)
- Auth pages (login/signup/reset): tylko logo, brak menu
- Survey page: pełna navbar (możliwość anulowania)
- Profile page bez danych: navbar tylko logo + wyloguj

**Implementacja:**
- Navbar.astro component (static)
- BottomNav.tsx component (React, auto-hide behavior)
- Active route highlighting (Astro.url.pathname)
- Logout action: Supabase Auth SDK + redirect /auth/login

---

### 4.2. Nawigacja hierarchiczna

**Poziomy hierarchii:**

1. **Root level:**
   - / (Landing) - publiczny
   - /auth/* (Auth pages) - publiczny

2. **App level (chronione):**
   - /dashboard (główny widok)
   - /survey (formularz)
   - /profile (profil użytkownika)

**Breadcrumbs:** NIE w MVP (płaska struktura, tylko 3 główne widoki)

**Back navigation:**
- Browser back button (standardowy)
- Brak custom back buttons (niepotrzebne w płaskiej strukturze)

---

### 4.3. Routing i ochrona tras

**Public routes (dostępne dla niezalogowanych):**
- /
- /auth/login
- /auth/signup
- /auth/reset-password

**Protected routes (wymagają auth):**
- /dashboard
- /survey
- /profile

**Middleware logic:**
```
Request → Middleware checks Supabase session

IF not authenticated AND route is protected:
  → Redirect /auth/login

IF authenticated AND route is public auth (/auth/*):
  → Redirect /dashboard

IF authenticated AND route is / (landing):
  → Redirect /dashboard

IF authenticated AND route is /dashboard:
  → Check if has profile (GET /api/profile)
  → If 404 (no profile) → Redirect /survey

ELSE:
  → Render requested page
```

---

### 4.4. Deep linking i URL structure

**Struktura URL:**
- `/` - landing
- `/auth/login` - logowanie
- `/auth/signup` - rejestracja
- `/auth/reset-password` - reset hasła
- `/dashboard` - dashboard z planem
- `/survey` - ankieta
- `/profile` - profil użytkownika

**Query params:** NIE w MVP (brak filtrów, paginacji, etc.)

**URL state:** NIE w MVP (cała aplikacja działa na client state + server data)

**Shareable URLs:** NIE w MVP (prywatne dane użytkownika, brak social sharing)

---

## 5. Kluczowe komponenty

### 5.1. Layout Components (Astro - Static)

#### Layout.astro
- **Cel:** Główny layout wrapper dla wszystkich stron
- **Elementy:** HTML structure, head, meta tags, global styles
- **Props:** title, description (dla SEO)
- **Zastosowanie:** Wszystkie strony

#### AuthLayout.astro
- **Cel:** Layout dla stron autoryzacji
- **Elementy:** Centered container, logo, form wrapper
- **Design:** Minimal, focused na formularz
- **Zastosowanie:** /auth/login, /auth/signup, /auth/reset-password

#### DashboardLayout.astro
- **Cel:** Layout dla chronionych stron aplikacji
- **Elementy:** Navbar, BottomNav (mobile), main content area, footer (opcjonalnie)
- **Props:** user (dla navbar)
- **Zastosowanie:** /dashboard, /survey, /profile

#### Navbar.astro
- **Cel:** Główna nawigacja aplikacji
- **Elementy:** Logo, menu items, logout button
- **Responsive:** Full menu (desktop/tablet), logo only (mobile)
- **Sticky:** Zawsze widoczna u góry
- **Active state:** Highlight current route

---

### 5.2. Navigation Components (React - Interactive)

#### BottomNav.tsx
- **Cel:** Mobile bottom navigation bar
- **Elementy:** 3 icon buttons (Dashboard, Profile, New Plan)
- **Behavior:** Auto-hide on scroll down, show on scroll up
- **Active state:** Accent color dla current route
- **Sticky:** Fixed bottom position
- **Responsive:** Visible tylko <768px

---

### 5.3. Auth Components (React - Interactive)

#### AuthProvider.tsx
- **Cel:** React Context dla auth state
- **Provides:** { user, loading, logout }
- **Init:** useEffect → Supabase getUser()
- **Persistence:** Auth state dostępny w całej aplikacji
- **Wraps:** Cała aplikacja (Layout component)

#### AuthForm.tsx
- **Cel:** Reusable formularz auth (login/signup/reset)
- **Props:** variant ('login' | 'signup' | 'reset')
- **Elementy:** Inputs (email, password), submit button, links
- **Validation:** React Hook Form + Zod
- **States:** Loading (submit), error (inline)
- **Submit handlers:** Różne per variant (Supabase Auth SDK)

---

### 5.4. Survey Components (React - Interactive)

#### SurveyForm.tsx
- **Cel:** Formularz ankiety do generowania planu
- **Struktura:** Single-step, 3 Card sections + disclaimer
- **Elementy:**
  - Section 1: Goal distance, weekly km, training days
  - Section 2: Age, weight, height, gender
  - Section 3: Personal records (dynamic list, min 1)
  - Section 4: Disclaimer + checkbox
  - Submit button: "Wygeneruj plan"
- **Validation:** React Hook Form + Zod, real-time
- **Persistence:** sessionStorage (nie tracić danych po refresh)
- **Pre-fill:** Load z sessionStorage lub profile data (jeśli returning user)
- **Submit flow:** Check active plan → Confirmation dialog → LoadingModal → API call

#### LoadingModal.tsx
- **Cel:** Modal podczas generowania planu AI
- **Elementy:** Spinner, progress messages, progress bar
- **Behavior:** NOT closable, auto-close on success/error
- **Messages:** "Analizujemy...", "Tworzenie planu...", "20-30 sekund"
- **Timeout:** 60 sekund → error state
- **Props:** isOpen, onSuccess, onError

#### ConfirmDialog.tsx
- **Cel:** Confirmation dialog przed nadpisaniem planu
- **Trigger:** Submit survey gdy ma aktywny plan
- **Message:** "Masz już aktywny plan. Nadpisanie spowoduje utratę obecnego. Kontynuować?"
- **Buttons:** "Anuluj" | "Tak, wygeneruj nowy plan"
- **Props:** isOpen, onConfirm, onCancel

---

### 5.5. Dashboard Components (React - Interactive)

#### TrainingPlanView.tsx
- **Cel:** Container dla całego planu treningowego
- **Elementy:**
  - Plan header z statystykami (Card)
  - 10x WeekAccordion components
  - FAB (scroll to today)
- **Data:** Otrzymuje training plan as props (SSR)
- **State:** Local state dla optimistic updates
- **Effects:** useEffect → auto-scroll to today on mount
- **Empty state:** EmptyState component jeśli brak planu

#### WeekAccordion.tsx
- **Cel:** Accordion item dla jednego tygodnia
- **Elementy:**
  - AccordionTrigger: "Tydzień X: Y/Z wykonanych"
  - AccordionContent: 7x WorkoutDayCard
- **Props:** weekNumber, workoutDays (7 dni)
- **Collapsed by default:** Poza current week (auto-expand today's week)
- **Component:** Shadcn/ui Accordion

#### WorkoutDayCard.tsx
- **Cel:** Card dla pojedynczego dnia treningowego
- **Elementy:**
  - Header: Data (DD.MM.YYYY) + day number
  - Body: Workout description (truncated/expanded)
  - Footer: Checkbox "Oznacz jako wykonany" (jeśli nie rest day)
- **Visual states:**
  - Rest: muted bg, 🛌 icon, "Odpoczynek", disabled
  - Pending: neutral border, unchecked checkbox
  - Completed: green border, checked checkbox, ✓ icon
- **Interactions:**
  - Click card → expand/collapse description
  - Click checkbox → mark completed (optimistic update)
- **Props:** workoutDay, onToggleCompleted
- **Optimistic:** Update local state instantly, API w tle, rollback on error

---

### 5.6. Profile Components (React - Interactive)

#### ProfileView.tsx
- **Cel:** Read-only display profilu użytkownika
- **Elementy:**
  - 3 Card sections (jak w SurveyForm ale read-only)
  - Section 1: Training goals
  - Section 2: Personal data
  - Section 3: Personal records (lista)
  - Action card: "Wygeneruj nowy plan" button
- **Data:** Otrzymuje profile + personal_records as props (SSR)
- **No edit:** Brak inline editing (tylko through new plan generation)
- **Empty state:** EmptyState jeśli brak profilu

---

### 5.7. Shared UI Components (React - Interactive)

#### EmptyState.tsx
- **Cel:** Placeholder gdy brak danych
- **Variants:** No plan, no profile
- **Elementy:** Icon, message, CTA button
- **Props:** variant, ctaText, ctaLink

#### ErrorBoundary.tsx
- **Cel:** Catch unhandled React errors
- **Fallback UI:** "Coś poszło nie tak" + "Odśwież stronę" button
- **Logging:** console.error (production: Sentry opcjonalnie)
- **Wraps:** Root level React components

#### CompletionModal.tsx
- **Cel:** Popup z gratulacjami po ukończeniu planu (US-012)
- **Trigger:** is_plan_completed === true
- **Elementy:** 🎉 icon, "Gratulacje!", message, CTA
- **CTA:** "Wygeneruj nowy plan" → /survey
- **Props:** isOpen, onClose, onGenerateNewPlan

---

### 5.8. Shadcn/ui Components (z biblioteki)

Wykorzystywane komponenty z Shadcn/ui (new-york style):

- **Button** (już dodany) - primary actions, variants
- **Card** (już dodany) - grouping content, sections
- **Avatar** (już dodany) - user profile icon (opcjonalnie)
- **Input** - text fields w formularzach
- **Select** - dropdowns (goal distance, personal record distance)
- **Radio Group** - gender selection
- **Checkbox** - disclaimer acceptance, workout completion
- **Dialog** - modals (loading, confirmation, completion)
- **Toast** - notifications (success/error)
- **Accordion** - collapsible weeks
- **Skeleton** - loading placeholders
- **Progress** - progress bar (plan completion, loading)
- **Badge** - status indicators (opcjonalnie)

---

## 6. Mapowanie historyjek użytkownika do architektury UI

### US-001: Rejestracja nowego użytkownika

**Widok:** /auth/signup

**Elementy UI:**
- AuthForm component (variant: signup)
- Input: Email (validation: format)
- Input: Hasło (validation: min 8 chars)
- Input: Powtórz hasło (validation: match)
- Button: "Zarejestruj się" (loading state)
- Inline errors (red text)
- Toast on error

**Kryteria akceptacji → UI:**
1. Formularz z polami → AuthForm inputs
2. Walidacja email → Zod schema + React Hook Form
3. Sprawdzenie identyczności haseł → Zod .refine()
4. Auto-login + redirect → Supabase signUp + Astro.redirect
5. Komunikat błędu (user exists) → Toast notification

---

### US-002: Logowanie do systemu

**Widok:** /auth/login

**Elementy UI:**
- AuthForm component (variant: login)
- Input: Email
- Input: Hasło
- Button: "Zaloguj się" (loading state)
- Link: "Zapomniałem hasła"
- Inline errors
- Toast on error

**Kryteria akceptacji → UI:**
1. Formularz z email i hasłem → AuthForm inputs
2. Redirect po zalogowaniu → Middleware logic (profile check → /dashboard lub /survey)
3. Komunikat błędu → Toast + inline error message

---

### US-003: Wylogowanie z systemu

**Widok:** Navbar component (wszystkie chronione strony)

**Elementy UI:**
- Button/Link: "Wyloguj się" w Navbar
- Confirm logout (opcjonalnie)
- Toast: "Wylogowano pomyślnie"

**Kryteria akceptacji → UI:**
1. Przycisk "Wyloguj" → Navbar.astro / BottomNav.tsx
2. Kończenie sesji + redirect → Supabase signOut + redirect /auth/login

---

### US-004: Resetowanie hasła

**Widok:** /auth/reset-password

**Elementy UI:**
- AuthForm component (variant: reset)
- Input: Email
- Button: "Wyślij link resetujący" (loading state)
- Success message: "Link wysłany"
- Toast notification

**Kryteria akceptacji → UI:**
1. Link "Zapomniałem hasła" → /auth/login link
2. Podanie email → AuthForm input
3. Wysłanie email z linkiem → Supabase resetPasswordForEmail + toast
4. Ustawienie nowego hasła → External flow (Supabase handles)

---

### US-005: Wypełnienie ankiety i generacja pierwszego planu

**Widok:** /survey

**Elementy UI:**
- SurveyForm component
- 3 Card sections (goals, personal data, personal records)
- Dynamic personal records list (min 1)
- Disclaimer + checkbox
- Button: "Wygeneruj plan" (disabled if invalid)
- LoadingModal component
- ConfirmDialog (jeśli ma aktywny plan)

**Kryteria akceptacji → UI:**
1. Ankieta ze wszystkimi polami → SurveyForm z 3 sekcjami Card
2. Generowanie planu AI → POST /api/training-plans/generate + LoadingModal
3. Redirect po generacji → Success handler → Astro.redirect /dashboard
4. Disclaimer → Card section 4 z checkboxem

---

### US-006: Przeglądanie aktywnego planu treningowego

**Widok:** /dashboard

**Elementy UI:**
- TrainingPlanView component
- Plan header z statystykami
- 10x WeekAccordion (collapsible)
- 70x WorkoutDayCard (w accordions)
- FAB: "Dzisiaj" (scroll to today)

**Kryteria akceptacji → UI:**
1. Domyślny widok po zalogowaniu → Middleware redirect /dashboard
2. Lista chronologiczna → WorkoutDayCard sorted by day_number
3. Każdy kafelek = 1 dzień → WorkoutDayCard component
4. Scroll od góry → Auto-scroll to today on mount (smooth behavior)

---

### US-007: Oznaczanie treningu jako wykonanego

**Widok:** /dashboard → WorkoutDayCard component

**Elementy UI:**
- Checkbox "Oznacz jako wykonany" (w WorkoutDayCard)
- Visual state change (green border, ✓ icon)
- Toast: "Trening oznaczony jako wykonany"

**Kryteria akceptacji → UI:**
1. Interaktywny element → Checkbox (Shadcn/ui)
2. Zmiana statusu wizualnego → Conditional styling (completed state)
3. Zapisanie w systemie → PATCH /api/workout-days/:id (optimistic update)

---

### US-008: Cofanie oznaczenia treningu jako wykonanego

**Widok:** /dashboard → WorkoutDayCard component

**Elementy UI:**
- Ten sam Checkbox (toggle behavior)
- Visual state change (neutral border, unchecked)
- Toast: "Oznaczenie cofnięte"

**Kryteria akceptacji → UI:**
1. Cofnięcie przez tę samą interakcję → Checkbox toggle (uncheck)
2. Powrót do stanu początkowego → Conditional styling (pending state)
3. Zapisanie zmiany → PATCH /api/workout-days/:id { is_completed: false }

---

### US-009: Generowanie nowego planu (nadpisanie istniejącego)

**Widok:** /survey (z pre-filled danymi)

**Elementy UI:**
- Button "Nowy Plan" w Navbar → redirect /survey
- SurveyForm (pre-filled z profile data z sessionStorage)
- ConfirmDialog przed submit
- LoadingModal podczas generowania

**Kryteria akceptacji → UI:**
1. Opcja generowania nowego → Button "Nowy Plan" w Navbar + button w Profile
2. Wyświetlenie ankiety → /survey z pre-filled data
3. Okno dialogowe potwierdzenia → ConfirmDialog component (Shadcn Dialog)
4. Nadpisanie po potwierdzeniu → POST /api/training-plans/generate (deactivates old)

---

### US-010: Wyświetlanie dni odpoczynku

**Widok:** /dashboard → WorkoutDayCard component (rest day variant)

**Elementy UI:**
- WorkoutDayCard z muted styling
- Icon: 🛌
- Tekst: "Odpoczynek"
- Brak checkboxa (disabled state)

**Kryteria akceptacji → UI:**
1. Dedykowany kafelek → WorkoutDayCard (is_rest_day === true)
2. Informacja "Odpoczynek" → Conditional rendering (tekst + icon)
3. Brak opcji "wykonany" → Checkbox not rendered dla rest days

---

### US-011: Przeglądanie profilu użytkownika

**Widok:** /profile

**Elementy UI:**
- ProfileView component
- 3 Card sections (read-only)
- Section 1: Training goals
- Section 2: Personal data
- Section 3: Personal records
- Button: "Wygeneruj nowy plan"

**Kryteria akceptacji → UI:**
1. Link do profilu → "Profil" w Navbar
2. Wyświetlenie danych read-only → ProfileView component (bez edit)
3. Brak edycji bezpośredniej → Edycja tylko przez /survey (new plan generation)

---

### US-012: Zakończenie planu treningowego

**Widok:** /dashboard → CompletionModal component

**Elementy UI:**
- CompletionModal (popup)
- 🎉 Icon
- Tytuł: "Gratulacje!"
- Message: "Ukończyłeś swój 10-tygodniowy plan!"
- Button: "Wygeneruj nowy plan" → /survey

**Kryteria akceptacji → UI:**
1. Pop-up po upływie 10 tygodni / ostatni trening → CompletionModal (is_plan_completed)
2. Zachęta do nowego planu → Button CTA → redirect /survey

---

## 7. Względy UX, dostępności i bezpieczeństwa

### 7.1. User Experience (UX)

**Feedback i komunikacja:**
- Natychmiastowy feedback dla wszystkich akcji (optimistic UI)
- Toast notifications dla sukcesu/błędów (non-intrusive)
- Loading states (spinners, skeleton loaders)
- Progress indicators (AI generation, plan completion)
- Clear error messages (user-friendly, simplified)

**Progressive disclosure:**
- Accordion dla tygodni (nie overwhelm 70 kart naraz)
- Truncated descriptions w collapsed state
- FAB "Dzisiaj" pojawia się tylko gdy needed

**Cognitive load reduction:**
- Single-step survey (nie multi-step wizard)
- Visual grouping (Cards dla sekcji)
- Clear labels i helper texts
- Consistent patterns (Button styles, Card layouts)

**Error prevention:**
- Real-time validation (catch errors early)
- Confirmation dialogs (dla destructive actions)
- Disabled states (prevent invalid submissions)
- sessionStorage persistence (nie tracić danych)

**Performance:**
- SSR dla initial load (fast first paint)
- Lazy loading dla heavy components (opcjonalnie)
- Optimistic updates (perceived performance)
- Skeleton loaders (content placeholders)

---

### 7.2. Accessibility (A11y)

**Semantic HTML:**
- Proper heading hierarchy (h1 → h6)
- Landmarks (header, nav, main, footer, aside)
- Lists dla navigation items (ul, li)
- Forms z label + input association
- Definition lists dla read-only data (dl, dt, dd)

**ARIA attributes:**
- aria-label dla icon-only buttons
- aria-expanded/aria-controls dla accordion
- aria-live dla dynamic updates (toast, completion status)
- aria-describedby dla error messages
- aria-invalid dla validation errors
- aria-current dla active navigation item

**Keyboard navigation:**
- Tab order logiczny (focus flow)
- Enter/Space dla button actions
- Arrow keys dla accordion navigation (opcjonalnie)
- Escape dla zamykania modals
- Focus trap w modalach (nie wychodzić poza)
- Focus management (pierwszy error po validation)

**Visual accessibility:**
- Color contrast ratio: WCAG AA minimum (4.5:1 dla tekstu)
- Focus-visible states (Shadcn/ui provides)
- Not relying on color alone (icons + text dla statusów)
- Scalable text (rem units, nie px)
- Touch targets minimum 44x44px (mobile)

**Screen reader support:**
- Alt text dla ikon (jeśli nie decorative)
- Skip to content link (optional)
- Descriptive link text (nie "click here")
- Form field labels (visible i aria)
- Error announcements (aria-live)

---

### 7.3. Security

**Authentication & Authorization:**
- JWT tokens via Supabase (HttpOnly cookies)
- Row Level Security (RLS) na database level
- Protected routes (middleware checks)
- Session expiry handling (redirect + toast)
- CSRF protection (Supabase handles)

**Input validation & sanitization:**
- Client-side validation (Zod schemas)
- Server-side validation (API endpoints)
- SQL injection prevention (Supabase parametrized queries)
- XSS prevention (React escapes by default)

**Data protection:**
- HTTPS only (production)
- Sensitive data nie w localStorage (tylko sessionStorage dla non-sensitive)
- JWT w HttpOnly cookies (nie accessible via JS)
- Password hashing (Supabase bcrypt)
- Rate limiting (Supabase handles auth attempts)

**Privacy:**
- Minimal data collection (tylko co potrzebne dla planu)
- User owns their data (może wygenerować nowy plan)
- No third-party tracking w MVP
- Clear disclaimer (legal liability)

---

## 8. Responsiveness i Mobile-First Design

### 8.1. Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### 8.2. Layout adaptations

**Mobile (<768px):**
- Stack layout (1 kolumna)
- Bottom navigation bar (3 ikony)
- Top navbar (tylko logo)
- Cards full-width
- Touch-friendly targets (min 44x44px)
- Larger font sizes (czytelność)
- Simplified interactions (mniej hover states)

**Tablet (768px - 1024px):**
- Top navbar (pełna)
- 1-2 kolumny (opcjonalnie dla wide content)
- Cards z padding
- Desktop-like interactions

**Desktop (>1024px):**
- Top navbar (pełna)
- Max-width container (1280px, centered)
- Cards z margins
- Hover states (dla buttons, links)
- Keyboard shortcuts (opcjonalnie)

### 8.3. Touch vs Mouse interactions

**Touch (mobile/tablet):**
- Tap to expand/collapse (accordion, cards)
- Swipe gestures (opcjonalnie, not MVP)
- Long press (opcjonalnie)
- No hover states (tylko active)

**Mouse (desktop):**
- Hover states (buttons, cards, links)
- Click to expand/collapse
- Tooltips on hover (opcjonalnie)
- Context menus (opcjonalnie, not MVP)

---

## 9. Przypadki brzegowe i obsługa błędów

### 9.1. Network errors

**Scenario:** User traci połączenie podczas API call

**Obsługa:**
- Toast notification: "Sprawdź połączenie internetowe"
- Retry button w toast
- Rollback optimistic updates (jeśli applicable)
- Offline indicator (opcjonalnie)

---

### 9.2. API timeouts

**Scenario:** AI generation przekracza 60 sekund

**Obsługa:**
- LoadingModal timeout handler
- Error message: "Generowanie trwało zbyt długo. Spróbuj ponownie."
- Close modal + toast z retry button
- Log error (Sentry opcjonalnie)

---

### 9.3. Session expiry

**Scenario:** JWT token expires podczas sesji

**Obsługa:**
- API returns 401 Unauthorized
- Middleware catches → redirect /auth/login
- Toast: "Sesja wygasła. Zaloguj się ponownie."
- Preserve intent (redirect back after login, opcjonalnie)

---

### 9.4. Validation errors

**Scenario:** User submits invalid form data

**Obsługa:**
- Client-side validation (Zod) catches before submit
- Inline error messages (red text pod fields)
- Focus first error field
- Disabled submit button if invalid
- Server-side validation (backup) → 400 response → toast

---

### 9.5. Empty states

**Scenario A:** User ma konto ale brak profilu

**Obsługa:**
- /dashboard → GET /api/profile → 404
- Automatic redirect /survey
- Navbar simplified (logo + logout)

**Scenario B:** User ma profil ale brak aktywnego planu

**Obsługa:**
- /dashboard → GET /api/training-plans/active → 404
- EmptyState component
- Message: "Nie masz aktywnego planu treningowego"
- CTA: "Wygeneruj plan" → /survey

---

### 9.6. Plan completion

**Scenario:** User kończy wszystkie treningi LUB end_date passed

**Obsługa:**
- /dashboard → is_plan_completed === true
- CompletionModal auto-opens
- Gratulacje + CTA "Nowy plan"
- Modal closable (user może dalej przeglądać ukończony plan)

---

### 9.7. Concurrent updates

**Scenario:** User ma otwarte 2 tabs, oznacza trening w obu

**Obsługa:**
- Optimistic update w obu tabs
- API call z obu → eventual consistency
- Ostatni request wins
- Brak synchronizacji real-time w MVP
- (Post-MVP: WebSocket lub polling dla sync)

---

### 9.8. Browser refresh podczas AI generation

**Scenario:** User refreshuje stronę podczas generowania planu

**Obsługa:**
- LoadingModal state lost (nie persist)
- User wraca do /survey
- sessionStorage preserves form data
- Plan może być wciąż generowany w tle (asynchronous)
- User może retry (generate again)
- (Post-MVP: Backend job queue dla resilience)

---

## 10. Podsumowanie architektury

### 10.1. Kluczowe decyzje architektoniczne

1. **Hybrid rendering (Astro SSR + React)** - Szybkie initial load + interaktywność gdzie potrzeba
2. **Mobile-first responsive design** - Priorytet dla użytkowników mobilnych
3. **Optimistic UI** - Natychmiastowy feedback dla lepszego UX
4. **Single-step survey** - Zmniejszenie cognitive load (nie multi-step wizard)
5. **Progressive disclosure** - Accordion dla tygodni, truncated descriptions
6. **Supabase Auth + RLS** - Security na poziomie database + aplikacji
7. **React Context dla auth state** - Prosty state management bez Zustand/Redux
8. **sessionStorage dla form persistence** - Ochrona przed utratą danych

---

### 10.2. Spełnienie wymagań PRD

✅ **Wszystkie 12 historyjek użytkownika** zmapowane do konkretnych widoków i komponentów

✅ **Wymagania funkcjonalne:**
- 3.1: System kont → Auth pages + Supabase integration
- 3.2: Ankieta i generowanie → SurveyForm + LoadingModal + API
- 3.3: Interfejs planu → TrainingPlanView + WorkoutDayCard
- 3.4: Interakcja z treningiem → Checkbox + optimistic updates
- 3.5: Profil użytkownika → ProfileView (read-only)
- 3.6: Disclaimer → Survey section 4

✅ **Metryki sukcesu:**
- 6.1: Procent wykonanych treningów → Trackable via PATCH /api/workout-days/:id
- 6.2: Aktywacja planu → Trackable via POST /api/training-plans/generate

---

### 10.3. Zgodność z API Plan

✅ **Wszystkie 7 endpointów** zintegrowane w architekturze UI:
- GET /api/profile → ProfileView, Survey pre-fill
- GET /api/personal-records → ProfileView
- POST /api/personal-records → (not used directly w MVP)
- DELETE /api/personal-records/:id → (not used directly w MVP)
- POST /api/training-plans/generate → SurveyForm submit
- GET /api/training-plans/active → Dashboard SSR
- PATCH /api/workout-days/:id → WorkoutDayCard completion toggle

✅ **Authentication & Authorization:** Supabase JWT + RLS policies respektowane

✅ **Validation:** Zod schemas w sync z API validation rules

---

### 10.4. Priorytetyzacja implementacji

**Phase 1: Foundation (Critical)**
1. Dodanie Shadcn/ui components (Input, Select, Dialog, Toast, Accordion, Skeleton)
2. Layouty (AuthLayout, DashboardLayout)
3. AuthProvider (React Context)
4. Navbar + BottomNav

**Phase 2: Auth Flow**
5. Login page
6. Signup page
7. Reset password page
8. Protected routes middleware

**Phase 3: Core Features**
9. Landing page
10. Survey page (SurveyForm)
11. LoadingModal + ConfirmDialog
12. Dashboard (TrainingPlanView + WeekAccordion + WorkoutDayCard)
13. Optimistic updates dla workout completion

**Phase 4: Secondary Features**
14. Profile page
15. Empty states
16. CompletionModal
17. FAB (scroll to today)

**Phase 5: Polish**
18. Error handling (toast, error boundary)
19. Responsiveness (mobile/tablet/desktop testing)
20. Accessibility audit
21. Testing (manual + automated opcjonalnie)

---

**Architektura UI dla Athletica MVP jest kompletna, spójna z PRD i API Plan, oraz gotowa do implementacji zgodnie z 5-fazowym planem.**
