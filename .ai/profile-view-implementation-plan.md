# Plan implementacji widoku Profilu Użytkownika

## 1. Przegląd

Widok profilu użytkownika to strona w trybie "tylko do odczytu", która wyświetla dane osobowe i treningowe użytkownika zebrane podczas ostatniego wypełnienia ankiety. Głównym celem jest umożliwienie użytkownikowi przeglądu swoich danych oraz łatwy dostęp do generowania nowego planu treningowego. Widok nie umożliwia bezpośredniej edycji danych - modyfikacja możliwa jest wyłącznie poprzez wygenerowanie nowego planu treningowego.

## 2. Routing widoku

Widok dostępny jest pod ścieżką: `/profile`

Jest to chroniona trasa (protected route) wymagająca autentykacji użytkownika. Middleware sprawdza sesję Supabase i w przypadku braku autentykacji przekierowuje użytkownika do `/auth/login`.

## 3. Struktura komponentów

```
profile.astro (Astro SSR page)
└── DashboardLayout.astro
    ├── ProfileView.tsx (React container)
    │   ├── TrainingGoalsCard.tsx
    │   ├── PersonalDataCard.tsx
    │   ├── PersonalRecordsCard.tsx
    │   └── ActionsCard.tsx
    │
    └── EmptyState.tsx (alternatywnie, gdy brak profilu)
```

## 4. Szczegóły komponentów

### 4.1. profile.astro (Astro Page)

**Opis komponentu:**
Główna strona profilu, renderowana po stronie serwera (SSR). Odpowiada za:

- Weryfikację autentykacji użytkownika
- Pobranie danych profilu z endpointu GET /api/profile
- Pobranie rekordów życiowych z endpointu GET /api/personal-records
- Przekazanie danych do komponentu React ProfileView
- Obsługę przypadków brzegowych (404, błędy sieciowe)

**Główne elementy:**

- Import `DashboardLayout.astro`
- Server-side fetch dla danych profilu i rekordów
- Warunkowo renderowany `ProfileView.tsx` lub `EmptyState.tsx`

**Obsługiwane zdarzenia:**

- Brak (SSR, brak interakcji client-side)

**Warunki walidacji:**

1. **Autentykacja:**
   - Sprawdzenie `context.locals.supabase.auth.getUser()`
   - Jeśli brak użytkownika → redirect `/auth/login`

2. **Istnienie profilu:**
   - Status code 200 z GET /api/profile → renderuj ProfileView
   - Status code 404 → renderuj EmptyState
   - Status code 401 → redirect `/auth/login` + toast "Sesja wygasła"
   - Status code 500 → wyświetl błąd + możliwość retry

**Typy:**

- `ProfileResponseDTO` - response z GET /api/profile
- `PersonalRecordsResponseDTO` - response z GET /api/personal-records (zakładając istnienie endpointu)
- `Profile` - typ entity profilu
- `PersonalRecord[]` - tablica rekordów życiowych

**Propsy:**
Brak (strona Astro, nie komponent)

---

### 4.2. ProfileView.tsx (React Component)

**Opis komponentu:**
Główny kontener React wyświetlający wszystkie dane profilu użytkownika. Organizuje layout i przekazuje odpowiednie dane do komponentów-dzieci (Cards). Renderowany po stronie klienta dla zachowania interaktywności.

**Główne elementy:**

- Grid/Flex container z responsive layoutem
- 4 komponenty Card:
  - `<TrainingGoalsCard />` - cele treningowe
  - `<PersonalDataCard />` - dane osobowe
  - `<PersonalRecordsCard />` - rekordy życiowe
  - `<ActionsCard />` - akcje użytkownika

**Obsługiwane zdarzenia:**

- Brak (komponent kontenerowy, przekazuje tylko dane)

**Warunki walidacji:**

- Brak (dane już zwalidowane przez API i SSR)

**Typy:**

```typescript
interface ProfileViewProps {
  profile: Profile;
  personalRecords: PersonalRecord[];
}
```

**Propsy:**

- `profile: Profile` - obiekt z danymi profilu użytkownika
- `personalRecords: PersonalRecord[]` - tablica rekordów życiowych

---

### 4.3. TrainingGoalsCard.tsx (React Component)

**Opis komponentu:**
Card wyświetlający cele treningowe użytkownika w formie listy definicji (definition list). Używa semantic HTML (dl, dt, dd) dla lepszej dostępności. Wszystkie dane wyświetlane są w trybie read-only.

**Główne elementy:**

- `Card` z Shadcn/ui
- `CardHeader` z tytułem "Cele treningowe"
- `CardContent` z definition list (`<dl>`)
  - Cel-dystans: wartość goal_distance
  - Średni tygodniowy kilometraż: wartość weekly_km + " km"
  - Liczba dni treningowych: wartość training_days_per_week + " dni/tydzień"

**Obsługiwane zdarzenia:**

- Brak (read-only display)

**Warunki walidacji:**

- Brak (dane już zwalidowane)

**Typy:**

```typescript
interface TrainingGoalsCardProps {
  goalDistance: GoalDistance;
  weeklyKm: number;
  trainingDaysPerWeek: number;
}
```

**Propsy:**

- `goalDistance: GoalDistance` - cel dystansowy ("5K" | "10K" | "Half Marathon" | "Marathon")
- `weeklyKm: number` - średni tygodniowy kilometraż
- `trainingDaysPerWeek: number` - liczba dni treningowych w tygodniu

---

### 4.4. PersonalDataCard.tsx (React Component)

**Opis komponentu:**
Card wyświetlający dane osobowe użytkownika (wiek, waga, wzrost, płeć) w formie listy definicji. Używa semantic HTML dla dostępności. Wyświetla wartości z odpowiednimi jednostkami.

**Główne elementy:**

- `Card` z Shadcn/ui
- `CardHeader` z tytułem "Dane osobowe"
- `CardContent` z definition list (`<dl>`)
  - Wiek: wartość age + " lat"
  - Waga: wartość weight + " kg"
  - Wzrost: wartość height + " cm"
  - Płeć: wartość gender (wyświetlane jako "Mężczyzna" / "Kobieta")

**Obsługiwane zdarzenia:**

- Brak (read-only display)

**Warunki walidacji:**

- Brak (dane już zwalidowane)

**Typy:**

```typescript
interface PersonalDataCardProps {
  age: number;
  weight: number;
  height: number;
  gender: Gender;
}
```

**Propsy:**

- `age: number` - wiek użytkownika w latach
- `weight: number` - waga w kg
- `height: number` - wzrost w cm
- `gender: Gender` - płeć ("M" | "F")

---

### 4.5. PersonalRecordsCard.tsx (React Component)

**Opis komponentu:**
Card wyświetlający listę rekordów życiowych użytkownika. Każdy rekord pokazuje dystans i czas w formacie czytelnym dla użytkownika (MM:SS lub HH:MM:SS). Jeśli brak rekordów, wyświetla komunikat informujący o tym.

**Główne elementy:**

- `Card` z Shadcn/ui
- `CardHeader` z tytułem "Rekordy życiowe"
- `CardContent`:
  - Jeśli `personalRecords.length > 0`: lista rekordów (`<ul>`)
    - Każdy rekord: `<li>` z formatem "Dystans: Czas" (np. "5K: 20:30")
  - Jeśli `personalRecords.length === 0`: komunikat "Brak rekordów życiowych"

**Obsługiwane zdarzenia:**

- Brak (read-only display)

**Warunki walidacji:**

- Sprawdzenie czy tablica personalRecords nie jest pusta
- Formatowanie czasu z sekund do MM:SS lub HH:MM:SS

**Typy:**

```typescript
interface PersonalRecordsCardProps {
  personalRecords: PersonalRecord[];
}
```

**Propsy:**

- `personalRecords: PersonalRecord[]` - tablica obiektów rekordów życiowych
  - Każdy `PersonalRecord` zawiera:
    - `id: string` - UUID rekordu
    - `user_id: string` - UUID użytkownika
    - `distance: RecordDistance` - dystans ("5K" | "10K" | "Half Marathon" | "Marathon")
    - `time_in_seconds: number` - czas w sekundach
    - `created_at: string` - data utworzenia

**Helper function:**

```typescript
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
```

---

### 4.6. ActionsCard.tsx (React Component)

**Opis komponentu:**
Card zawierający akcje dostępne dla użytkownika. Główną akcją jest przycisk "Wygeneruj nowy plan", który przekierowuje do strony ankiety z pre-filled danymi z obecnego profilu. Opcjonalnie może zawierać przycisk wylogowania (jeśli nie jest w navbar).

**Główne elementy:**

- `Card` z Shadcn/ui
- `CardHeader` z tytułem "Akcje"
- `CardContent` z przyciskami:
  - `Button` "Wygeneruj nowy plan" (primary)
  - Opcjonalnie: `Button` "Wyloguj się" (secondary/ghost)

**Obsługiwane zdarzenia:**

1. **Click "Wygeneruj nowy plan":**
   - Zapisanie danych profilu do sessionStorage pod kluczem 'surveyData'
   - Przekierowanie do `/survey`

2. **Click "Wyloguj się" (opcjonalnie):**
   - Wywołanie `supabase.auth.signOut()`
   - Przekierowanie do `/auth/login`
   - Toast notification "Wylogowano pomyślnie"

**Warunki walidacji:**

- Brak

**Typy:**

```typescript
interface ActionsCardProps {
  profile: Profile;
  personalRecords: PersonalRecord[];
}
```

**Propsy:**

- `profile: Profile` - dane profilu do pre-fill w ankiecie
- `personalRecords: PersonalRecord[]` - rekordy do pre-fill w ankiecie

---

### 4.7. EmptyState.tsx (React Component)

**Opis komponentu:**
Komponent wyświetlany gdy użytkownik nie ma jeszcze wypełnionego profilu (404 z GET /api/profile). Pokazuje przyjazny komunikat i call-to-action do wypełnienia ankiety.

**Główne elementy:**

- Container div z centrowaniem
- Ikona (np. User icon z lucide-react)
- Tekst: "Uzupełnij ankietę, aby rozpocząć"
- `Button` "Wypełnij ankietę"

**Obsługiwane zdarzenia:**

- Click "Wypełnij ankietę" → redirect `/survey`

**Warunki walidacji:**

- Brak

**Typy:**

```typescript
interface EmptyStateProps {
  variant: "no-profile" | "no-plan";
  message: string;
  ctaText: string;
  ctaLink: string;
}
```

**Propsy:**

- `variant: string` - typ empty state ("no-profile")
- `message: string` - komunikat do wyświetlenia
- `ctaText: string` - tekst na przycisku CTA
- `ctaLink: string` - link do przekierowania

---

## 5. Typy

### 5.1. Istniejące typy (z types.ts)

```typescript
// Entity - tabela profiles w bazie danych
export type Profile = {
  user_id: string; // UUID użytkownika (FK do auth.users)
  goal_distance: GoalDistance; // Cel dystansowy
  weekly_km: number; // Średni tygodniowy kilometraż
  training_days_per_week: number; // Liczba dni treningowych (2-7)
  age: number; // Wiek w latach (1-119)
  weight: number; // Waga w kg (0-300)
  height: number; // Wzrost w cm (0-300)
  gender: Gender; // Płeć
  created_at: string; // Data utworzenia (ISO 8601)
  updated_at: string; // Data ostatniej aktualizacji (ISO 8601)
};

// Entity - tabela personal_records w bazie danych
export type PersonalRecord = {
  id: string; // UUID rekordu
  user_id: string; // UUID użytkownika (FK do auth.users)
  distance: RecordDistance; // Dystans rekordu
  time_in_seconds: number; // Czas w sekundach
  created_at: string; // Data utworzenia (ISO 8601)
};

// DTO - response z GET /api/profile
export type ProfileResponseDTO = {
  data: Profile;
};

// DTO - response z GET /api/personal-records
export type PersonalRecordsResponseDTO = {
  data: PersonalRecord[];
};

// Enums
export type GoalDistance = "5K" | "10K" | "Half Marathon" | "Marathon";
export type RecordDistance = "5K" | "10K" | "Half Marathon" | "Marathon";
export type Gender = "M" | "F";
```

### 5.2. Nowe typy ViewModel

```typescript
// Props dla ProfileView.tsx
interface ProfileViewProps {
  profile: Profile;
  personalRecords: PersonalRecord[];
}

// Props dla TrainingGoalsCard.tsx
interface TrainingGoalsCardProps {
  goalDistance: GoalDistance;
  weeklyKm: number;
  trainingDaysPerWeek: number;
}

// Props dla PersonalDataCard.tsx
interface PersonalDataCardProps {
  age: number;
  weight: number;
  height: number;
  gender: Gender;
}

// Props dla PersonalRecordsCard.tsx
interface PersonalRecordsCardProps {
  personalRecords: PersonalRecord[];
}

// Props dla ActionsCard.tsx
interface ActionsCardProps {
  profile: Profile;
  personalRecords: PersonalRecord[];
}

// Props dla EmptyState.tsx (jeśli nie istnieje)
interface EmptyStateProps {
  variant: "no-profile" | "no-plan";
  message: string;
  ctaText: string;
  ctaLink: string;
}
```

### 5.3. Szczegółowy opis nowych typów

**ProfileViewProps:**

- Główny komponent kontenerowy otrzymuje pełne dane profilu i rekordów z SSR
- `profile`: obiekt typu `Profile` zawierający wszystkie dane z ankiety
- `personalRecords`: tablica obiektów typu `PersonalRecord` z rekordami życiowymi

**TrainingGoalsCardProps:**

- Ekstrakty z obiektu `Profile` dotyczące celów treningowych
- `goalDistance`: enum określający cel dystansowy (5K, 10K, półmaraton, maraton)
- `weeklyKm`: liczba zmiennoprzecinkowa reprezentująca średni tygodniowy kilometraż
- `trainingDaysPerWeek`: liczba całkowita (2-7) określająca liczbę dni treningowych

**PersonalDataCardProps:**

- Ekstrakty z obiektu `Profile` dotyczące danych osobowych
- `age`: liczba całkowita reprezentująca wiek w latach
- `weight`: liczba zmiennoprzecinkowa reprezentująca wagę w kilogramach
- `height`: liczba całkowita reprezentująca wzrost w centymetrach
- `gender`: enum określający płeć (M - mężczyzna, F - kobieta)

**PersonalRecordsCardProps:**

- Pełna tablica rekordów życiowych użytkownika
- `personalRecords`: tablica gdzie każdy element zawiera:
  - `id`: unikalny identyfikator rekordu (UUID)
  - `user_id`: identyfikator użytkownika (UUID)
  - `distance`: dystans rekordu (enum: 5K, 10K, Half Marathon, Marathon)
  - `time_in_seconds`: czas osiągnięcia rekordu w sekundach (do konwersji na format MM:SS)
  - `created_at`: timestamp utworzenia rekordu

**ActionsCardProps:**

- Pełne dane profilu i rekordów do przekazania do sessionStorage
- `profile`: pełny obiekt profilu do pre-fill ankiety
- `personalRecords`: tablica rekordów do pre-fill ankiety

**EmptyStateProps:**

- Props dla generycznego komponentu EmptyState
- `variant`: określa typ braku danych ("no-profile" dla brakującego profilu)
- `message`: tekst komunikatu wyświetlanego użytkownikowi
- `ctaText`: tekst na przycisku call-to-action
- `ctaLink`: URL do przekierowania po kliknięciu CTA

---

## 6. Zarządzanie stanem

Widok profilu użytkownika nie wymaga złożonego zarządzania stanem. Wszystkie dane są pobierane server-side (SSR) w pliku `profile.astro` i przekazywane jako props do komponentów React.

### Stan aplikacji:

1. **Dane profilu:** Pobierane SSR z GET /api/profile, przekazywane jako props
2. **Rekordy życiowe:** Pobierane SSR z GET /api/personal-records, przekazywane jako props
3. **Stan autentykacji:** Zarządzany przez Supabase Auth + middleware Astro

### Brak lokalnego stanu React:

Komponenty React w tym widoku są **stateless** i nie wymagają:

- `useState` - wszystkie dane read-only, brak zmian po montowaniu
- `useEffect` - brak client-side fetching, wszystko SSR
- `useReducer` - brak złożonej logiki stanowej

### Brak custom hooków:

Dla MVP nie są potrzebne custom hooki. Wszystkie dane są statyczne po załadowaniu strony.

Potencjalny custom hook (post-MVP, opcjonalnie):

```typescript
// Jeśli w przyszłości potrzeba client-side refresh danych
function useProfileData() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Client-side fetch logic
  }, []);

  return { profile, personalRecords, loading, error };
}
```

### Przekazywanie danych do sessionStorage:

Gdy użytkownik klika "Wygeneruj nowy plan" w ActionsCard:

```typescript
const handleGenerateNewPlan = () => {
  // Pre-fill survey data
  const surveyData = {
    goalDistance: profile.goal_distance,
    weeklyKm: profile.weekly_km,
    trainingDaysPerWeek: profile.training_days_per_week,
    age: profile.age,
    weight: profile.weight,
    height: profile.height,
    gender: profile.gender,
    personalRecords: personalRecords,
  };

  sessionStorage.setItem("surveyData", JSON.stringify(surveyData));
  window.location.href = "/survey";
};
```

---

## 7. Integracja API

### 7.1. Endpoint: GET /api/profile

**Typ żądania:**

```typescript
// Brak request body - GET request z credentials
fetch("/api/profile", {
  method: "GET",
  credentials: "include", // Zawiera JWT token w cookie
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Typ odpowiedzi:**

```typescript
// Success (200 OK)
type ProfileResponse = ProfileResponseDTO = {
  data: {
    user_id: string;
    goal_distance: "5K" | "10K" | "Half Marathon" | "Marathon";
    weekly_km: number;
    training_days_per_week: number;
    age: number;
    weight: number;
    height: number;
    gender: "M" | "F";
    created_at: string;
    updated_at: string;
  }
}

// Error responses
type ErrorResponse = {
  error: string;
}
```

**Miejsce wywołania:**
Server-side w `profile.astro`:

```typescript
const { data: session, error: authError } = await Astro.locals.supabase.auth.getUser();

if (authError || !session?.user) {
  return Astro.redirect("/auth/login");
}

const profileResponse = await fetch(`${Astro.url.origin}/api/profile`, {
  method: "GET",
  credentials: "include",
  headers: {
    Cookie: Astro.request.headers.get("cookie") || "",
  },
});

if (!profileResponse.ok) {
  if (profileResponse.status === 404) {
    // Render EmptyState
  } else if (profileResponse.status === 401) {
    return Astro.redirect("/auth/login");
  } else {
    // Show error toast
  }
}

const profileData: ProfileResponseDTO = await profileResponse.json();
```

**Obsługa statusów:**

- `200 OK` → Przekazanie danych do ProfileView
- `401 Unauthorized` → Redirect do /auth/login + toast "Sesja wygasła"
- `404 Not Found` → Renderowanie EmptyState
- `500 Internal Server Error` → Toast z błędem + możliwość retry

---

### 7.2. Endpoint: GET /api/personal-records

**UWAGA:** Endpoint nie został dostarczony w dokumentacji, ale jest wymagany zgodnie z UI Plan. Zakładam, że endpoint istnieje lub zostanie stworzony.

**Typ żądania:**

```typescript
fetch("/api/personal-records", {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Typ odpowiedzi:**

```typescript
// Success (200 OK)
type PersonalRecordsResponse = PersonalRecordsResponseDTO = {
  data: PersonalRecord[] = {
    id: string;
    user_id: string;
    distance: "5K" | "10K" | "Half Marathon" | "Marathon";
    time_in_seconds: number;
    created_at: string;
  }[]
}

// Error responses
type ErrorResponse = {
  error: string;
}
```

**Miejsce wywołania:**
Server-side w `profile.astro`:

```typescript
const recordsResponse = await fetch(`${Astro.url.origin}/api/personal-records`, {
  method: "GET",
  credentials: "include",
  headers: {
    Cookie: Astro.request.headers.get("cookie") || "",
  },
});

let personalRecords: PersonalRecord[] = [];

if (recordsResponse.ok) {
  const recordsData: PersonalRecordsResponseDTO = await recordsResponse.json();
  personalRecords = recordsData.data;
} else if (recordsResponse.status === 404) {
  // Brak rekordów - pusta tablica
  personalRecords = [];
} else {
  // Error - wyświetl toast, ale nadal renderuj profil
  console.error("Failed to fetch personal records");
}
```

**Obsługa statusów:**

- `200 OK` → Przekazanie danych do PersonalRecordsCard
- `404 Not Found` → Pusta tablica (brak rekordów)
- `401 Unauthorized` → Redirect do /auth/login
- `500 Internal Server Error` → Log błędu, wyświetl komunikat w PersonalRecordsCard

---

### 7.3. Alternatywne rozwiązanie (jeśli brak endpointu personal-records)

Jeśli endpoint GET /api/personal-records nie istnieje, można:

**Opcja A:** Rozszerzyć GET /api/profile o personal records:

```typescript
// Modified ProfileResponseDTO
type ProfileWithRecordsResponseDTO = {
  data: {
    profile: Profile;
    personalRecords: PersonalRecord[];
  };
};
```

**Opcja B:** Stworzyć nowy endpoint GET /api/personal-records według specyfikacji:

- Authentication: Required (JWT)
- Query: `SELECT * FROM personal_records WHERE user_id = auth.uid()`
- RLS policy: User może widzieć tylko swoje rekordy

---

## 8. Interakcje użytkownika

### 8.1. Nawigacja do profilu

**Akcja użytkownika:**

- Kliknięcie "Profil" w Navbar (desktop/tablet) lub BottomNav (mobile)

**Flow:**

1. Click link → przejście do `/profile`
2. Astro middleware sprawdza autentykację
3. Jeśli authenticated → renderowanie profile.astro
4. SSR fetch danych profilu i rekordów
5. Renderowanie ProfileView z danymi

**Wynik:**

- Wyświetlenie strony profilu z wszystkimi danymi użytkownika

---

### 8.2. Przeglądanie danych

**Akcja użytkownika:**

- Scrollowanie przez sekcje profilu

**Flow:**

1. User scrolluje przez Cards:
   - Cele treningowe
   - Dane osobowe
   - Rekordy życiowe
2. Wszystkie dane wyświetlane w read-only mode
3. Brak możliwości edycji

**Wynik:**

- Przegląd wszystkich danych w czytelnej formie

---

### 8.3. Generowanie nowego planu

**Akcja użytkownika:**

- Kliknięcie przycisku "Wygeneruj nowy plan" w ActionsCard

**Flow:**

1. Click button w ActionsCard
2. Handler `handleGenerateNewPlan()`:
   ```typescript
   const surveyData = {
     goalDistance: profile.goal_distance,
     weeklyKm: profile.weekly_km,
     trainingDaysPerWeek: profile.training_days_per_week,
     age: profile.age,
     weight: profile.weight,
     height: profile.height,
     gender: profile.gender,
     personalRecords: personalRecords,
   };
   sessionStorage.setItem("surveyData", JSON.stringify(surveyData));
   ```
3. Redirect do `/survey`
4. Survey page odczytuje dane z sessionStorage i pre-fills formularz

**Wynik:**

- Przekierowanie do ankiety z pre-filled danymi
- User może edytować dane i wygenerować nowy plan

---

### 8.4. Przypadek braku profilu

**Akcja użytkownika:**

- Próba dostępu do `/profile` bez wypełnionego profilu

**Flow:**

1. User naviguje do `/profile`
2. SSR fetch GET /api/profile → 404 Not Found
3. Astro renderuje EmptyState component
4. EmptyState wyświetla:
   - Message: "Uzupełnij ankietę, aby rozpocząć"
   - CTA button: "Wypełnij ankietę"

**Wynik:**

- Wyświetlenie EmptyState z komunikatem i CTA
- Click CTA → redirect `/survey`

---

### 8.5. Obsługa błędów sieciowych

**Akcja użytkownika:**

- Automatyczna, w przypadku błędu API

**Flow:**

1. Fetch GET /api/profile lub /api/personal-records kończy się błędem
2. Obsługa błędu w profile.astro:
   - 401: Redirect `/auth/login` + toast "Sesja wygasła"
   - 500: Toast "Wystąpił błąd. Spróbuj ponownie." + retry button
   - Network error: Toast "Sprawdź połączenie internetowe"

**Wynik:**

- User otrzymuje informację o błędzie
- Możliwość retry (refresh strony lub kliknięcie retry button)

---

## 9. Warunki i walidacja

### 9.1. Warunki na poziomie strony (profile.astro)

**Warunek 1: Autentykacja**

- **Co weryfikujemy:** Czy użytkownik jest zalogowany
- **Jak weryfikujemy:** `Astro.locals.supabase.auth.getUser()`
- **Wpływ na UI:**
  - Jeśli nie zalogowany → redirect `/auth/login`
  - Jeśli zalogowany → kontynuuj renderowanie

**Warunek 2: Istnienie profilu**

- **Co weryfikujemy:** Czy użytkownik ma wypełniony profil (status 200 vs 404)
- **Jak weryfikujemy:** Status code z GET /api/profile
- **Wpływ na UI:**
  - 200 OK → renderuj ProfileView
  - 404 Not Found → renderuj EmptyState
  - 401 Unauthorized → redirect `/auth/login`
  - 500 Error → toast z błędem

**Warunek 3: Istnienie rekordów życiowych**

- **Co weryfikujemy:** Czy użytkownik ma rekordy życiowe
- **Jak weryfikujemy:** Status code z GET /api/personal-records + sprawdzenie długości tablicy
- **Wpływ na UI:**
  - 200 OK + length > 0 → wyświetl listę rekordów w PersonalRecordsCard
  - 200 OK + length === 0 → wyświetl "Brak rekordów życiowych"
  - 404 → wyświetl "Brak rekordów życiowych"
  - Error → log błędu, wyświetl fallback message

---

### 9.2. Warunki na poziomie komponentów

**PersonalRecordsCard.tsx:**

**Warunek: Pusta tablica rekordów**

- **Weryfikacja:** `personalRecords.length === 0`
- **Wpływ na UI:**
  - True → wyświetl komunikat "Brak rekordów życiowych"
  - False → wyświetl listę rekordów

**PersonalDataCard.tsx:**

**Warunek: Formatowanie płci**

- **Weryfikacja:** `gender === "M" ? "Mężczyzna" : "Kobieta"`
- **Wpływ na UI:** Wyświetlenie czytelnej nazwy płci zamiast litery

**PersonalRecordsCard.tsx - formatowanie czasu:**

**Warunek: Czas < 60 minut vs >= 60 minut**

- **Weryfikacja:**
  ```typescript
  if (hours > 0) return `${hours}:${minutes}:${seconds}`;
  return `${minutes}:${seconds}`;
  ```
- **Wpływ na UI:**
  - Czasy < 60 min: format MM:SS (np. "20:30")
  - Czasy >= 60 min: format HH:MM:SS (np. "1:42:15")

---

### 9.3. Walidacja na poziomie API (RLS Policies)

**Row Level Security (Supabase):**

Polityki RLS na tabeli `profiles`:

```sql
-- User może widzieć tylko swój profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);
```

Polityki RLS na tabeli `personal_records`:

```sql
-- User może widzieć tylko swoje rekordy
CREATE POLICY "Users can view own records"
  ON personal_records FOR SELECT
  USING (auth.uid() = user_id);
```

**Weryfikacja na backendzie:**

- JWT token weryfikowany przez Supabase Auth
- RLS policies automatycznie filtrują dane dla danego użytkownika
- Brak możliwości dostępu do danych innych użytkowników

---

## 10. Obsługa błędów

### 10.1. Błędy autentykacji (401 Unauthorized)

**Przyczyna:**

- Brak JWT token w cookie
- Nieprawidłowy lub wygasły token
- User nie jest zalogowany

**Obsługa:**

```typescript
// W profile.astro (SSR)
const { data: session, error: authError } = await Astro.locals.supabase.auth.getUser();

if (authError || !session?.user) {
  // Redirect do strony logowania
  return Astro.redirect("/auth/login");
}

// Alternatywnie, po fetch:
if (profileResponse.status === 401) {
  // Middleware może pokazać toast "Sesja wygasła. Zaloguj się ponownie."
  return Astro.redirect("/auth/login");
}
```

**UI feedback:**

- Automatyczne przekierowanie do `/auth/login`
- Toast notification: "Sesja wygasła. Zaloguj się ponownie."

---

### 10.2. Brak profilu (404 Not Found)

**Przyczyna:**

- User zalogowany, ale nie wypełnił jeszcze ankiety
- Profil został usunięty z bazy danych (edge case)

**Obsługa:**

```typescript
// W profile.astro
if (profileResponse.status === 404) {
  // Renderuj EmptyState zamiast ProfileView
  const showEmptyState = true;
}
```

**UI feedback:**

```tsx
{
  showEmptyState ? (
    <EmptyState
      variant="no-profile"
      message="Uzupełnij ankietę, aby rozpocząć"
      ctaText="Wypełnij ankietę"
      ctaLink="/survey"
    />
  ) : (
    <ProfileView profile={profile} personalRecords={personalRecords} />
  );
}
```

---

### 10.3. Błąd serwera (500 Internal Server Error)

**Przyczyna:**

- Błąd bazy danych
- Timeout query
- Błąd w kodzie backendu

**Obsługa:**

```typescript
// W profile.astro
if (profileResponse.status === 500) {
  // Log błędu
  console.error("Server error fetching profile:", await profileResponse.text());

  // Wyświetl error state
  const errorMessage = "Wystąpił błąd podczas ładowania profilu. Spróbuj odświeżyć stronę.";
}
```

**UI feedback:**

- Wyświetlenie error message w UI
- Button "Odśwież stronę" → `window.location.reload()`
- Opcjonalnie: Toast notification z komunikatem błędu

---

### 10.4. Błąd sieciowy (Network Error)

**Przyczyna:**

- Brak połączenia internetowego
- Timeout request
- Problemy z DNS

**Obsługa:**

```typescript
// W profile.astro
try {
  const profileResponse = await fetch(`${Astro.url.origin}/api/profile`, {
    method: "GET",
    credentials: "include",
    headers: {
      Cookie: Astro.request.headers.get("cookie") || "",
    },
  });

  // Handle response...
} catch (error) {
  // Network error
  console.error("Network error:", error);
  const errorMessage = "Sprawdź połączenie internetowe i spróbuj ponownie.";
}
```

**UI feedback:**

- Toast notification: "Sprawdź połączenie internetowe"
- Button "Spróbuj ponownie" → retry fetch

---

### 10.5. Brak rekordów życiowych (404 lub pusta tablica)

**Przyczyna:**

- User ma profil, ale nie dodał jeszcze rekordów życiowych
- Endpoint /api/personal-records zwraca 404 lub pustą tablicę

**Obsługa:**

```typescript
// W profile.astro
let personalRecords: PersonalRecord[] = [];

if (recordsResponse.ok) {
  const recordsData: PersonalRecordsResponseDTO = await recordsResponse.json();
  personalRecords = recordsData.data || [];
} else if (recordsResponse.status === 404) {
  // Brak rekordów - użyj pustej tablicy
  personalRecords = [];
} else {
  // Error - log i użyj pustej tablicy
  console.error("Error fetching personal records");
  personalRecords = [];
}
```

**UI feedback w PersonalRecordsCard:**

```tsx
{
  personalRecords.length === 0 ? (
    <p className="text-muted-foreground">Brak rekordów życiowych</p>
  ) : (
    <ul>
      {personalRecords.map((record) => (
        <li key={record.id}>
          {record.distance}: {formatTime(record.time_in_seconds)}
        </li>
      ))}
    </ul>
  );
}
```

---

### 10.6. Fallback dla błędów React (ErrorBoundary)

**Obsługa:**
Jeśli istnieje globalny ErrorBoundary component, złapie błędy w React tree:

```tsx
// ErrorBoundary.tsx (jeśli nie istnieje, należy stworzyć)
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    console.error("React error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Coś poszło nie tak</h2>
          <button onClick={() => window.location.reload()}>Odśwież stronę</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 11. Kroki implementacji

### Faza 1: Przygotowanie struktury

1. **Sprawdzenie dependencies Shadcn/ui:**
   - Verify `Card`, `CardHeader`, `CardContent` components exist
   - If not, install: `npx shadcn-ui@latest add card`
   - Verify `Button` component exists
   - Check if `EmptyState` component exists (if not, create in step 8)

2. **Utworzenie struktury plików:**

   ```bash
   mkdir -p src/pages/profile
   mkdir -p src/components/profile
   touch src/pages/profile.astro
   touch src/components/profile/ProfileView.tsx
   touch src/components/profile/TrainingGoalsCard.tsx
   touch src/components/profile/PersonalDataCard.tsx
   touch src/components/profile/PersonalRecordsCard.tsx
   touch src/components/profile/ActionsCard.tsx
   ```

3. **Sprawdzenie endpointu GET /api/personal-records:**
   - Check if `src/pages/api/personal-records.ts` exists
   - If not, create endpoint based on GET /api/profile pattern
   - Implement RLS policy: `auth.uid() = user_id`

---

### Faza 2: Implementacja helper functions

4. **Utworzenie funkcji formatowania czasu:**

   ```typescript
   // src/lib/utils/formatTime.ts
   export function formatTime(seconds: number): string {
     const hours = Math.floor(seconds / 3600);
     const minutes = Math.floor((seconds % 3600) / 60);
     const secs = seconds % 60;

     if (hours > 0) {
       return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
     }
     return `${minutes}:${secs.toString().padStart(2, "0")}`;
   }
   ```

5. **Utworzenie funkcji formatowania płci:**

   ```typescript
   // src/lib/utils/formatGender.ts
   import type { Gender } from "@/types";

   export function formatGender(gender: Gender): string {
     return gender === "M" ? "Mężczyzna" : "Kobieta";
   }
   ```

---

### Faza 3: Implementacja komponentów Card

6. **Implementacja TrainingGoalsCard.tsx:**

   ```tsx
   import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
   import type { GoalDistance } from "@/types";

   interface TrainingGoalsCardProps {
     goalDistance: GoalDistance;
     weeklyKm: number;
     trainingDaysPerWeek: number;
   }

   export function TrainingGoalsCard({ goalDistance, weeklyKm, trainingDaysPerWeek }: TrainingGoalsCardProps) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Cele treningowe</CardTitle>
         </CardHeader>
         <CardContent>
           <dl className="space-y-2">
             <div>
               <dt className="font-medium text-muted-foreground">Cel-dystans:</dt>
               <dd className="text-lg">{goalDistance}</dd>
             </div>
             <div>
               <dt className="font-medium text-muted-foreground">Średni tygodniowy kilometraż:</dt>
               <dd className="text-lg">{weeklyKm} km</dd>
             </div>
             <div>
               <dt className="font-medium text-muted-foreground">Liczba dni treningowych:</dt>
               <dd className="text-lg">{trainingDaysPerWeek} dni/tydzień</dd>
             </div>
           </dl>
         </CardContent>
       </Card>
     );
   }
   ```

7. **Implementacja PersonalDataCard.tsx:**

   ```tsx
   import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
   import type { Gender } from "@/types";
   import { formatGender } from "@/lib/utils/formatGender";

   interface PersonalDataCardProps {
     age: number;
     weight: number;
     height: number;
     gender: Gender;
   }

   export function PersonalDataCard({ age, weight, height, gender }: PersonalDataCardProps) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Dane osobowe</CardTitle>
         </CardHeader>
         <CardContent>
           <dl className="space-y-2">
             <div>
               <dt className="font-medium text-muted-foreground">Wiek:</dt>
               <dd className="text-lg">{age} lat</dd>
             </div>
             <div>
               <dt className="font-medium text-muted-foreground">Waga:</dt>
               <dd className="text-lg">{weight} kg</dd>
             </div>
             <div>
               <dt className="font-medium text-muted-foreground">Wzrost:</dt>
               <dd className="text-lg">{height} cm</dd>
             </div>
             <div>
               <dt className="font-medium text-muted-foreground">Płeć:</dt>
               <dd className="text-lg">{formatGender(gender)}</dd>
             </div>
           </dl>
         </CardContent>
       </Card>
     );
   }
   ```

8. **Implementacja PersonalRecordsCard.tsx:**

   ```tsx
   import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
   import type { PersonalRecord } from "@/types";
   import { formatTime } from "@/lib/utils/formatTime";

   interface PersonalRecordsCardProps {
     personalRecords: PersonalRecord[];
   }

   export function PersonalRecordsCard({ personalRecords }: PersonalRecordsCardProps) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Rekordy życiowe</CardTitle>
         </CardHeader>
         <CardContent>
           {personalRecords.length === 0 ? (
             <p className="text-muted-foreground">Brak rekordów życiowych</p>
           ) : (
             <ul className="space-y-2">
               {personalRecords.map((record) => (
                 <li key={record.id} className="flex justify-between">
                   <span className="font-medium">{record.distance}:</span>
                   <span>{formatTime(record.time_in_seconds)}</span>
                 </li>
               ))}
             </ul>
           )}
         </CardContent>
       </Card>
     );
   }
   ```

9. **Implementacja ActionsCard.tsx:**

   ```tsx
   import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
   import { Button } from "@/components/ui/button";
   import type { Profile, PersonalRecord } from "@/types";

   interface ActionsCardProps {
     profile: Profile;
     personalRecords: PersonalRecord[];
   }

   export function ActionsCard({ profile, personalRecords }: ActionsCardProps) {
     const handleGenerateNewPlan = () => {
       // Pre-fill survey data in sessionStorage
       const surveyData = {
         goalDistance: profile.goal_distance,
         weeklyKm: profile.weekly_km,
         trainingDaysPerWeek: profile.training_days_per_week,
         age: profile.age,
         weight: profile.weight,
         height: profile.height,
         gender: profile.gender,
         personalRecords: personalRecords,
       };

       sessionStorage.setItem("surveyData", JSON.stringify(surveyData));
       window.location.href = "/survey";
     };

     return (
       <Card>
         <CardHeader>
           <CardTitle>Akcje</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           <Button onClick={handleGenerateNewPlan} className="w-full">
             Wygeneruj nowy plan
           </Button>
         </CardContent>
       </Card>
     );
   }
   ```

---

### Faza 4: Implementacja ProfileView container

10. **Implementacja ProfileView.tsx:**

    ```tsx
    import type { Profile, PersonalRecord } from "@/types";
    import { TrainingGoalsCard } from "./TrainingGoalsCard";
    import { PersonalDataCard } from "./PersonalDataCard";
    import { PersonalRecordsCard } from "./PersonalRecordsCard";
    import { ActionsCard } from "./ActionsCard";

    interface ProfileViewProps {
      profile: Profile;
      personalRecords: PersonalRecord[];
    }

    export function ProfileView({ profile, personalRecords }: ProfileViewProps) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Profil użytkownika</h1>

          <div className="grid gap-6 md:grid-cols-2">
            <TrainingGoalsCard
              goalDistance={profile.goal_distance}
              weeklyKm={profile.weekly_km}
              trainingDaysPerWeek={profile.training_days_per_week}
            />

            <PersonalDataCard
              age={profile.age}
              weight={profile.weight}
              height={profile.height}
              gender={profile.gender}
            />

            <PersonalRecordsCard personalRecords={personalRecords} />

            <ActionsCard profile={profile} personalRecords={personalRecords} />
          </div>
        </div>
      );
    }
    ```

---

### Faza 5: Implementacja EmptyState (jeśli nie istnieje)

11. **Sprawdzenie czy EmptyState.tsx istnieje:**
    - Check `src/components/ui/EmptyState.tsx` or `src/components/shared/EmptyState.tsx`
    - If exists, verify it accepts props: `variant`, `message`, `ctaText`, `ctaLink`

12. **Implementacja EmptyState.tsx (jeśli nie istnieje):**

    ```tsx
    // src/components/shared/EmptyState.tsx
    import { Button } from "@/components/ui/button";
    import { UserIcon } from "lucide-react";

    interface EmptyStateProps {
      variant: "no-profile" | "no-plan";
      message: string;
      ctaText: string;
      ctaLink: string;
    }

    export function EmptyState({ message, ctaText, ctaLink }: EmptyStateProps) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <UserIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-center mb-6">{message}</p>
          <Button asChild>
            <a href={ctaLink}>{ctaText}</a>
          </Button>
        </div>
      );
    }
    ```

---

### Faza 6: Implementacja strony profile.astro (SSR)

13. **Implementacja profile.astro:**

    ```astro
    ---
    // src/pages/profile.astro
    import DashboardLayout from "@/layouts/DashboardLayout.astro";
    import { ProfileView } from "@/components/profile/ProfileView";
    import { EmptyState } from "@/components/shared/EmptyState";
    import type { ProfileResponseDTO, PersonalRecordsResponseDTO, Profile, PersonalRecord } from "@/types";

    // Sprawdzenie autentykacji
    const { data: session, error: authError } = await Astro.locals.supabase.auth.getUser();

    if (authError || !session?.user) {
      return Astro.redirect("/auth/login");
    }

    // Pobranie profilu użytkownika
    let profile: Profile | null = null;
    let personalRecords: PersonalRecord[] = [];
    let showEmptyState = false;
    let errorMessage: string | null = null;

    try {
      const profileResponse = await fetch(`${Astro.url.origin}/api/profile`, {
        method: "GET",
        headers: {
          Cookie: Astro.request.headers.get("cookie") || "",
        },
      });

      if (profileResponse.ok) {
        const profileData: ProfileResponseDTO = await profileResponse.json();
        profile = profileData.data;
      } else if (profileResponse.status === 404) {
        showEmptyState = true;
      } else if (profileResponse.status === 401) {
        return Astro.redirect("/auth/login");
      } else {
        errorMessage = "Wystąpił błąd podczas ładowania profilu.";
      }

      // Pobranie personal records (jeśli profil istnieje)
      if (profile) {
        const recordsResponse = await fetch(`${Astro.url.origin}/api/personal-records`, {
          method: "GET",
          headers: {
            Cookie: Astro.request.headers.get("cookie") || "",
          },
        });

        if (recordsResponse.ok) {
          const recordsData: PersonalRecordsResponseDTO = await recordsResponse.json();
          personalRecords = recordsData.data || [];
        } else if (recordsResponse.status !== 404) {
          // Log error ale nie blokuj renderowania
          console.error("Failed to fetch personal records");
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      errorMessage = "Sprawdź połączenie internetowe i spróbuj ponownie.";
    }
    ---

    <DashboardLayout title="Profil użytkownika">
      {
        showEmptyState ? (
          <EmptyState
            variant="no-profile"
            message="Uzupełnij ankietę, aby rozpocząć"
            ctaText="Wypełnij ankietę"
            ctaLink="/survey"
          />
        ) : errorMessage ? (
          <div class="flex flex-col items-center justify-center min-h-[60vh]">
            <p class="text-xl mb-4">{errorMessage}</p>
            <button onclick="window.location.reload()" class="btn">
              Odśwież stronę
            </button>
          </div>
        ) : profile ? (
          <ProfileView client:load profile={profile} personalRecords={personalRecords} />
        ) : null
      }
    </DashboardLayout>
    ```

---

### Faza 7: Testing i debugging

14. **Test Cases:**
    - **TC1:** User zalogowany, ma profil i rekordy → wyświetl pełny ProfileView
    - **TC2:** User zalogowany, ma profil, brak rekordów → wyświetl "Brak rekordów życiowych"
    - **TC3:** User zalogowany, brak profilu → wyświetl EmptyState
    - **TC4:** User niezalogowany → redirect do /auth/login
    - **TC5:** Click "Wygeneruj nowy plan" → pre-fill sessionStorage + redirect /survey
    - **TC6:** Network error → wyświetl error message z retry
    - **TC7:** Responsive layout → test na mobile/tablet/desktop

15. **Manual Testing:**

    ```bash
    npm run dev
    # Navigate to http://localhost:4321/profile
    # Test each scenario above
    ```

16. **Console checks:**
    - Sprawdzić czy brak błędów React w konsoli
    - Sprawdzić czy sessionStorage zawiera dane po kliknięciu "Wygeneruj nowy plan"
    - Sprawdzić network tab dla poprawnych fetch requests

---

### Faza 8: Responsive styling i accessibility

17. **Responsive breakpoints:**
    - Mobile (<768px): Cards w kolumnie (grid-cols-1)
    - Tablet/Desktop (>=768px): Cards w 2 kolumnach (md:grid-cols-2)

    ```tsx
    // W ProfileView.tsx
    <div className="grid gap-6 md:grid-cols-2">
    ```

18. **Accessibility audit:**
    - Sprawdzić semantic HTML (dl, dt, dd)
    - Dodać aria-labels gdzie potrzeba
    - Sprawdzić keyboard navigation (Tab order)
    - Test z screen reader (opcjonalnie)
    - Sprawdzić color contrast ratios (WCAG AA)

---

### Faza 9: Integracja z nawigacją

19. **Dodanie linku "Profil" w Navbar.astro (jeśli nie istnieje):**

    ```astro
    // src/components/Navbar.astro
    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/profile" aria-current={Astro.url.pathname === "/profile" ? "page" : undefined}> Profil </a>
      <a href="/survey">Nowy Plan</a>
      <button>Wyloguj się</button>
    </nav>
    ```

20. **Dodanie ikony "Profil" w BottomNav.tsx (mobile, jeśli nie istnieje):**

    ```tsx
    // src/components/BottomNav.tsx
    import { UserIcon } from "lucide-react";

    <nav className="fixed bottom-0 left-0 right-0 md:hidden">
      <a href="/dashboard">
        <HomeIcon />
        <span>Dashboard</span>
      </a>
      <a href="/profile">
        <UserIcon />
        <span>Profil</span>
      </a>
      <a href="/survey">
        <PlusIcon />
        <span>Nowy Plan</span>
      </a>
    </nav>;
    ```

---

### Faza 10: Finalne sprawdzenia

21. **Code review checklist:**
    - [ ] Wszystkie typy TypeScript poprawne
    - [ ] Brak błędów linting (npm run lint)
    - [ ] Brak błędów TypeScript (npm run build)
    - [ ] Semantic HTML użyte poprawnie
    - [ ] ARIA attributes gdzie potrzeba
    - [ ] Responsive design działa na wszystkich breakpointach
    - [ ] Error states obsłużone
    - [ ] Loading states (jeśli applicable)
    - [ ] SessionStorage pre-fill działa
    - [ ] Link "Profil" w nawigacji działa

22. **Performance check:**
    - Sprawdzić SSR rendering time
    - Sprawdzić czy brak niepotrzebnych re-renders
    - Sprawdzić bundle size (opcjonalnie)

23. **Final manual test:**
    - Przejść przez cały user flow: login → profile → generate new plan
    - Sprawdzić wszystkie edge cases
    - Sprawdzić na różnych przeglądarkach (Chrome, Firefox, Safari)

---

## Podsumowanie

Plan implementacji widoku profilu użytkownika obejmuje:

- **7 głównych komponentów** (profile.astro, ProfileView, 4x Card components, EmptyState)
- **2 helper functions** (formatTime, formatGender)
- **Integrację z 2 endpointami API** (GET /api/profile, GET /api/personal-records)
- **Pełną obsługę błędów** i edge cases
- **Responsive design** dla mobile/tablet/desktop
- **Accessibility** (semantic HTML, ARIA)
- **Pre-fill mechanizm** dla survey przez sessionStorage

Widok jest w pełni read-only, co upraszcza implementację - brak potrzeby lokalnego stanu React, walidacji formularzy czy złożonych interakcji. Wszystkie dane pobierane są SSR i przekazywane jako props do komponentów React.
