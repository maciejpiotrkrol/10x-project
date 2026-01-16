# Specyfikacja techniczna modułu autentykacji - Athletica

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Przegląd struktury stron i layoutów

#### Strony publiczne (non-auth)
- **`src/pages/index.astro`** - Landing page (istniejąca, wymaga aktualizacji linku)
  - Aktualnie przekierowuje zalogowanych użytkowników do `/dashboard` (middleware)
  - Link "Zacznij za darmo" musi wskazywać na `/auth/signup` zamiast obecnego
  - Brak zmian w strukturze, jedynie aktualizacja href w komponencie Button

#### Nowe strony autentykacji (non-auth)
- **`src/pages/auth/signup.astro`** - Strona rejestracji
  - Layout: `Layout.astro` (podstawowy layout bez nawigacji)
  - Tytuł: "Rejestracja - Athletica"
  - Zawiera komponent React `<SignupForm client:load />`
  - Link do strony logowania: `/auth/login`
  - SSR włączony: `export const prerender = false`

- **`src/pages/auth/login.astro`** - Strona logowania
  - Layout: `Layout.astro`
  - Tytuł: "Logowanie - Athletica"
  - Zawiera komponent React `<LoginForm client:load />`
  - Link do resetowania hasła: `/auth/forgot-password` (tekst: "Zapomniałem hasła")
  - Link do rejestracji: `/auth/signup`
  - SSR włączony: `export const prerender = false`

- **`src/pages/auth/forgot-password.astro`** - Strona resetowania hasła
  - Layout: `Layout.astro`
  - Tytuł: "Resetowanie hasła - Athletica"
  - Zawiera komponent React `<ForgotPasswordForm client:load />`
  - Link powrotny do logowania: `/auth/login`
  - SSR włączony: `export const prerender = false`

- **`src/pages/auth/reset-password.astro`** - Strona ustawiania nowego hasła
  - Layout: `Layout.astro`
  - Tytuł: "Nowe hasło - Athletica"
  - Zawiera komponent React `<ResetPasswordForm client:load />`
  - Odbiera token resetowania z URL (query param lub hash)
  - SSR włączony: `export const prerender = false`

- **`src/pages/auth/verify-email.astro`** - Strona potwierdzenia email (opcjonalna w MVP)
  - Layout: `Layout.astro`
  - Wyświetla komunikat o wysłaniu emaila weryfikacyjnego
  - Może zawierać przycisk do ponownego wysłania emaila

#### Strony chronione (auth)
Istniejące strony wymagające autentykacji:
- **`src/pages/dashboard.astro`** - wymaga sprawdzenia auth i redirect do `/auth/login` przy 401
- **`src/pages/profile.astro`** - wymaga sprawdzenia auth i redirect do `/auth/login` przy 401
- **`src/pages/survey.astro`** - wymaga sprawdzenia auth i redirect do `/auth/login` przy 401

### 1.2. Komponenty React do formularzy autentykacji

#### SignupForm (`src/components/auth/SignupForm.tsx`)
**Odpowiedzialność**: Formularz rejestracji użytkownika

**Stan komponentu**:
```typescript
interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
}
```

**Walidacja client-side**:
- Email: format email (regex), wymagane
- Hasło: min. 8 znaków, wymagane
- Potwierdzenie hasła: musi być identyczne z hasłem

**Komunikaty błędów**:
- Email nieprawidłowy: "Podaj prawidłowy adres email"
- Hasło za krótkie: "Hasło musi mieć co najmniej 8 znaków"
- Hasła różne: "Hasła muszą być identyczne"
- Email zajęty (z API): "Użytkownik o podanym adresie email już istnieje"
- Błąd sieciowy: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie."

**Przebieg akcji**:
1. Użytkownik wypełnia formularz (email, hasło, potwierdzenie hasła)
2. Po kliknięciu "Zarejestruj się" - walidacja client-side
3. Jeśli walidacja OK - wywołanie `POST /api/auth/signup` z body: `{ email, password }`
4. Przy sukcesie (201):
   - Automatyczne zalogowanie przez Supabase (sesja w cookies)
   - Przekierowanie na `/survey` (pierwsza ankieta)
5. Przy błędzie:
   - 400: Wyświetlenie błędów walidacji z API
   - 409: Wyświetlenie "Użytkownik już istnieje"
   - 500: Wyświetlenie błędu ogólnego

**Elementy UI**:
- Input type="email" dla adresu email
- Input type="password" dla hasła
- Input type="password" dla potwierdzenia hasła
- Button typu submit z tekstem "Zarejestruj się"
- Spinner/disabled state podczas submitting
- Link do strony logowania: "Masz już konto? Zaloguj się"

#### LoginForm (`src/components/auth/LoginForm.tsx`)
**Odpowiedzialność**: Formularz logowania użytkownika

**Stan komponentu**:
```typescript
interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}
```

**Walidacja client-side**:
- Email: format email, wymagane
- Hasło: wymagane

**Komunikaty błędów**:
- Email nieprawidłowy: "Podaj prawidłowy adres email"
- Pola puste: "To pole jest wymagane"
- Błędne dane (z API): "Nieprawidłowy email lub hasło"
- Błąd sieciowy: "Wystąpił błąd podczas logowania. Spróbuj ponownie."

**Przebieg akcji**:
1. Użytkownik wypełnia formularz (email, hasło)
2. Po kliknięciu "Zaloguj się" - walidacja client-side
3. Jeśli walidacja OK - wywołanie `POST /api/auth/login` z body: `{ email, password }`
4. Przy sukcesie (200):
   - Sesja zapisana w cookies przez Supabase
   - Przekierowanie na `/dashboard`
5. Przy błędzie:
   - 400: Wyświetlenie błędów walidacji
   - 401: Wyświetlenie "Nieprawidłowy email lub hasło"
   - 500: Wyświetlenie błędu ogólnego

**Elementy UI**:
- Input type="email" dla adresu email
- Input type="password" dla hasła
- Button typu submit z tekstem "Zaloguj się"
- Spinner/disabled state podczas submitting
- Link do resetowania hasła: "Zapomniałem hasła"
- Link do rejestracji: "Nie masz konta? Zarejestruj się"

#### ForgotPasswordForm (`src/components/auth/ForgotPasswordForm.tsx`)
**Odpowiedzialność**: Formularz żądania resetowania hasła

**Stan komponentu**:
```typescript
interface ForgotPasswordFormState {
  email: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  errors: {
    email?: string;
    general?: string;
  };
}
```

**Walidacja client-side**:
- Email: format email, wymagane

**Komunikaty**:
- Sukces: "Jeśli podany adres email istnieje w systemie, wysłaliśmy na niego link do resetowania hasła. Sprawdź swoją skrzynkę."
- Email nieprawidłowy: "Podaj prawidłowy adres email"
- Błąd sieciowy: "Wystąpił błąd. Spróbuj ponownie."
- UWAGA: Komunikat sukcesu nie ujawnia, czy email istnieje w systemie (security best practice)

**Przebieg akcji**:
1. Użytkownik wpisuje email
2. Po kliknięciu "Wyślij link resetujący" - walidacja client-side
3. Jeśli walidacja OK - wywołanie `POST /api/auth/forgot-password` z body: `{ email }`
4. Przy sukcesie (200):
   - Wyświetlenie komunikatu sukcesu
   - Ukrycie formularza lub pokazanie tylko komunikatu
5. Przy błędzie:
   - 400: Wyświetlenie błędów walidacji
   - 500: Wyświetlenie błędu ogólnego
   - UWAGA: Nawet jeśli email nie istnieje, zwracamy 200 (security best practice - nie ujawniamy, czy email jest w systemie)

**Elementy UI**:
- Input type="email" dla adresu email
- Button typu submit z tekstem "Wyślij link resetujący"
- Spinner/disabled state podczas submitting
- Komunikat sukcesu (po wysłaniu)
- Link powrotny: "Powrót do logowania"

#### ResetPasswordForm (`src/components/auth/ResetPasswordForm.tsx`)
**Odpowiedzialność**: Formularz ustawiania nowego hasła po otrzymaniu linku resetującego

**Stan komponentu**:
```typescript
interface ResetPasswordFormState {
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  errors: {
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
  token: string | null; // z URL
}
```

**Walidacja client-side**:
- Hasło: min. 8 znaków, wymagane
- Potwierdzenie hasła: musi być identyczne z hasłem

**Komunikaty błędów**:
- Hasło za krótkie: "Hasło musi mieć co najmniej 8 znaków"
- Hasła różne: "Hasła muszą być identyczne"
- Token nieważny (z API): "Link resetujący wygasł lub jest nieprawidłowy. Poproś o nowy."
- Błąd sieciowy: "Wystąpił błąd. Spróbuj ponownie."

**Przebieg akcji**:
1. Użytkownik przechodzi na stronę z linku resetującego (zawiera token w URL)
2. Komponent pobiera token z URL (useEffect przy montowaniu)
3. Użytkownik wpisuje nowe hasło i potwierdza
4. Po kliknięciu "Zmień hasło" - walidacja client-side
5. Jeśli walidacja OK - wywołanie `POST /api/auth/reset-password` z body: `{ token, password }`
6. Przy sukcesie (200):
   - Wyświetlenie komunikatu sukcesu
   - Automatyczne przekierowanie na `/auth/login` po 3 sekundach
7. Przy błędzie:
   - 400: Wyświetlenie błędów walidacji lub "Token nieprawidłowy"
   - 500: Wyświetlenie błędu ogólnego

**Elementy UI**:
- Input type="password" dla nowego hasła
- Input type="password" dla potwierdzenia hasła
- Button typu submit z tekstem "Zmień hasło"
- Spinner/disabled state podczas submitting
- Komunikat sukcesu z informacją o przekierowaniu

### 1.3. Aktualizacja komponentu Navbar

**Lokalizacja**: `src/components/navigation/Navbar.astro`

**Wymagane zmiany**:
- Zamienić formularze wylogowania (`<form action="/api/auth/signout" method="post">`) na wywołanie endpoint API
- Endpoint wylogowania: `POST /api/auth/signout`
- Po pomyślnym wylogowaniu (200) - przekierowanie na `/auth/login` (strona logowania)
- Dodać obsługę błędów (toast notification lub fallback)

**Alternatywnie**: Można stworzyć komponent React `<LogoutButton>` dla lepszej kontroli nad UX

### 1.4. Aktualizacja middleware dla stron chronionych

**Lokalizacja**: `src/middleware/index.ts`

**Aktualne zachowanie**:
- Sprawdza sesję użytkownika przez `auth.getUser()`
- Przekierowuje zalogowanych z `/` na `/dashboard`

**Wymagane rozszerzenie**:
- Dodać listę stron publicznych (whitelist): `/`, `/auth/signup`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`
- Dla wszystkich innych stron (dashboard, profile, survey) - wymagać autentykacji
- Jeśli użytkownik niezalogowany próbuje dostać się na chronioną stronę - redirect na `/auth/login`
- Jeśli użytkownik zalogowany próbuje dostać się na stronę auth - redirect na `/dashboard`

**Logika middleware** (pseudokod):
```typescript
const publicPaths = ['/', '/auth/signup', '/auth/login', '/auth/forgot-password', '/auth/reset-password'];
const authPaths = ['/auth/signup', '/auth/login', '/auth/forgot-password', '/auth/reset-password'];
const currentPath = context.url.pathname;

const { data: { user } } = await context.locals.supabase.auth.getUser();

// Zalogowany użytkownik na stronie auth -> redirect na dashboard
if (user && authPaths.includes(currentPath)) {
  return context.redirect('/dashboard');
}

// Zalogowany użytkownik na landing page -> redirect na dashboard (obecne)
if (user && currentPath === '/') {
  return context.redirect('/dashboard');
}

// Niezalogowany użytkownik próbuje dostać się na chronioną stronę
if (!user && !publicPaths.includes(currentPath)) {
  return context.redirect('/auth/login');
}

return next();
```

### 1.5. Scenariusze użytkownika

#### US-001: Rejestracja nowego użytkownika

**Happy path**:
1. Użytkownik odwiedza landing page (`/`)
2. Klika "Zacznij za darmo" -> przekierowanie na `/auth/signup`
3. Wypełnia formularz: email, hasło, potwierdzenie hasła
4. Klika "Zarejestruj się"
5. System:
   - Waliduje dane client-side
   - Wysyła POST do `/api/auth/signup`
   - Supabase tworzy użytkownika i automatycznie loguje (sesja w cookies)
6. Użytkownik przekierowany na `/survey` (pierwsza ankieta)

**Error paths**:
- Email już istnieje -> wyświetlenie błędu "Użytkownik o podanym adresie email już istnieje"
- Hasła nie pasują -> walidacja client-side, komunikat "Hasła muszą być identyczne"
- Błąd sieciowy -> komunikat "Wystąpił błąd podczas rejestracji. Spróbuj ponownie."

#### US-002: Logowanie do systemu

**Happy path**:
1. Użytkownik odwiedza `/auth/login` (lub jest przekierowany z chronionej strony)
2. Wypełnia formularz: email, hasło
3. Klika "Zaloguj się"
4. System:
   - Waliduje dane client-side
   - Wysyła POST do `/api/auth/login`
   - Supabase weryfikuje credentials i tworzy sesję (cookies)
5. Użytkownik przekierowany na `/dashboard`

**Error paths**:
- Błędny email lub hasło -> wyświetlenie błędu "Nieprawidłowy email lub hasło"
- Błąd sieciowy -> komunikat "Wystąpił błąd podczas logowania. Spróbuj ponownie."

#### US-003: Wylogowanie z systemu

**Happy path**:
1. Zalogowany użytkownik klika przycisk "Wyloguj się" w Navbar (desktop) lub BottomNav (mobile)
2. System:
   - Wysyła POST do `/api/auth/signout`
   - Supabase niszczy sesję
3. Użytkownik przekierowany na `/auth/login` (strona logowania)

**Error paths**:
- Błąd sieciowy -> toast notification z błędem, użytkownik pozostaje zalogowany

#### US-004: Resetowanie hasła

**Happy path (krok 1 - żądanie)**:
1. Użytkownik klika "Zapomniałeś hasła?" na stronie logowania
2. Przechodzi na `/auth/forgot-password`
3. Wpisuje swój email
4. Klika "Wyślij link resetujący"
5. System:
   - Waliduje email client-side
   - Wysyła POST do `/api/auth/forgot-password`
   - Supabase wysyła email z linkiem resetującym
6. Wyświetlenie komunikatu: "Link do zresetowania hasła został wysłany na podany adres email"

**Happy path (krok 2 - zmiana hasła)**:
1. Użytkownik klika link w emailu
2. Zostaje przekierowany na `/auth/reset-password?token=XYZ`
3. Wpisuje nowe hasło i potwierdza
4. Klika "Zmień hasło"
5. System:
   - Waliduje hasła client-side
   - Wysyła POST do `/api/auth/reset-password` z tokenem i nowym hasłem
   - Supabase weryfikuje token i aktualizuje hasło
6. Wyświetlenie komunikatu sukcesu
7. Automatyczne przekierowanie na `/auth/login` po 3 sekundach

**Error paths**:
- Token wygasł/nieprawidłowy -> komunikat "Link resetujący wygasł lub jest nieprawidłowy. Poproś o nowy."
- Błąd sieciowy -> standardowy komunikat błędu

---

## 2. LOGIKA BACKENDOWA

### 2.1. Struktura endpointów API

Wszystkie endpointy autentykacji znajdują się w `src/pages/api/auth/`

#### POST /api/auth/signup
**Lokalizacja**: `src/pages/api/auth/signup.ts`

**Odpowiedzialność**: Rejestracja nowego użytkownika

**Request body**:
```typescript
{
  email: string;
  password: string;
}
```

**Walidacja (server-side przez Zod)**:
```typescript
const signupSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków")
});
```

**Logika**:
1. Parsowanie i walidacja body przez Zod
2. Wywołanie `context.locals.supabase.auth.signUp({ email, password })`
3. Jeśli sukces:
   - Supabase automatycznie tworzy sesję (cookies)
   - Zwrócenie 201 Created z danymi użytkownika
4. Jeśli błąd:
   - Email już istnieje -> 409 Conflict
   - Inne błędy Supabase -> 500 Internal Server Error

**Response (sukces - 201)**:
```typescript
{
  data: {
    user: {
      id: string;
      email: string;
      created_at: string;
    }
  }
}
```

**Response (błąd - 409)**:
```typescript
{
  error: {
    message: "Użytkownik o podanym adresie email już istnieje",
    code: "USER_ALREADY_EXISTS"
  }
}
```

**Response (błąd - 400)**:
```typescript
{
  error: {
    message: "Błąd walidacji",
    details: [
      { field: "email", message: "Nieprawidłowy format email" },
      { field: "password", message: "Hasło musi mieć co najmniej 8 znaków" }
    ]
  }
}
```

**Konfiguracja**:
```typescript
export const prerender = false;
```

#### POST /api/auth/login
**Lokalizacja**: `src/pages/api/auth/login.ts`

**Odpowiedzialność**: Logowanie użytkownika

**Request body**:
```typescript
{
  email: string;
  password: string;
}
```

**Walidacja (server-side przez Zod)**:
```typescript
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane")
});
```

**Logika**:
1. Parsowanie i walidacja body przez Zod
2. Wywołanie `context.locals.supabase.auth.signInWithPassword({ email, password })`
3. Jeśli sukces:
   - Supabase automatycznie tworzy sesję (cookies)
   - Zwrócenie 200 OK z danymi użytkownika
4. Jeśli błąd:
   - Nieprawidłowe credentials -> 401 Unauthorized
   - Inne błędy Supabase -> 500 Internal Server Error

**Response (sukces - 200)**:
```typescript
{
  data: {
    user: {
      id: string;
      email: string;
    }
  }
}
```

**Response (błąd - 401)**:
```typescript
{
  error: {
    message: "Nieprawidłowy email lub hasło",
    code: "INVALID_CREDENTIALS"
  }
}
```

**Konfiguracja**:
```typescript
export const prerender = false;
```

#### POST /api/auth/signout
**Lokalizacja**: `src/pages/api/auth/signout.ts`

**Odpowiedzialność**: Wylogowanie użytkownika

**Request body**: brak (lub pusty)

**Logika**:
1. Wywołanie `context.locals.supabase.auth.signOut()`
2. Supabase niszczy sesję i czyści cookies
3. Zwrócenie 200 OK

**Response (sukces - 200)**:
```typescript
{
  data: {
    message: "Wylogowano pomyślnie"
  }
}
```

**Response (błąd - 500)**:
```typescript
{
  error: {
    message: "Wystąpił błąd podczas wylogowywania"
  }
}
```

**Konfiguracja**:
```typescript
export const prerender = false;
```

#### POST /api/auth/forgot-password
**Lokalizacja**: `src/pages/api/auth/forgot-password.ts`

**Odpowiedzialność**: Wysłanie emaila z linkiem resetującym hasło

**Request body**:
```typescript
{
  email: string;
}
```

**Walidacja (server-side przez Zod)**:
```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email")
});
```

**Logika**:
1. Parsowanie i walidacja body przez Zod
2. Wywołanie `context.locals.supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://domain.com/auth/reset-password' })`
3. Supabase wysyła email z linkiem zawierającym token
4. ZAWSZE zwracamy 200 OK (nawet jeśli email nie istnieje - security best practice)

**Response (sukces - 200)**:
```typescript
{
  data: {
    message: "Jeśli podany adres email istnieje w systemie, wysłaliśmy na niego link do resetowania hasła"
  }
}
```

**UWAGA**: Nie ujawniamy, czy email istnieje w systemie (zapobiega enumeracji użytkowników)

**Konfiguracja redirectTo**:
- Dla development: `http://localhost:3000/auth/reset-password`
- Dla production: `https://athletica.com/auth/reset-password`
- Można odczytać z `import.meta.env.PUBLIC_APP_URL` lub konstruować z `Astro.url.origin`

**Konfiguracja**:
```typescript
export const prerender = false;
```

#### POST /api/auth/reset-password
**Lokalizacja**: `src/pages/api/auth/reset-password.ts`

**Odpowiedzialność**: Zmiana hasła na podstawie tokenu z emaila

**Request body**:
```typescript
{
  token: string;
  password: string;
}
```

**Walidacja (server-side przez Zod)**:
```typescript
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token jest wymagany"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków")
});
```

**Logika**:
1. Parsowanie i walidacja body przez Zod
2. Wywołanie `context.locals.supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })`
3. Jeśli token poprawny - wywołanie `context.locals.supabase.auth.updateUser({ password })`
4. Zwrócenie 200 OK

**Response (sukces - 200)**:
```typescript
{
  data: {
    message: "Hasło zostało zmienione pomyślnie"
  }
}
```

**Response (błąd - 400)**:
```typescript
{
  error: {
    message: "Link resetujący wygasł lub jest nieprawidłowy",
    code: "INVALID_TOKEN"
  }
}
```

**Konfiguracja**:
```typescript
export const prerender = false;
```

### 2.2. Serwisy pomocnicze

#### AuthService (`src/lib/services/auth.service.ts`)
**Odpowiedzialność**: Logika biznesowa związana z autentykacją (opcjonalnie, dla enkapsulacji)

**Metody**:
```typescript
class AuthService {
  async signup(email: string, password: string, supabase: SupabaseClient): Promise<User>;
  async login(email: string, password: string, supabase: SupabaseClient): Promise<User>;
  async signout(supabase: SupabaseClient): Promise<void>;
  async requestPasswordReset(email: string, redirectTo: string, supabase: SupabaseClient): Promise<void>;
  async resetPassword(token: string, newPassword: string, supabase: SupabaseClient): Promise<void>;
}
```

**Uwaga**: W MVP można pominąć ten serwis i wywoływać Supabase API bezpośrednio w endpointach. Serwis będzie przydatny przy rozbudowie (np. dodawanie logów, analityki, integracji zewnętrznych).

### 2.3. Walidacja i obsługa błędów

#### Zod schemas (`src/lib/validation/auth.schemas.ts`)
**Odpowiedzialność**: Centralne definicje schematów walidacji dla endpointów auth

```typescript
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków")
});

export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token jest wymagany"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków")
});
```

#### Standardowe odpowiedzi błędów

**Wykorzystanie istniejącego modułu**: `src/lib/api/responses.ts`

Prawdopodobnie istnieją już funkcje helper do generowania odpowiedzi. Należy je wykorzystać:
- `errorResponse(message: string, status: number, code?: string)` -> JSON error response
- `successResponse(data: any)` -> JSON success response

**Mapowanie błędów Supabase**:
```typescript
// Przykładowa funkcja helper
function mapSupabaseAuthError(error: AuthError): { message: string; code: string; status: number } {
  switch (error.message) {
    case 'User already registered':
      return { message: 'Użytkownik o podanym adresie email już istnieje', code: 'USER_ALREADY_EXISTS', status: 409 };
    case 'Invalid login credentials':
      return { message: 'Nieprawidłowy email lub hasło', code: 'INVALID_CREDENTIALS', status: 401 };
    case 'Email not confirmed':
      return { message: 'Email nie został potwierdzony', code: 'EMAIL_NOT_CONFIRMED', status: 401 };
    default:
      return { message: 'Wystąpił błąd podczas operacji', code: 'UNKNOWN_ERROR', status: 500 };
  }
}
```

### 2.4. Aktualizacja sposobu renderowania stron

**Obecna konfiguracja** (`astro.config.mjs`):
- `output: "server"` - SSR mode włączony globalnie
- `adapter: node({ mode: "standalone" })` - standalone server

**Wymagane zmiany**:
- Wszystkie nowe strony auth (`/auth/*`) muszą mieć `export const prerender = false`
- Wszystkie endpointy API (`/api/auth/*`) muszą mieć `export const prerender = false`
- Middleware będzie działał dla wszystkich requestów dzięki SSR

**Brak zmian w config** - obecna konfiguracja jest odpowiednia dla modułu auth.

---

## 3. SYSTEM AUTENTYKACJI

### 3.1. Wykorzystanie Supabase Auth

#### Konfiguracja Supabase Client

**Obecna konfiguracja** (`src/db/supabase.client.ts`):
- Standard client z anon key (enforces RLS)
- Service role client dla development (bypasses RLS)
- Środowiskowe zmienne: `SUPABASE_URL`, `SUPABASE_KEY`

**Wymagane rozszerzenie**:
Konfiguracja Supabase Auth do obsługi sesji w cookies (już zaimplementowane w middleware):
- Sesje są automatycznie zarządzane przez Supabase SDK
- Cookies są ustawiane przez Supabase po `signUp()` i `signInWithPassword()`
- `auth.getUser()` weryfikuje sesję na podstawie cookies

#### Przepływ autentykacji

**Rejestracja (signUp)**:
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
// Supabase:
// 1. Tworzy użytkownika w auth.users
// 2. Automatycznie loguje (tworzy sesję)
// 3. Ustawia cookies (access_token, refresh_token)
```

**Logowanie (signInWithPassword)**:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
// Supabase:
// 1. Weryfikuje credentials
// 2. Tworzy sesję
// 3. Ustawia cookies (access_token, refresh_token)
```

**Weryfikacja sesji (getUser)**:
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
// Supabase:
// 1. Odczytuje access_token z cookies
// 2. Weryfikuje token
// 3. Zwraca dane użytkownika lub null
```

**Wylogowanie (signOut)**:
```typescript
const { error } = await supabase.auth.signOut();
// Supabase:
// 1. Niszczy sesję server-side
// 2. Czyści cookies (access_token, refresh_token)
```

**Reset hasła (resetPasswordForEmail)**:
```typescript
const { error } = await supabase.auth.resetPasswordForEmail('user@example.com', {
  redirectTo: 'https://app.com/auth/reset-password'
});
// Supabase:
// 1. Generuje recovery token
// 2. Wysyła email z linkiem zawierającym token
// 3. Link: https://app.com/auth/reset-password?token_hash=XYZ&type=recovery
```

**Weryfikacja tokenu i zmiana hasła**:
```typescript
// Krok 1: Weryfikacja tokenu
const { data, error } = await supabase.auth.verifyOtp({
  token_hash: tokenFromUrl,
  type: 'recovery'
});

// Krok 2: Aktualizacja hasła
const { data, error } = await supabase.auth.updateUser({
  password: 'newPassword123'
});
```

### 3.2. Middleware - ochrona stron

**Lokalizacja**: `src/middleware/index.ts`

**Obecna funkcjonalność**:
- Wstrzykuje Supabase client do `context.locals.supabase`
- Obsługuje SKIP_AUTH dla developmentu
- Przekierowuje zalogowanych z `/` na `/dashboard`

**Rozszerzenie - pełna ochrona**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient, supabaseServiceClient } from "../db/supabase.client.ts";

const PUBLIC_PATHS = [
  '/',
  '/auth/signup',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email'
];

const AUTH_PATHS = [
  '/auth/signup',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password'
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Use service role client when SKIP_AUTH is enabled (bypasses RLS for development)
  const skipAuth = import.meta.env.SKIP_AUTH === "true";
  context.locals.supabase = skipAuth ? supabaseServiceClient : supabaseClient;

  // Get current path
  const currentPath = context.url.pathname;

  // Skip auth check for API routes (they handle auth internally)
  if (currentPath.startsWith('/api/')) {
    return next();
  }

  // Get user session
  const {
    data: { user },
    error,
  } = await context.locals.supabase.auth.getUser();

  if (error) {
    console.error("Auth check error:", error);
  }

  // Redirect authenticated users from auth pages to dashboard
  if (user && AUTH_PATHS.includes(currentPath)) {
    return context.redirect("/dashboard");
  }

  // Redirect authenticated users from landing page to dashboard
  if (user && currentPath === "/") {
    return context.redirect("/dashboard");
  }

  // Redirect unauthenticated users from protected pages to login
  if (!user && !PUBLIC_PATHS.includes(currentPath)) {
    return context.redirect("/auth/login");
  }

  return next();
});
```

**Logika decyzyjna**:
1. **API routes** (`/api/*`) - pomijamy middleware, auth sprawdzany wewnątrz endpointu
2. **Zalogowany + auth page** (`/auth/*`) -> redirect na `/dashboard`
3. **Zalogowany + landing page** (`/`) -> redirect na `/dashboard`
4. **Niezalogowany + protected page** (dowolna poza PUBLIC_PATHS) -> redirect na `/auth/login`
5. **Niezalogowany + public page** -> przepuść
6. **Zalogowany + protected page** -> przepuść

### 3.3. Aktualizacja istniejących stron chronionych

#### dashboard.astro, profile.astro, survey.astro

**Obecna logika**:
Strony te już używają sprawdzania auth i przekierowują na `/auth/login` przy 401 z API.

**Wymagane zmiany**:
- Middleware będzie automatycznie przekierowywał niezalogowanych na `/auth/login`
- Można uprościć kod stron - usunąć ręczne sprawdzanie i redirecty
- Server-side fetch do API będzie automatycznie zawierał cookies sesji

**Przykład - uproszczona wersja dashboard.astro**:
```astro
---
// Middleware już sprawdził auth - user istnieje
// Nie trzeba robić ręcznego redirect na /auth/login

const response = await fetch(`${Astro.url.origin}/api/training-plans/active`, {
  headers: {
    Cookie: Astro.request.headers.get("Cookie") || "",
  },
});

// Obsługa tylko stanów 200 i 404
if (response.ok) {
  // ...
} else if (response.status === 404) {
  // ...
}
// 401 nie powinien się zdarzyć (middleware już sprawdził)
---
```

### 3.4. Aktualizacja API endpoints (verifyAuth)

**Lokalizacja**: `src/lib/api/auth.ts`

**Obecna funkcja**:
```typescript
export async function verifyAuth(context: APIContext) {
  if (import.meta.env.SKIP_AUTH === "true") {
    return { user: mockUser, error: false };
  }

  const { data: { user }, error } = await context.locals.supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: true };
  }

  return { user, error: false };
}
```

**Brak zmian potrzebnych** - funkcja działa poprawnie i jest już używana w istniejących endpointach API.

Wszystkie chronione endpointy (`/api/profile`, `/api/training-plans/*`, etc.) używają `verifyAuth()` i zwracają 401 przy braku autoryzacji. To zachowanie jest poprawne.

### 3.5. Konfiguracja Supabase Auth (Dashboard)

#### Email Templates
Supabase pozwala na konfigurację szablonów emaili w Dashboard -> Authentication -> Email Templates

**Wymagane szablony**:
1. **Confirmation** (opcjonalnie) - email weryfikacyjny po rejestracji
   - W MVP można wyłączyć weryfikację email (Settings -> Auth -> Enable email confirmations = OFF)
2. **Password Reset** - email z linkiem resetującym hasło
   - Customizować template z polskim tekstem
   - Link: `{{ .ConfirmationURL }}`
   - Redirect URL: `https://app.com/auth/reset-password`

#### Auth Settings
**Settings -> Authentication**:
- **Enable email confirmations**: OFF (dla MVP - użytkownik od razu aktywny)
  - Alternatywnie ON - wtedy dodać stronę `/auth/verify-email` i obsługę email confirmation
- **Enable sign ups**: ON
- **Site URL**: `https://athletica.com` (production) lub `http://localhost:3000` (dev)
- **Redirect URLs** (whitelist):
  - `http://localhost:3000/auth/reset-password`
  - `https://athletica.com/auth/reset-password`

#### Password Requirements
- Minimum length: 8 characters (zgodne z walidacją w aplikacji)

### 3.6. Zmienne środowiskowe

**`.env` file**:
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx.anon.key
SUPABASE_SERVICE_ROLE_KEY=xxx.service_role.key  # tylko dla dev z SKIP_AUTH

# Auth
SKIP_AUTH=false  # tylko development!

# App URLs (dla redirectów)
PUBLIC_APP_URL=http://localhost:3000  # dev
# PUBLIC_APP_URL=https://athletica.com  # production
```

**`.env.example`** - dodać nowe zmienne:
```bash
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

SKIP_AUTH=false

PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. STRUKTURA PLIKÓW - PODSUMOWANIE

```
src/
├── pages/
│   ├── index.astro                          # Landing page (aktualizacja linku)
│   ├── dashboard.astro                      # Protected (uproszczenie - middleware sprawdza auth)
│   ├── profile.astro                        # Protected (uproszczenie - middleware sprawdza auth)
│   ├── survey.astro                         # Protected (uproszczenie - middleware sprawdza auth)
│   ├── auth/
│   │   ├── signup.astro                     # [NOWY] Strona rejestracji
│   │   ├── login.astro                      # [NOWY] Strona logowania
│   │   ├── forgot-password.astro            # [NOWY] Strona żądania resetu hasła
│   │   ├── reset-password.astro             # [NOWY] Strona ustawiania nowego hasła
│   │   └── verify-email.astro               # [OPCJONALNY] Strona informacji o weryfikacji
│   └── api/
│       └── auth/
│           ├── signup.ts                    # [NOWY] POST - rejestracja
│           ├── login.ts                     # [NOWY] POST - logowanie
│           ├── signout.ts                   # [NOWY] POST - wylogowanie
│           ├── forgot-password.ts           # [NOWY] POST - żądanie resetu hasła
│           └── reset-password.ts            # [NOWY] POST - reset hasła z tokenem
├── components/
│   ├── auth/                                # [NOWY KATALOG]
│   │   ├── SignupForm.tsx                   # [NOWY] Formularz rejestracji
│   │   ├── LoginForm.tsx                    # [NOWY] Formularz logowania
│   │   ├── ForgotPasswordForm.tsx           # [NOWY] Formularz żądania resetu
│   │   ├── ResetPasswordForm.tsx            # [NOWY] Formularz zmiany hasła
│   │   └── LogoutButton.tsx                 # [OPCJONALNY] Przycisk wylogowania
│   └── navigation/
│       ├── Navbar.astro                     # Aktualizacja - link do wylogowania
│       └── BottomNav.tsx                    # Aktualizacja - link do wylogowania
├── lib/
│   ├── api/
│   │   ├── auth.ts                          # Istniejący - verifyAuth() (bez zmian)
│   │   └── responses.ts                     # Istniejący - helper responses (bez zmian)
│   ├── services/
│   │   └── auth.service.ts                  # [OPCJONALNY] Service layer dla auth
│   └── validation/
│       └── auth.schemas.ts                  # [NOWY] Zod schemas dla auth
├── middleware/
│   └── index.ts                             # Aktualizacja - pełna ochrona stron
└── db/
    ├── supabase.client.ts                   # Istniejący (bez zmian)
    └── database.types.ts                    # Istniejący (bez zmian)

.env                                         # Aktualizacja - dodać PUBLIC_APP_URL
.env.example                                 # Aktualizacja - dodać PUBLIC_APP_URL
```

---

## 5. KONTRAKT TYPÓW

### 5.1. Request/Response DTOs

```typescript
// src/types/auth.types.ts

// ============================================================================
// Request DTOs
// ============================================================================

export interface SignupRequestDTO {
  email: string;
  password: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordRequestDTO {
  token: string;
  password: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface AuthUserDTO {
  id: string;
  email: string;
  created_at?: string;
}

export interface SignupResponseDTO {
  user: AuthUserDTO;
}

export interface LoginResponseDTO {
  user: AuthUserDTO;
}

export interface SignoutResponseDTO {
  message: string;
}

export interface ForgotPasswordResponseDTO {
  message: string;
}

export interface ResetPasswordResponseDTO {
  message: string;
}

// ============================================================================
// Error DTOs (wykorzystanie istniejących z types.ts)
// ============================================================================

// Już zdefiniowane w src/types.ts:
// - ApiErrorResponse
// - ValidationErrorDetail
// - ApiSuccessResponse<T>

```

### 5.2. Komponenty Props

```typescript
// src/components/auth/types.ts

export interface SignupFormProps {
  // Brak props - standalone component
}

export interface LoginFormProps {
  // Brak props - standalone component
}

export interface ForgotPasswordFormProps {
  // Brak props - standalone component
}

export interface ResetPasswordFormProps {
  // Brak props - standalone component (token z URL)
}

export interface LogoutButtonProps {
  onLogoutStart?: () => void;
  onLogoutSuccess?: () => void;
  onLogoutError?: (error: Error) => void;
}
```

---

## 6. INTEGRACJA Z ISTNIEJĄCYM KODEM

### 6.1. Brak wpływu na istniejące funkcjonalności

**Moduł auth jest addytywny** - nie modyfikuje istniejącego flow aplikacji:
- Survey generation nadal działa tak samo
- Dashboard rendering nie zmienia się
- Profile view pozostaje bez zmian
- API endpoints (`/api/training-plans/*`, `/api/workout-days/*`) działają bez zmian

**Jedyna zmiana**: Middleware dodaje automatyczne przekierowania dla niezalogowanych użytkowników

### 6.2. Punkty integracji

1. **Landing page** (`/`) - aktualizacja linku CTA na `/auth/signup`
2. **Navbar** - aktualizacja przycisku wylogowania na endpoint `/api/auth/signout`
3. **BottomNav** - aktualizacja przycisku wylogowania (jeśli istnieje)
4. **Middleware** - rozszerzenie logiki o ochronę wszystkich stron
5. **Protected pages** - uproszczenie (usunięcie redundantnych sprawdzeń auth)

### 6.3. Backward compatibility

**SKIP_AUTH mode** - pozostaje bez zmian:
- Development może nadal używać `SKIP_AUTH=true`
- Mock user pozostaje taki sam
- RLS bypass działa tak samo

**Sesja w cookies**:
- Supabase automatycznie zarządza cookies
- Nie ma konfliktu z istniejącym kodem (kod nie używa custom cookies auth)

---

## 7. SECURITY CONSIDERATIONS

### 7.1. Row Level Security (RLS)

**Obecny stan**: RLS włączony dla wszystkich tabel w bazie (`profiles`, `personal_records`, `training_plans`, `workout_days`)

**Auth integration**:
- Polityki RLS używają `auth.uid()` do weryfikacji dostępu
- Supabase automatycznie ustawia `auth.uid()` na podstawie sesji użytkownika
- Po zalogowaniu przez `signInWithPassword()` lub `signUp()`, wszystkie zapytania do bazy będą miały poprawny `auth.uid()`

**Brak dodatkowych zmian** - RLS już zabezpiecza dane użytkowników

### 7.2. CSRF Protection

**Supabase Auth** automatycznie zabezpiecza przed CSRF:
- Używa HTTP-only cookies dla session tokens
- Access token jest weryfikowany server-side
- Brak potrzeby implementacji własnych tokenów CSRF

### 7.3. Rate Limiting

**Supabase Auth** ma wbudowane rate limiting:
- Domyślnie: max 4 próby logowania na email per hour
- Można skonfigurować w Dashboard -> Authentication -> Rate Limits

**Dla production**: Rozważyć dodatkowe rate limiting na poziomie API (middleware lub Nginx/CloudFlare)

### 7.4. Password Security

**Supabase** automatycznie:
- Hashuje hasła (bcrypt)
- Wymusza minimum 6 znaków (ale my wymuszamy 8 w walidacji)
- Nie przechowuje plaintext passwords

### 7.5. Token Security

**Reset password tokens**:
- Generowane przez Supabase
- Jednokrotnego użytku
- Wygasają po określonym czasie (domyślnie 1 godzina)
- Przesyłane przez email (secure channel)

### 7.6. Information Disclosure

**Forgot password endpoint**:
- ZAWSZE zwraca 200 OK (nawet jeśli email nie istnieje)
- Zapobiega enumeracji użytkowników
- Security best practice

---

## 8. TESTOWANIE

### 8.1. Scenariusze testowe

#### US-001: Rejestracja
- [ ] Pomyślna rejestracja z poprawnymi danymi -> redirect na `/survey`
- [ ] Rejestracja z istniejącym emailem -> błąd 409
- [ ] Rejestracja z nieprawidłowym emailem -> błąd walidacji
- [ ] Rejestracja z hasłem < 8 znaków -> błąd walidacji
- [ ] Rejestracja z niezgodnymi hasłami -> błąd walidacji client-side

#### US-002: Logowanie
- [ ] Pomyślne logowanie z poprawnymi danymi -> redirect na `/dashboard`
- [ ] Logowanie z błędnym hasłem -> błąd 401
- [ ] Logowanie z nieistniejącym emailem -> błąd 401
- [ ] Logowanie z nieprawidłowym formatem email -> błąd walidacji

#### US-003: Wylogowanie
- [ ] Pomyślne wylogowanie -> redirect na `/auth/login`
- [ ] Wylogowanie usuwa sesję (sprawdzenie cookies)
- [ ] Po wylogowaniu brak dostępu do chronionych stron

#### US-004: Reset hasła
- [ ] Żądanie resetu z istniejącym emailem -> email wysłany
- [ ] Żądanie resetu z nieistniejącym emailem -> 200 OK (security)
- [ ] Zmiana hasła z prawidłowym tokenem -> sukces
- [ ] Zmiana hasła z wygasłym tokenem -> błąd 400
- [ ] Zmiana hasła z hasłem < 8 znaków -> błąd walidacji

#### Middleware
- [ ] Niezalogowany dostęp do `/dashboard` -> redirect na `/auth/login`
- [ ] Niezalogowany dostęp do `/survey` -> redirect na `/auth/login`
- [ ] Zalogowany dostęp do `/auth/login` -> redirect na `/dashboard`
- [ ] Zalogowany dostęp do `/` -> redirect na `/dashboard`
- [ ] Niezalogowany dostęp do `/` -> brak redirectu
- [ ] Niezalogowany dostęp do `/auth/signup` -> brak redirectu

### 8.2. Testy integracyjne

- [ ] Pełny flow rejestracji + wypełnienie ankiety + generowanie planu
- [ ] Pełny flow logowania + przeglądanie planu + wylogowanie
- [ ] Pełny flow resetu hasła + logowanie z nowym hasłem
- [ ] Weryfikacja RLS - użytkownik A nie ma dostępu do danych użytkownika B

---

## 9. DEPLOYMENT CHECKLIST

### 9.1. Environment Variables
- [ ] `SUPABASE_URL` ustawiony
- [ ] `SUPABASE_KEY` (anon key) ustawiony
- [ ] `PUBLIC_APP_URL` ustawiony na production URL
- [ ] `SKIP_AUTH=false` (NIGDY true w production!)

### 9.2. Supabase Configuration
- [ ] Email templates skonfigurowane (polski język)
- [ ] Redirect URLs whitelisted w Supabase Dashboard
- [ ] Site URL ustawiony poprawnie
- [ ] Email confirmations OFF (dla MVP) lub ON z obsługą verification
- [ ] Rate limiting skonfigurowany

### 9.3. Code Review
- [ ] Wszystkie endpointy auth mają `prerender = false`
- [ ] Wszystkie strony auth mają `prerender = false`
- [ ] Middleware poprawnie chroni strony
- [ ] Brak hardcoded URLs (używamy `PUBLIC_APP_URL` z env)
- [ ] Walidacja Zod na wszystkich endpointach
- [ ] Błędy Supabase są mapowane na user-friendly messages

### 9.4. Security Audit
- [ ] RLS włączony dla wszystkich tabel
- [ ] Passwords hashed (Supabase)
- [ ] Forgot password nie ujawnia, czy email istnieje
- [ ] CSRF protection (Supabase cookies)
- [ ] Rate limiting włączony

---

## 10. KOLEJNOŚĆ IMPLEMENTACJI

### Faza 1: Backend i API
1. Utworzyć katalog `src/pages/api/auth/`
2. Zaimplementować Zod schemas (`src/lib/validation/auth.schemas.ts`)
3. Zaimplementować endpointy API:
   - `signup.ts`
   - `login.ts`
   - `signout.ts`
   - `forgot-password.ts`
   - `reset-password.ts`
4. Przetestować endpointy (Postman/curl)

### Faza 2: Middleware i ochrona stron
1. Zaktualizować middleware (`src/middleware/index.ts`)
2. Uprościć istniejące protected pages (usunąć redundantne sprawdzenia)
3. Przetestować redirecty

### Faza 3: Frontend - komponenty React
1. Utworzyć katalog `src/components/auth/`
2. Zaimplementować komponenty formularzy:
   - `SignupForm.tsx`
   - `LoginForm.tsx`
   - `ForgotPasswordForm.tsx`
   - `ResetPasswordForm.tsx`
3. Dodać typy (`src/components/auth/types.ts`)

### Faza 4: Frontend - strony Astro
1. Utworzyć katalog `src/pages/auth/`
2. Zaimplementować strony:
   - `signup.astro`
   - `login.astro`
   - `forgot-password.astro`
   - `reset-password.astro`
3. Zaktualizować landing page (`/`) - zmiana linku CTA

### Faza 5: Nawigacja i wylogowanie
1. Zaktualizować `Navbar.astro` - przycisk wylogowania
2. Zaktualizować `BottomNav.tsx` - przycisk wylogowania (jeśli istnieje)

### Faza 6: Testy i polish
1. Przeprowadzić testy wszystkich scenariuszy
2. Poprawić UX (loading states, error messages)
3. Dodać animacje/transitions (opcjonalnie)
4. Code review

### Faza 7: Konfiguracja Supabase i deployment
1. Skonfigurować email templates w Supabase Dashboard
2. Skonfigurować redirect URLs
3. Ustawić zmienne środowiskowe w production
4. Deploy i smoke tests

---

## KONIEC SPECYFIKACJI
