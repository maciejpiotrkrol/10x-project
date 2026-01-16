# Plan implementacji widoku Dashboard - Wyświetlanie planu treningowego z dniami odpoczynku

## 1. Przegląd

Widok Dashboard to główna strona aplikacji Athletica, która wyświetla aktywny 10-tygodniowy plan treningowy użytkownika. Kluczowym elementem tego widoku jest prawidłowe wyświetlanie dni treningowych oraz dni odpoczynku. User Story US-010 skupia się na wyraźnym oznaczeniu dni odpoczynku, które nie posiadają opcji oznaczenia jako "wykonane". Widok prezentuje 70 dni podzielonych na 10 tygodni w formie kafelków, z możliwością śledzenia postępów poprzez oznaczanie treningów jako ukończone.

## 2. Routing widoku

**Ścieżka:** `/dashboard`

**Typ renderowania:** Server-Side Rendering (SSR) z Astro

**Ochrona:** Chroniona trasa - wymaga uwierzytelnienia. Middleware sprawdza sesję Supabase i przekierowuje niezalogowanych użytkowników do `/auth/login`.

**Plik:** `src/pages/dashboard.astro`

## 3. Struktura komponentów

```
dashboard.astro (Astro SSR)
└── DashboardLayout.astro
    └── TrainingPlanView.tsx (React, client:load)
        ├── PlanHeader.tsx (statystyki planu)
        ├── Accordion (Shadcn/ui, x10 tygodni)
        │   └── WeekAccordion.tsx (React, x10)
        │       └── WorkoutDayCard.tsx (React, x7 dni)
        │           ├── Card (Shadcn/ui)
        │           ├── [Conditional] Rest Day Content
        │           │   ├── Icon: 🛌
        │           │   └── Text: "Odpoczynek"
        │           └── [Conditional] Workout Day Content
        │               ├── Workout Description
        │               └── Checkbox (Shadcn/ui)
        └── ScrollToTodayFAB.tsx (floating action button)

Osobno (dla przypadku braku danych):
└── EmptyState.tsx (gdy brak aktywnego planu)
```

## 4. Szczegóły komponentów

### 4.1. dashboard.astro

**Opis:** Główna strona Astro odpowiedzialna za server-side rendering i fetch danych z API. Pobiera aktywny plan treningowy z backendu i przekazuje go jako props do komponentu React.

**Główne elementy:**

- Import DashboardLayout.astro
- Server-side fetch: GET /api/training-plans/active
- Conditional rendering: TrainingPlanView lub EmptyState
- Error handling dla 404 i 500

**Obsługiwane interakcje:** Brak (statyczny Astro component)

**Obsługiwana walidacja:**

- Sprawdzenie czy użytkownik jest zalogowany (middleware)
- Sprawdzenie czy aktywny plan istnieje (404 → EmptyState)
- Sprawdzenie czy plan ma 70 dni (validation error → ErrorState)

**Typy:**

- `TrainingPlanWithWorkoutsDTO` - response z API
- `WorkoutDay[]` - tablica 70 dni treningowych

**Propsy:** N/A (top-level page)

**Przykładowa implementacja:**

```astro
---
import DashboardLayout from "@/layouts/DashboardLayout.astro";
import TrainingPlanView from "@/components/dashboard/TrainingPlanView";
import EmptyState from "@/components/dashboard/EmptyState";

const response = await fetch(`${Astro.url.origin}/api/training-plans/active`, {
  headers: {
    Cookie: Astro.request.headers.get("Cookie") || "",
  },
});

let trainingPlan = null;
let hasError = false;

if (response.ok) {
  const data = await response.json();
  trainingPlan = data.data;
} else if (response.status === 404) {
  // No active plan - show empty state
} else {
  hasError = true;
}
---

<DashboardLayout title="Twój plan treningowy">
  {hasError && <ErrorState message="Nie udało się załadować planu" />}
  {!hasError && !trainingPlan && <EmptyState />}
  {!hasError && trainingPlan && <TrainingPlanView client:load trainingPlan={trainingPlan} />}
</DashboardLayout>
```

---

### 4.2. TrainingPlanView.tsx

**Opis:** Główny kontener React dla całego widoku planu treningowego. Odpowiedzialny za zarządzanie stanem workout days, optimistic updates, groupowanie dni po tygodniach i auto-scroll do dzisiejszego dnia.

**Główne elementy:**

- PlanHeader - statystyki ukończenia planu
- 10x WeekAccordion - accordion dla każdego tygodnia
- ScrollToTodayFAB - floating button do scrollowania
- useRef dla today's card
- useState dla local state (optimistic updates)
- useEffect dla auto-scroll on mount

**Obsługiwane interakcje:**

- onToggleCompleted - callback przekazywany do WorkoutDayCard
- Optimistic update stanu workout days
- API call PATCH /api/workout-days/:id
- Rollback on error + toast notification

**Obsługiwana walidacja:**

- Walidacja że workout_days.length === 70
- Walidacja że workout_days są posortowane po day_number
- Zabezpieczenie przed marking rest days as completed (checkbox nie renderowany)

**Typy:**

- `TrainingPlanViewProps` - props interface
- `TrainingPlanWithWorkoutsDTO` - input data
- `WorkoutDay[]` - local state

**Propsy:**

```typescript
interface TrainingPlanViewProps {
  trainingPlan: TrainingPlanWithWorkoutsDTO;
}
```

**Logika groupowania tygodni:**

```typescript
const groupByWeeks = (days: WorkoutDay[]): WorkoutDay[][] => {
  const weeks: WorkoutDay[][] = [];
  for (let i = 0; i < 10; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }
  return weeks;
};
```

---

### 4.3. WeekAccordion.tsx

**Opis:** Komponent accordion dla jednego tygodnia, zawierający 7 WorkoutDayCard. Wyświetla nagłówek z numerem tygodnia i statystykami ukończenia treningów w tym tygodniu. Auto-expand jeśli tydzień zawiera dzisiejszą datę.

**Główne elementy:**

- AccordionItem (Shadcn/ui)
- AccordionTrigger - header z tekstem "Tydzień X: Y/Z wykonanych"
- AccordionContent - 7x WorkoutDayCard
- Badge - status indicator (opcjonalnie)

**Obsługiwane interakcje:**

- Click na trigger → expand/collapse
- Keyboard navigation (Enter, Space)
- Przekazanie onToggleCompleted do children

**Obsługiwana walidacja:**

- Walidacja że workoutDays.length === 7
- Obliczenie liczby ukończonych treningów w tygodniu (excluding rest days)

**Typy:**

- `WeekAccordionProps` - props interface
- `WorkoutDay[]` - 7 dni dla tego tygodnia

**Propsy:**

```typescript
interface WeekAccordionProps {
  weekNumber: number; // 1-10
  workoutDays: WorkoutDay[]; // Exactly 7 days
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isCurrentWeek?: boolean; // For auto-expand
}
```

**Obliczanie statystyk tygodnia:**

```typescript
const weekStats = {
  total: workoutDays.filter((d) => !d.is_rest_day).length,
  completed: workoutDays.filter((d) => !d.is_rest_day && d.is_completed).length,
};
```

---

### 4.4. WorkoutDayCard.tsx ⭐ (Główny komponent dla US-010)

**Opis:** Kafelek reprezentujący pojedynczy dzień w planie treningowym. Kluczowy komponent dla User Story US-010. Wyświetla dwa różne warianty w zależności od wartości `is_rest_day`:

1. **Rest Day Variant** (is_rest_day === true):
   - Muted background (bg-muted)
   - Ikona 🛌
   - Tekst "Odpoczynek"
   - BRAK checkbox (zgodnie z US-010, kryterium 3)
   - Disabled state (brak interakcji z completion)

2. **Workout Day Variant** (is_rest_day === false):
   - Workout description (truncated/expanded)
   - Checkbox do marking completed
   - Conditional styling: pending (neutral) / completed (green border)
   - Click na card → expand/collapse description

**Główne elementy HTML i komponenty:**

```tsx
<Card ref={isToday ? todayCardRef : null}>
  <CardHeader>
    <div className="flex justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Dzień {workoutDay.day_number}/70</p>
        <p className="text-base font-medium">{formatDate(workoutDay.date)}</p>
      </div>
      {/* Conditional badge dla "Dzisiaj" */}
      {isToday && <Badge variant="secondary">Dzisiaj</Badge>}
    </div>
  </CardHeader>

  <CardContent>
    {/* CONDITIONAL RENDERING - Kluczowe dla US-010 */}
    {workoutDay.is_rest_day ? (
      // REST DAY VARIANT
      <div className="flex items-center gap-3 py-4">
        <span className="text-3xl" role="img" aria-label="Odpoczynek">
          🛌
        </span>
        <p className="text-lg text-muted-foreground">Odpoczynek</p>
      </div>
    ) : (
      // WORKOUT DAY VARIANT
      <>
        <p className={cn("text-sm", isExpanded ? "" : "line-clamp-2")}>{workoutDay.workout_description}</p>
        {!isExpanded && (
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)}>
            Rozwiń
          </Button>
        )}
      </>
    )}
  </CardContent>

  {/* FOOTER z checkbox - TYLKO dla workout days */}
  {!workoutDay.is_rest_day && (
    <CardFooter className="border-t pt-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`workout-${workoutDay.id}`}
          checked={workoutDay.is_completed}
          onCheckedChange={() => onToggleCompleted(workoutDay.id, workoutDay.is_completed)}
          aria-label="Oznacz jako wykonany"
        />
        <label htmlFor={`workout-${workoutDay.id}`} className="text-sm cursor-pointer">
          Oznacz jako wykonany
        </label>
      </div>
    </CardFooter>
  )}
</Card>
```

**Obsługiwane interakcje:**

1. **Click na checkbox** (tylko workout days):
   - Wywołanie `onToggleCompleted(id, currentStatus)`
   - Optimistic update w parent component (TrainingPlanView)
   - Toast notification

2. **Click na card body** (opcjonalnie):
   - Toggle expand/collapse workout description

3. **Brak interakcji dla rest days:**
   - Checkbox nie jest renderowany
   - Nie można oznaczyć jako completed

**Obsługiwana walidacja:**

- **Krytyczne dla US-010:** Walidacja że `is_rest_day === true` → NIE renderować checkbox
- Walidacja formatu daty (YYYY-MM-DD)
- Type guard dla workout_description (string, non-empty)

**Typy:**

- `WorkoutDayCardProps` - props interface (zdefiniowany w types.ts)
- `WorkoutDay` - entity type

**Propsy:**

```typescript
interface WorkoutDayCardProps {
  workoutDay: WorkoutDay;
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isToday?: boolean; // For badge and auto-scroll ref
}
```

**Conditional styling (Tailwind classes):**

```typescript
const cardClassName = cn(
  "transition-all duration-200",
  // Rest day styling
  workoutDay.is_rest_day && "bg-muted border-muted",
  // Workout day - completed
  !workoutDay.is_rest_day && workoutDay.is_completed && "border-green-500 bg-green-50/50",
  // Workout day - pending
  !workoutDay.is_rest_day && !workoutDay.is_completed && "border-border",
  // Today highlight
  isToday && "ring-2 ring-primary ring-offset-2"
);
```

---

### 4.5. PlanHeader.tsx

**Opis:** Nagłówek planu z datami i statystykami ukończenia. Wyświetla progress bar i kluczowe metryki.

**Główne elementy:**

- Card z informacjami o planie
- Daty: start_date, end_date
- Statystyki: wykonane treningi, procent ukończenia
- Progress bar (Shadcn/ui Progress component)

**Obsługiwane interakcje:** Brak (read-only display)

**Obsługiwana walidacja:**

- Walidacja dat (format YYYY-MM-DD)
- Walidacja completion_percentage (0-100)

**Typy:**

- `PlanHeaderProps` - props interface
- `CompletionStatsDTO` - statystyki

**Propsy:**

```typescript
interface PlanHeaderProps {
  trainingPlan: TrainingPlan;
  completionStats: CompletionStatsDTO;
}
```

---

### 4.6. ScrollToTodayFAB.tsx

**Opis:** Floating Action Button w prawym dolnym rogu, który scrolluje do dzisiejszego dnia. Widoczny tylko gdy today's card nie jest w viewport.

**Główne elementy:**

- Button (Shadcn/ui) z fixed position
- Ikona: ArrowDown (lucide-react)
- IntersectionObserver dla visibility logic

**Obsługiwane interakcje:**

- Click → scroll to today's card (smooth behavior)

**Obsługiwana walidacja:**

- Sprawdzenie czy todayCardRef.current istnieje

**Typy:**

- `ScrollToTodayFABProps` - props interface

**Propsy:**

```typescript
interface ScrollToTodayFABProps {
  todayCardRef: React.RefObject<HTMLDivElement>;
}
```

---

### 4.7. EmptyState.tsx

**Opis:** Placeholder wyświetlany gdy użytkownik nie ma aktywnego planu treningowego.

**Główne elementy:**

- Card z centered content
- Ikona (Calendar lub FileQuestion)
- Tekst: "Nie masz aktywnego planu treningowego"
- Button: "Wygeneruj plan" → link do /survey

**Obsługiwane interakcje:**

- Click na button → redirect /survey

**Obsługiwana walidacja:** Brak

**Typy:**

```typescript
interface EmptyStateProps {
  variant?: "no-plan" | "error";
  message?: string;
  ctaText?: string;
  ctaLink?: string;
}
```

**Propsy:** Opcjonalne customization props

---

## 5. Typy

Wszystkie wymagane typy są już zdefiniowane w `src/types.ts`. Poniżej szczegółowy breakdown:

### 5.1. Entity Types (z bazy danych)

```typescript
/**
 * WorkoutDay - Pojedynczy dzień w planie treningowym
 * Używany jako podstawowy typ dla WorkoutDayCard
 */
export type WorkoutDay = {
  id: string; // UUID, primary key
  training_plan_id: string; // UUID, foreign key do training_plans
  day_number: number; // 1-70, kolejny numer dnia w planie
  date: string; // YYYY-MM-DD, data tego dnia
  workout_description: string; // Opis treningu LUB "Odpoczynek" dla rest days
  is_rest_day: boolean; // ⭐ Kluczowe pole dla US-010
  is_completed: boolean; // Czy trening został ukończony
  completed_at: string | null; // ISO timestamp, kiedy oznaczono jako completed
};
```

### 5.2. DTOs (Data Transfer Objects)

```typescript
/**
 * WorkoutDayDTO - Alias dla WorkoutDay
 * Używany w API responses
 */
export type WorkoutDayDTO = WorkoutDay;

/**
 * CompletionStatsDTO - Statystyki ukończenia planu
 * Obliczane na backendzie, wyświetlane w PlanHeader
 */
export interface CompletionStatsDTO {
  total_workouts: number; // Liczba workout days (excluding rest days)
  completed_workouts: number; // Liczba ukończonych workouts
  total_rest_days: number; // Liczba rest days
  completion_percentage: number; // 0-100, procent ukończenia
  is_plan_completed: boolean; // Czy plan jest w pełni ukończony
}

/**
 * TrainingPlanWithWorkoutsDTO - Pełny plan z workout days
 * Response z GET /api/training-plans/active
 */
export type TrainingPlanWithWorkoutsDTO = TrainingPlan & {
  workout_days: WorkoutDayDTO[]; // 70 dni, sorted by day_number
  completion_stats: CompletionStatsDTO; // Obliczone statystyki
};
```

### 5.3. ViewModel Types (Props interfaces)

```typescript
/**
 * Props dla TrainingPlanView
 */
export interface TrainingPlanViewProps {
  trainingPlan: TrainingPlanWithWorkoutsDTO;
}

/**
 * Props dla WeekAccordion
 */
export interface WeekAccordionProps {
  weekNumber: number; // 1-10
  workoutDays: WorkoutDay[]; // Exactly 7 days
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isCurrentWeek?: boolean; // For auto-expand today's week
}

/**
 * Props dla WorkoutDayCard ⭐ (Kluczowy dla US-010)
 */
export interface WorkoutDayCardProps {
  workoutDay: WorkoutDay; // Zawiera is_rest_day field
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isToday?: boolean; // For badge + auto-scroll ref
}

/**
 * Props dla PlanHeader
 */
export interface PlanHeaderProps {
  trainingPlan: TrainingPlan;
  completionStats: CompletionStatsDTO;
}

/**
 * Props dla ScrollToTodayFAB
 */
export interface ScrollToTodayFABProps {
  todayCardRef: React.RefObject<HTMLDivElement>;
}
```

### 5.4. Nie są potrzebne nowe typy

Wszystkie typy wymagane do implementacji widoku Dashboard z wyświetlaniem dni odpoczynku (US-010) są już zdefiniowane w `src/types.ts`. Implementacja powinna wykorzystać istniejące typy bez tworzenia nowych.

---

## 6. Zarządzanie stanem

### 6.1. Server State (SSR w Astro)

**Lokalizacja:** `src/pages/dashboard.astro`

**Źródło danych:** GET /api/training-plans/active

**Przekazywanie:** Props do TrainingPlanView component

```typescript
// W dashboard.astro
const response = await fetch(`${Astro.url.origin}/api/training-plans/active`, {
  headers: { Cookie: Astro.request.headers.get('Cookie') || '' },
});

const trainingPlan = response.ok ? (await response.json()).data : null;

// Pass as props
<TrainingPlanView client:load trainingPlan={trainingPlan} />
```

### 6.2. Client State (React w TrainingPlanView)

**Stan lokalny dla optimistic updates:**

```typescript
const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({ trainingPlan }) => {
  // Local copy of workout days for optimistic updates
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>(trainingPlan.workout_days);

  // Track which workout is currently being updated (for loading state)
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Ref for today's card (auto-scroll)
  const todayCardRef = useRef<HTMLDivElement>(null);

  // ... rest of component
};
```

### 6.3. Custom Hook: useWorkoutToggle (Rekomendowany)

Dla lepszej organizacji kodu i reusability, zaleca się wydzielenie logiki optimistic updates do custom hook:

```typescript
/**
 * Custom hook dla zarządzania stanem workout days z optimistic updates
 * Lokalizacja: src/components/hooks/useWorkoutToggle.ts
 */
const useWorkoutToggle = (initialDays: WorkoutDay[]) => {
  const [days, setDays] = useState<WorkoutDay[]>(initialDays);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleCompleted = async (id: string, currentStatus: boolean) => {
    // Zabezpieczenie: Nie pozwól na marking rest days
    const day = days.find((d) => d.id === id);
    if (day?.is_rest_day) {
      console.error("Cannot mark rest day as completed");
      return;
    }

    setUpdatingId(id);

    // 1. Optimistic update
    setDays((prevDays) =>
      prevDays.map((d) =>
        d.id === id
          ? { ...d, is_completed: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null }
          : d
      )
    );

    try {
      // 2. API call
      const response = await fetch(`/api/workout-days/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update workout");
      }

      // 3. Success toast
      toast({
        title: !currentStatus ? "Trening oznaczony jako wykonany" : "Oznaczenie cofnięte",
        variant: "default",
      });
    } catch (error) {
      // 4. Rollback on error
      setDays((prevDays) =>
        prevDays.map((d) =>
          d.id === id
            ? { ...d, is_completed: currentStatus, completed_at: currentStatus ? new Date().toISOString() : null }
            : d
        )
      );

      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować treningu. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return { days, updatingId, toggleCompleted };
};
```

**Użycie w TrainingPlanView:**

```typescript
const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({ trainingPlan }) => {
  const { days: workoutDays, toggleCompleted } = useWorkoutToggle(trainingPlan.workout_days);

  // ... rest of component uses workoutDays and toggleCompleted
};
```

### 6.4. Auto-scroll Logic

```typescript
// W TrainingPlanView
const todayCardRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  // Auto-scroll to today's card on mount
  if (todayCardRef.current) {
    todayCardRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}, []);
```

---

## 7. Integracja API

### 7.1. Endpoint: GET /api/training-plans/active

**Lokalizacja:** `src/pages/api/training-plans/active.ts`

**Status implementacji:** ✅ Już zaimplementowany

**Opis:** Endpoint zwraca aktywny plan treningowy użytkownika z wszystkimi 70 workout days i obliczonymi statystykami ukończenia.

**Request:**

- Metoda: GET
- Authentication: Required (JWT token w cookies)
- Query params: Brak
- Body: Brak

**Response Type (Success 200):**

```typescript
ApiSuccessResponse<TrainingPlanWithWorkoutsDTO>

// Struktura:
{
  data: {
    // TrainingPlan fields
    id: string;
    user_id: string;
    start_date: string;        // "2025-01-08"
    end_date: string;          // "2025-03-18"
    generated_at: string;      // ISO timestamp
    is_active: boolean;        // true
    metadata: any | null;

    // Nested workout_days array (70 elements)
    workout_days: [
      {
        id: string;
        training_plan_id: string;
        day_number: number;          // 1-70
        date: string;                // "2025-01-08"
        workout_description: string; // "Rozgrzewka..." LUB "Odpoczynek"
        is_rest_day: boolean;        // ⭐ Kluczowe dla US-010
        is_completed: boolean;
        completed_at: string | null;
      },
      // ... 69 more days
    ],

    // Calculated stats
    completion_stats: {
      total_workouts: number;        // 50 (example)
      completed_workouts: number;    // 12 (example)
      total_rest_days: number;       // 20 (example)
      completion_percentage: number; // 24 (example)
      is_plan_completed: boolean;    // false
    }
  }
}
```

**Error Responses:**

1. **401 Unauthorized** - Missing/invalid JWT token

   ```typescript
   {
     error: {
       message: "Unauthorized",
       code: "UNAUTHORIZED"
     }
   }
   ```

2. **404 Not Found** - No active plan

   ```typescript
   {
     error: {
       message: "No active training plan found",
       code: "NO_ACTIVE_PLAN"
     }
   }
   ```

   **Frontend handling:** Wyświetl EmptyState component

3. **500 Internal Server Error** - Database error lub incomplete data
   ```typescript
   {
     error: {
       message: "Training plan data is incomplete",
       code: "INCOMPLETE_DATA"
     }
   }
   ```
   **Frontend handling:** ErrorState z retry button

### 7.2. Frontend Integration

**W dashboard.astro (SSR):**

```typescript
---
// Server-side fetch during SSR
const response = await fetch(`${Astro.url.origin}/api/training-plans/active`, {
  headers: {
    // Pass cookies for auth
    Cookie: Astro.request.headers.get('Cookie') || '',
  },
});

let trainingPlan: TrainingPlanWithWorkoutsDTO | null = null;
let error: string | null = null;

if (response.ok) {
  const data: ApiSuccessResponse<TrainingPlanWithWorkoutsDTO> = await response.json();
  trainingPlan = data.data;

  // Validation: Ensure 70 days
  if (trainingPlan.workout_days.length !== 70) {
    error = 'Dane planu są niekompletne';
    trainingPlan = null;
  }
} else if (response.status === 404) {
  // No active plan - will show EmptyState
} else {
  error = 'Nie udało się załadować planu';
}
---

<DashboardLayout title="Twój plan treningowy">
  {error && <ErrorState message={error} />}
  {!error && !trainingPlan && <EmptyState />}
  {!error && trainingPlan && (
    <TrainingPlanView
      client:load
      trainingPlan={trainingPlan}
    />
  )}
</DashboardLayout>
```

### 7.3. Kluczowe punkty dla US-010

**Pole `is_rest_day` w response:**

- Backend ustawia `is_rest_day: true` dla dni odpoczynku
- Dla rest days: `workout_description` zawiera "Odpoczynek"
- Frontend używa `is_rest_day` do conditional rendering checkbox

**Przykład workout_day (rest day):**

```json
{
  "id": "uuid-123",
  "training_plan_id": "uuid-456",
  "day_number": 2,
  "date": "2025-01-09",
  "workout_description": "Odpoczynek",
  "is_rest_day": true, // ⭐ Kluczowe
  "is_completed": false, // Always false for rest days
  "completed_at": null
}
```

**Przykład workout_day (workout day):**

```json
{
  "id": "uuid-789",
  "training_plan_id": "uuid-456",
  "day_number": 1,
  "date": "2025-01-08",
  "workout_description": "Rozgrzewka 10 min, 5x1000m tempo 10K (odpoczynek 2 min), wychłodzenie 10 min",
  "is_rest_day": false, // ⭐ Workout day
  "is_completed": true,
  "completed_at": "2025-01-08T18:30:00Z"
}
```

---

## 8. Interakcje użytkownika

### 8.1. Oznaczanie treningu jako wykonanego (Workout Days)

**User Story:** US-007, US-008

**Scenariusz:**

1. Użytkownik widzi WorkoutDayCard z checkboxem (is_rest_day === false)
2. User klika na checkbox
3. **Natychmiastowy feedback (Optimistic UI):**
   - Checkbox zmienia stan na checked
   - Border karty zmienia kolor na zielony
   - Pojawia się ikona ✓
4. **W tle (asynchronicznie):**
   - API call: PATCH /api/workout-days/:id { is_completed: true }
5. **Success:**
   - Toast notification: "Trening oznaczony jako wykonany"
6. **Error:**
   - Rollback visual changes (checkbox unchecked, border neutral)
   - Toast notification: "Nie udało się zaktualizować. Spróbuj ponownie."

**Kod (w WorkoutDayCard):**

```tsx
{
  !workoutDay.is_rest_day && (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={workoutDay.is_completed}
        onCheckedChange={() => onToggleCompleted(workoutDay.id, workoutDay.is_completed)}
        disabled={updatingId === workoutDay.id}
      />
      <label>Oznacz jako wykonany</label>
    </div>
  );
}
```

### 8.2. Cofanie oznaczenia treningu (Workout Days)

**User Story:** US-008

**Scenariusz:**

1. Użytkownik widzi WorkoutDayCard z checked checkbox
2. User klika na checkbox ponownie
3. **Optimistic UI:**
   - Checkbox zmienia stan na unchecked
   - Border wraca do neutral
   - Ikona ✓ znika
4. **W tle:**
   - API call: PATCH /api/workout-days/:id { is_completed: false }
5. **Success/Error:** Analogicznie jak powyżej

### 8.3. Przeglądanie dni odpoczynku (Rest Days) ⭐ US-010

**User Story:** US-010

**Scenariusz:**

1. Użytkownik scrolluje przez plan treningowy
2. Widzi WorkoutDayCard z `is_rest_day === true`
3. **Wyświetlany content:**
   - Muted background (bg-muted)
   - Ikona 🛌
   - Tekst "Odpoczynek"
   - **BRAK checkbox** (zgodnie z US-010 kryterium 3)
4. **Brak interakcji z marking completed:**
   - User nie może kliknąć checkbox (go nie ma)
   - Nie można oznaczyć rest day jako executed

**Kod (w WorkoutDayCard):**

```tsx
<CardContent>
  {workoutDay.is_rest_day ? (
    // REST DAY - US-010
    <div className="flex items-center gap-3 py-4">
      <span className="text-3xl" role="img" aria-label="Odpoczynek">🛌</span>
      <p className="text-lg text-muted-foreground">Odpoczynek</p>
    </div>
  ) : (
    // WORKOUT DAY
    <p className="text-sm">{workoutDay.workout_description}</p>
  )}
</CardContent>

{/* Footer z checkbox TYLKO dla workout days */}
{!workoutDay.is_rest_day && (
  <CardFooter>
    <Checkbox ... />
  </CardFooter>
)}
```

### 8.4. Expand/Collapse opisu treningu

**Scenariusz:**

1. User widzi truncated workout description (line-clamp-2)
2. User klika "Rozwiń" button
3. Full description wyświetla się
4. User może kliknąć "Zwiń" aby ukryć

**Implementacja:**

```tsx
const [isExpanded, setIsExpanded] = useState(false);

<p className={cn("text-sm", !isExpanded && "line-clamp-2")}>{workoutDay.workout_description}</p>;
{
  !isExpanded && (
    <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)}>
      Rozwiń
    </Button>
  );
}
```

### 8.5. Scrollowanie do dzisiejszego dnia

**Scenariusz:**

1. User wchodzi na stronę Dashboard
2. **Auto-scroll on mount:**
   - Strona automatycznie scrolluje do dzisiejszego WorkoutDayCard
   - Smooth behavior, centered w viewport
3. **Manual scroll (FAB):**
   - Jeśli user scrolluje daleko od today's card
   - FAB button staje się widoczny w prawym dolnym rogu
   - User klika FAB
   - Strona scrolluje do today's card

**Implementacja (auto-scroll):**

```tsx
// W TrainingPlanView
const todayCardRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  todayCardRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
}, []);

// Pass ref to WorkoutDayCard
<WorkoutDayCard
  ref={isToday ? todayCardRef : null}
  isToday={isToday}
  ...
/>
```

### 8.6. Accordion - Expand/Collapse tygodni

**Scenariusz:**

1. User widzi 10 WeekAccordion components
2. Current week jest auto-expanded (zawiera dzisiejszą datę)
3. Pozostałe tygodnie są collapsed
4. User klika na header tygodnia
5. Tydzień się expand/collapse (toggle)
6. **Keyboard:** Enter/Space również toggluje

---

## 9. Warunki i walidacja

### 9.1. Walidacja `is_rest_day` (Kluczowa dla US-010)

**Komponent:** WorkoutDayCard.tsx

**Warunek:** Jeśli `workoutDay.is_rest_day === true`, NIE renderować checkbox

**Implementacja:**

```tsx
// Type guard i conditional rendering
{!workoutDay.is_rest_day && (
  <CardFooter>
    <Checkbox ... />
  </CardFooter>
)}
```

**Zabezpieczenie dodatkowe (w useWorkoutToggle hook):**

```typescript
const toggleCompleted = async (id: string, currentStatus: boolean) => {
  const day = days.find((d) => d.id === id);

  // Zabezpieczenie: nie pozwól na marking rest days
  if (day?.is_rest_day) {
    console.error("Attempted to mark rest day as completed");
    toast({
      title: "Błąd",
      description: "Dni odpoczynku nie można oznaczyć jako wykonane",
      variant: "destructive",
    });
    return;
  }

  // ... rest of logic
};
```

### 9.2. Walidacja 70 dni

**Komponent:** TrainingPlanView.tsx

**Warunek:** `workout_days.length === 70`

**Implementacja:**

```tsx
const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({ trainingPlan }) => {
  // Validation na początku
  if (!trainingPlan.workout_days || trainingPlan.workout_days.length !== 70) {
    return (
      <ErrorState
        message="Plan treningowy jest niekompletny"
        description="Oczekiwano 70 dni, otrzymano: " + (trainingPlan.workout_days?.length || 0)
      />
    );
  }

  // ... rest of component
};
```

### 9.3. Walidacja groupowania tygodni

**Komponent:** TrainingPlanView.tsx

**Warunek:** Każdy tydzień musi mieć dokładnie 7 dni

**Implementacja:**

```typescript
const groupByWeeks = (days: WorkoutDay[]): WorkoutDay[][] => {
  if (days.length !== 70) {
    throw new Error(`Expected 70 days, got ${days.length}`);
  }

  const weeks: WorkoutDay[][] = [];
  for (let i = 0; i < 10; i++) {
    const week = days.slice(i * 7, (i + 1) * 7);
    if (week.length !== 7) {
      throw new Error(`Week ${i + 1} has ${week.length} days, expected 7`);
    }
    weeks.push(week);
  }

  return weeks;
};
```

### 9.4. Walidacja dat

**Komponent:** WorkoutDayCard.tsx, WeekAccordion.tsx

**Warunek:**

- Daty w formacie YYYY-MM-DD
- date field jest string, non-empty
- Dzisiejsza data obliczona poprawnie dla badge "Dzisiaj"

**Implementacja:**

```typescript
// Helper function
const isToday = (dateString: string): boolean => {
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  return dateString === today;
};

// Użycie
const todayDay = workoutDays.find((d) => isToday(d.date));
```

### 9.5. Walidacja stanu checkbox (tylko dla workout days)

**Komponent:** WorkoutDayCard.tsx

**Warunek:**

- Checkbox renderowany TYLKO gdy `is_rest_day === false`
- Checkbox checked gdy `is_completed === true`

**Implementacja:**

```tsx
{
  !workoutDay.is_rest_day && (
    <Checkbox
      checked={workoutDay.is_completed}
      onCheckedChange={() => onToggleCompleted(workoutDay.id, workoutDay.is_completed)}
    />
  );
}
```

---

## 10. Obsługa błędów

### 10.1. Brak aktywnego planu (404)

**Scenariusz:** User nie ma wygenerowanego planu treningowego

**Obsługa:**

- **Lokalizacja:** dashboard.astro (SSR)
- **Wykrycie:** response.status === 404
- **Action:** Renderuj EmptyState component
- **UI:**
  - Message: "Nie masz aktywnego planu treningowego"
  - Button: "Wygeneruj plan" → redirect /survey

**Kod:**

```astro
{
  !trainingPlan && (
    <EmptyState message="Nie masz aktywnego planu treningowego" ctaText="Wygeneruj plan" ctaLink="/survey" />
  )
}
```

### 10.2. Niepełne dane planu (< 70 dni)

**Scenariusz:** Backend zwrócił plan z niepełną liczbą dni

**Obsługa:**

- **Lokalizacja:** TrainingPlanView.tsx
- **Wykrycie:** `workout_days.length !== 70`
- **Action:** Renderuj ErrorState
- **Logging:** console.error + Sentry (opcjonalnie)

**Kod:**

```tsx
if (trainingPlan.workout_days.length !== 70) {
  console.error("Incomplete training plan data", {
    expected: 70,
    received: trainingPlan.workout_days.length,
    planId: trainingPlan.id,
  });

  return <ErrorState message="Dane planu są niekompletne" description="Skontaktuj się z pomocą techniczną" />;
}
```

### 10.3. Błąd API podczas marking completed

**Scenariusz:** PATCH /api/workout-days/:id fails (network error, 500, etc.)

**Obsługa:**

- **Lokalizacja:** useWorkoutToggle hook
- **Wykrycie:** try-catch w toggleCompleted function
- **Action:**
  1. Rollback optimistic update (revert to previous state)
  2. Toast notification z error message
  3. Log error

**Kod:**

```typescript
try {
  const response = await fetch(`/api/workout-days/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_completed: !currentStatus }),
  });

  if (!response.ok) throw new Error("API error");

  toast({ title: "Zaktualizowano" });
} catch (error) {
  // Rollback
  setDays((prevDays) => prevDays.map((d) => (d.id === id ? { ...d, is_completed: currentStatus } : d)));

  // Error toast
  toast({
    title: "Błąd",
    description: "Nie udało się zaktualizować. Spróbuj ponownie.",
    variant: "destructive",
  });

  // Log
  console.error("Failed to toggle workout completion", error);
}
```

### 10.4. Network error podczas initial load

**Scenariusz:** Brak połączenia z internetem / timeout podczas SSR fetch

**Obsługa:**

- **Lokalizacja:** dashboard.astro
- **Wykrycie:** response.status === 500 lub fetch throws
- **Action:** Renderuj ErrorState z retry option

**Kod:**

```astro
{
  error && (
    <ErrorState message="Nie udało się załadować planu" description="Sprawdź połączenie internetowe">
      <Button onClick={() => window.location.reload()}>Spróbuj ponownie</Button>
    </ErrorState>
  )
}
```

### 10.5. Próba oznaczenia rest day jako completed (Edge case)

**Scenariusz:** User próbuje (przez inspektowanie HTML) dodać checkbox do rest day

**Obsługa:**

- **Lokalizacja:** useWorkoutToggle hook (backend zabezpieczenie też istnieje)
- **Wykrycie:** `day.is_rest_day === true` w toggleCompleted
- **Action:** Early return + toast warning

**Kod:**

```typescript
const toggleCompleted = async (id: string, currentStatus: boolean) => {
  const day = days.find((d) => d.id === id);

  if (day?.is_rest_day) {
    console.error("Attempted to mark rest day");
    toast({
      title: "Błąd",
      description: "Dni odpoczynku nie można oznaczyć jako wykonane",
      variant: "destructive",
    });
    return; // Early exit
  }

  // ... proceed with normal logic
};
```

### 10.6. Invalid date format

**Scenariusz:** Backend zwraca date w niepoprawnym formacie

**Obsługa:**

- **Lokalizacja:** WorkoutDayCard.tsx
- **Wykrycie:** Date parsing fails
- **Action:** Fallback display lub skip date display

**Kod:**

```typescript
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error("Invalid date");

    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Invalid date format", dateString);
    return "Data nieznana";
  }
};
```

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

Utwórz następujące pliki i katalogi:

```
src/
├── pages/
│   └── dashboard.astro                          # SSR page
├── components/
│   ├── dashboard/
│   │   ├── TrainingPlanView.tsx                 # Main container
│   │   ├── PlanHeader.tsx                       # Stats header
│   │   ├── WeekAccordion.tsx                    # Week accordion
│   │   ├── WorkoutDayCard.tsx                   # ⭐ Day card (US-010)
│   │   ├── ScrollToTodayFAB.tsx                 # Floating button
│   │   └── EmptyState.tsx                       # No plan state
│   └── hooks/
│       └── useWorkoutToggle.ts                  # Custom hook
└── lib/
    └── utils/
        └── date.ts                              # Date helpers
```

### Krok 2: Dodanie Shadcn/ui components

Zainstaluj wymagane komponenty Shadcn/ui (jeśli jeszcze nie są dodane):

```bash
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add toast
```

### Krok 3: Implementacja helper functions

**Plik:** `src/lib/utils/date.ts`

```typescript
/**
 * Sprawdza czy data jest dzisiaj
 */
export const isToday = (dateString: string): boolean => {
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
};

/**
 * Formatuje datę do polskiego formatu DD.MM.YYYY
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error("Invalid date");

    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Invalid date format", dateString);
    return "Data nieznana";
  }
};

/**
 * Grupuje workout days po tygodniach (7 dni każdy)
 */
export const groupByWeeks = (days: WorkoutDay[]): WorkoutDay[][] => {
  if (days.length !== 70) {
    throw new Error(`Expected 70 days, got ${days.length}`);
  }

  const weeks: WorkoutDay[][] = [];
  for (let i = 0; i < 10; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }
  return weeks;
};
```

### Krok 4: Implementacja custom hook (useWorkoutToggle)

**Plik:** `src/components/hooks/useWorkoutToggle.ts`

Zaimplementuj zgodnie z sekcją 6.3 (Zarządzanie stanem). Hook powinien:

- Zarządzać local state workout days
- Implementować optimistic updates
- Obsługiwać API call PATCH /api/workout-days/:id
- Rollback on error
- Toast notifications
- **Zabezpieczenie:** Blokować marking rest days as completed

### Krok 5: Implementacja WorkoutDayCard ⭐ (Kluczowy dla US-010)

**Plik:** `src/components/dashboard/WorkoutDayCard.tsx`

**Implementacja zgodnie z sekcją 4.4:**

1. **Importy:**

   ```tsx
   import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
   import { Checkbox } from "@/components/ui/checkbox";
   import { Badge } from "@/components/ui/badge";
   import { Button } from "@/components/ui/button";
   import { cn } from "@/lib/utils";
   import { formatDate } from "@/lib/utils/date";
   import type { WorkoutDayCardProps } from "@/types";
   ```

2. **Component structure:**

   ```tsx
   export const WorkoutDayCard = React.forwardRef<HTMLDivElement, WorkoutDayCardProps>(
     ({ workoutDay, onToggleCompleted, isToday }, ref) => {
       const [isExpanded, setIsExpanded] = useState(false);

       // Conditional styling
       const cardClassName = cn(
         "transition-all duration-200",
         workoutDay.is_rest_day && "bg-muted border-muted",
         !workoutDay.is_rest_day && workoutDay.is_completed && "border-green-500",
         !workoutDay.is_rest_day && !workoutDay.is_completed && "border-border",
         isToday && "ring-2 ring-primary"
       );

       return (
         <Card ref={ref} className={cardClassName}>
           {/* ... implementacja zgodnie z sekcją 4.4 ... */}
         </Card>
       );
     }
   );
   ```

3. **Kluczowa conditional logic (US-010):**

   ```tsx
   {
     /* CardContent - CONDITIONAL */
   }
   <CardContent>
     {workoutDay.is_rest_day ? (
       // REST DAY VARIANT
       <div className="flex items-center gap-3 py-4">
         <span className="text-3xl" role="img" aria-label="Odpoczynek">
           🛌
         </span>
         <p className="text-lg text-muted-foreground">Odpoczynek</p>
       </div>
     ) : (
       // WORKOUT DAY VARIANT
       <p className={cn("text-sm", !isExpanded && "line-clamp-2")}>{workoutDay.workout_description}</p>
     )}
   </CardContent>;

   {
     /* CardFooter - ONLY dla workout days */
   }
   {
     !workoutDay.is_rest_day && (
       <CardFooter>
         <Checkbox
           checked={workoutDay.is_completed}
           onCheckedChange={() => onToggleCompleted(workoutDay.id, workoutDay.is_completed)}
         />
         <label>Oznacz jako wykonany</label>
       </CardFooter>
     );
   }
   ```

### Krok 6: Implementacja WeekAccordion

**Plik:** `src/components/dashboard/WeekAccordion.tsx`

Zaimplementuj zgodnie z sekcją 4.3. Komponent powinien:

- Renderować AccordionItem (Shadcn/ui)
- Header z numerem tygodnia i statystykami
- Content z 7x WorkoutDayCard
- Auto-expand jeśli isCurrentWeek === true
- Pass onToggleCompleted do children

### Krok 7: Implementacja PlanHeader

**Plik:** `src/components/dashboard/PlanHeader.tsx`

Zaimplementuj zgodnie z sekcją 4.5. Komponent powinien:

- Wyświetlać daty start/end planu
- Wyświetlać statystyki completion_stats
- Progress bar (Shadcn/ui Progress)
- Card layout dla czytelności

### Krok 8: Implementacja ScrollToTodayFAB

**Plik:** `src/components/dashboard/ScrollToTodayFAB.tsx`

Zaimplementuj zgodnie z sekcją 4.6. Komponent powinien:

- Fixed position (bottom-right)
- IntersectionObserver dla visibility
- onClick → scroll to todayCardRef
- Ikona ArrowDown (lucide-react)

### Krok 9: Implementacja EmptyState

**Plik:** `src/components/dashboard/EmptyState.tsx`

Zaimplementuj zgodnie z sekcją 4.7. Komponent powinien:

- Card z centered content
- Ikona Calendar
- Message + CTA button
- Link do /survey

### Krok 10: Implementacja TrainingPlanView

**Plik:** `src/components/dashboard/TrainingPlanView.tsx`

Zaimplementuj zgodnie z sekcją 4.2. Komponent powinien:

1. Użyć useWorkoutToggle hook
2. Zaimplementować groupByWeeks
3. Renderować PlanHeader
4. Renderować 10x WeekAccordion
5. Renderować ScrollToTodayFAB
6. useEffect dla auto-scroll
7. Walidacja 70 dni

**Kluczowe fragmenty:**

```tsx
export const TrainingPlanView: React.FC<TrainingPlanViewProps> = ({ trainingPlan }) => {
  // Validation
  if (trainingPlan.workout_days.length !== 70) {
    return <ErrorState message="Dane planu niekompletne" />;
  }

  // Custom hook
  const { days: workoutDays, toggleCompleted } = useWorkoutToggle(trainingPlan.workout_days);

  // Group by weeks
  const weeks = useMemo(() => groupByWeeks(workoutDays), [workoutDays]);

  // Today's card ref
  const todayCardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    todayCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // Find today
  const todayIndex = workoutDays.findIndex((d) => isToday(d.date));

  return (
    <div className="container mx-auto py-6">
      <PlanHeader trainingPlan={trainingPlan} completionStats={trainingPlan.completion_stats} />

      <Accordion type="single" collapsible>
        {weeks.map((weekDays, index) => {
          const hasToday = weekDays.some((d) => isToday(d.date));
          return (
            <WeekAccordion
              key={index}
              weekNumber={index + 1}
              workoutDays={weekDays}
              onToggleCompleted={toggleCompleted}
              isCurrentWeek={hasToday}
            />
          );
        })}
      </Accordion>

      <ScrollToTodayFAB todayCardRef={todayCardRef} />
    </div>
  );
};
```

### Krok 11: Implementacja dashboard.astro (SSR page)

**Plik:** `src/pages/dashboard.astro`

Zaimplementuj zgodnie z sekcją 4.1 i 7.2. Page powinna:

1. SSR fetch GET /api/training-plans/active
2. Handle 404 (no plan) → EmptyState
3. Handle 500 (error) → ErrorState
4. Pass data as props do TrainingPlanView
5. client:load directive dla React component

### Krok 12: Testowanie funkcjonalności

**Testy manualne:**

1. **Test US-010 - Rest Days:**
   - [ ] Rest days mają muted background
   - [ ] Rest days wyświetlają ikonę 🛌
   - [ ] Rest days wyświetlają tekst "Odpoczynek"
   - [ ] Rest days NIE MAJĄ checkbox
   - [ ] Nie można oznaczyć rest day jako completed

2. **Test workout days:**
   - [ ] Workout days mają checkbox
   - [ ] Kliknięcie checkbox oznacza jako completed
   - [ ] Visual feedback (green border)
   - [ ] Toast notification
   - [ ] Rollback on error

3. **Test groupowania:**
   - [ ] Plan ma 10 accordion items (tygodni)
   - [ ] Każdy tydzień ma 7 WorkoutDayCard
   - [ ] Current week auto-expanded

4. **Test auto-scroll:**
   - [ ] Page ładuje się z scroll do today's card
   - [ ] Today's card ma badge "Dzisiaj"
   - [ ] FAB scrolluje do today's card

5. **Test empty state:**
   - [ ] Brak planu → EmptyState wyświetlony
   - [ ] Button "Wygeneruj plan" działa

### Krok 13: Obsługa accessibility

Dodaj ARIA attributes i semantic HTML:

1. **WorkoutDayCard:**
   - [ ] `role="article"` dla Card
   - [ ] `aria-label` dla checkbox
   - [ ] `aria-describedby` dla workout description
   - [ ] `aria-label="Odpoczynek"` dla rest day icon

2. **WeekAccordion:**
   - [ ] `aria-expanded` dla accordion trigger
   - [ ] `aria-controls` dla accordion content

3. **Keyboard navigation:**
   - [ ] Tab order logiczny
   - [ ] Enter/Space dla checkbox
   - [ ] Enter/Space dla accordion toggle

### Krok 14: Styling i responsive design

1. **Tailwind classes:**
   - [ ] Mobile: Full-width cards, stacked layout
   - [ ] Tablet: Max-width container
   - [ ] Desktop: Centered layout, max 1280px

2. **Touch targets:**
   - [ ] Checkbox min 44x44px
   - [ ] Accordion trigger min 48px height

3. **Visual states:**
   - [ ] Rest: muted (bg-muted, text-muted-foreground)
   - [ ] Pending: neutral (border-border)
   - [ ] Completed: success (border-green-500, bg-green-50/50)
   - [ ] Today: primary ring (ring-2 ring-primary)

### Krok 15: Dokumentacja i finalizacja

1. Dodaj JSDoc comments do wszystkich komponentów
2. Update CLAUDE.md jeśli potrzebne
3. Commit z opisem: "feat: implement dashboard view with rest days support (US-010)"
4. Verify wszystkie acceptance criteria US-010 są spełnione

---

## 12. Checklist akceptacji (US-010)

Po implementacji, zweryfikuj wszystkie kryteria akceptacji:

- [ ] **US-010.1:** Dni bez treningu są reprezentowane przez dedykowany kafelek (WorkoutDayCard z conditional rendering)
- [ ] **US-010.2:** Kafelek dnia wolnego zawiera informację "Odpoczynek" (tekst + ikona 🛌)
- [ ] **US-010.3:** Kafelek dnia wolnego NIE POSIADA opcji oznaczenia jako "wykonany" (checkbox nie renderowany)

**Dodatkowe verification:**

- [ ] Conditional rendering działa poprawnie (is_rest_day === true)
- [ ] Styling rest days jest wyraźnie różny (muted background)
- [ ] Użytkownik nie może oznaczyć rest day (zabezpieczenie w hook + brak UI)
- [ ] Backend constraint zabezpiecza przed marking rest days (już zaimplementowane)

---

**Koniec planu implementacji**
