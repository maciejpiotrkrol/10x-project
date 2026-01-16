# Plan implementacji widoku Dashboard - Oznaczanie treningów jako wykonanych

## 1. Przegląd

Widok Dashboard umożliwia użytkownikom przeglądanie swojego 10-tygodniowego planu treningowego oraz oznaczanie poszczególnych treningów jako wykonanych. Widok implementuje pattern Optimistic UI, zapewniając natychmiastowy feedback użytkownikowi przy zachowaniu spójności danych z backendem. Każdy trening może być oznaczony jako wykonany lub niewykonany poprzez interakcję z checkboxem, przy czym dni odpoczynku nie mogą być oznaczane.

**Kluczowe funkcjonalności:**
- Wyświetlanie 70 dni treningowych pogrupowanych w 10 tygodni (accordion)
- Oznaczanie treningu jako wykonanego (toggle checkbox)
- Cofanie oznaczenia treningu jako wykonanego (ten sam checkbox)
- Optimistic UI updates z rollback w przypadku błędu
- Auto-scroll do dzisiejszego dnia po załadowaniu strony
- Wizualne rozróżnienie stanów: rest day, pending workout, completed workout
- Toast notifications dla feedbacku użytkownika

## 2. Routing widoku

**Ścieżka:** `/dashboard`

**Ochrona:** Protected route (wymaga autentykacji)

**Middleware logic:**
- Sprawdzenie czy użytkownik jest zalogowany
- Jeśli nie ma profilu → redirect do `/survey`
- Jeśli nie ma aktywnego planu → wyświetlenie EmptyState z CTA do `/survey`

## 3. Struktura komponentów

```
DashboardLayout.astro (SSR)
└── TrainingPlanView.tsx (React - client:load)
    ├── PlanHeader.tsx
    │   ├── PlanStats.tsx
    │   └── Progress.tsx (Shadcn/ui)
    ├── WeekAccordion.tsx[] (x10)
    │   └── WorkoutDayCard.tsx[] (x7 per week)
    │       ├── Card (Shadcn/ui)
    │       ├── Checkbox (Shadcn/ui) [jeśli !is_rest_day]
    │       └── Badge (Shadcn/ui)
    └── ScrollToTodayFAB.tsx
```

**Hierarchia:**
1. **DashboardLayout.astro** - Layout strony z nawigacją (SSR)
2. **TrainingPlanView.tsx** - Główny kontener planu (React, zarządzanie stanem)
3. **WeekAccordion.tsx** - Accordion dla pojedynczego tygodnia (React)
4. **WorkoutDayCard.tsx** - Kafelek pojedynczego dnia (React)
5. **PlanHeader.tsx** - Nagłówek z statystykami (React)
6. **ScrollToTodayFAB.tsx** - Floating Action Button do scrollowania (React)

## 4. Szczegóły komponentów

### 4.1. DashboardLayout.astro

**Opis komponentu:**
Layout aplikacji dla chronionych stron. Zawiera nawigację (Navbar na desktop, BottomNav na mobile), główną sekcję content oraz renderuje komponenty React z danymi pobranymi server-side.

**Główne elementy:**
- `<Layout>` - bazowy layout z meta tags
- `<Navbar>` - górna nawigacja (desktop/tablet)
- `<main>` - główna sekcja content
- `<TrainingPlanView client:load>` - React component z danymi SSR
- `<BottomNav client:load>` - dolna nawigacja (mobile)

**Obsługiwane zdarzenia:**
- Brak (statyczny layout)

**Warunki walidacji:**
- Sprawdzenie czy użytkownik jest zalogowany (middleware)
- Sprawdzenie czy ma profil (redirect do `/survey` jeśli nie)
- Sprawdzenie czy ma aktywny plan (wyświetlenie EmptyState jeśli nie)

**Typy:**
- `Astro.locals.supabase: SupabaseClient`
- `trainingPlan: TrainingPlanWithWorkoutsDTO | null`

**Propsy:**
- Brak (Astro page component)

**Kod szkieletowy:**
```astro
---
// Fetch active training plan server-side
const { data: trainingPlan } = await Astro.locals.supabase
  .from('training_plans')
  .select(`
    *,
    workout_days(*)
  `)
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single();
---

<Layout title="Dashboard - Athletica">
  <Navbar />
  <main class="container mx-auto px-4 py-8">
    {trainingPlan ? (
      <TrainingPlanView
        client:load
        trainingPlan={trainingPlan}
      />
    ) : (
      <EmptyState />
    )}
  </main>
  <BottomNav client:load />
</Layout>
```

---

### 4.2. TrainingPlanView.tsx

**Opis komponentu:**
Główny kontener widoku planu treningowego. Zarządza stanem workout days z implementacją Optimistic UI pattern. Grupuje workout days po tygodniach i przekazuje je do komponentów WeekAccordion. Odpowiada za API calls do oznaczania treningów jako wykonanych.

**Główne elementy:**
- `PlanHeader` - nagłówek z statystykami
- Array of `WeekAccordion` components (10 sztuk)
- `ScrollToTodayFAB` - floating action button
- `Toast` provider (Shadcn/ui)

**Obsługiwane zdarzenia:**
- `onToggleCompleted(id: string, currentStatus: boolean)` - toggle workout completion

**Obsługiwana walidacja:**
- Sprawdzenie czy workout nie jest rest day przed API call
- Walidacja response z API (status codes)
- Rollback przy błędzie

**Typy:**
- `TrainingPlanViewProps` - props komponentu
- `WorkoutDay[]` - tablica workout days
- `Map<number, WorkoutDay[]>` - workout days pogrupowane po tygodniach

**Propsy:**
```typescript
interface TrainingPlanViewProps {
  trainingPlan: TrainingPlanWithWorkoutsDTO;
}
```

**Custom hooks:**
- `useOptimisticWorkouts(initialWorkouts: WorkoutDay[])`
- `useScrollToToday(workoutDays: WorkoutDay[])`

**Logika implementacji:**
```typescript
// 1. Grupowanie workout days po tygodniach
const groupByWeeks = (workouts: WorkoutDay[]): Map<number, WorkoutDay[]> => {
  const weeks = new Map<number, WorkoutDay[]>();
  workouts.forEach(workout => {
    const weekNumber = Math.ceil(workout.day_number / 7);
    if (!weeks.has(weekNumber)) {
      weeks.set(weekNumber, []);
    }
    weeks.get(weekNumber)!.push(workout);
  });
  return weeks;
};

// 2. Toggle completion handler (optimistic)
const handleToggleCompleted = async (id: string, currentStatus: boolean) => {
  const newStatus = !currentStatus;

  // Optimistic update
  setWorkouts(prev => prev.map(w =>
    w.id === id
      ? { ...w, is_completed: newStatus, completed_at: newStatus ? new Date().toISOString() : null }
      : w
  ));

  try {
    // API call
    const response = await fetch(`/api/workout-days/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: newStatus })
    });

    if (!response.ok) {
      throw new Error('Failed to update workout');
    }

    // Success toast
    toast({
      title: newStatus ? "Trening oznaczony jako wykonany" : "Oznaczenie cofnięte",
      variant: "default"
    });
  } catch (error) {
    // Rollback optimistic update
    setWorkouts(prev => prev.map(w =>
      w.id === id
        ? { ...w, is_completed: currentStatus, completed_at: currentStatus ? w.completed_at : null }
        : w
    ));

    // Error toast
    toast({
      title: "Błąd",
      description: "Nie udało się zaktualizować. Spróbuj ponownie.",
      variant: "destructive"
    });
  }
};
```

---

### 4.3. WeekAccordion.tsx

**Opis komponentu:**
Komponent accordion dla pojedynczego tygodnia treningowego. Wyświetla nagłówek z numerem tygodnia i statystykami wykonanych treningów (X/Y). Zawiera 7 komponentów WorkoutDayCard w collapsible content.

**Główne elementy:**
- `Accordion` (Shadcn/ui)
- `AccordionItem`
- `AccordionTrigger` - nagłówek z tekstem "Tydzień X: Y/Z wykonanych"
- `AccordionContent` - lista 7x WorkoutDayCard

**Obsługiwane zdarzenia:**
- Przekazuje `onToggleCompleted` do WorkoutDayCard
- Accordion expand/collapse (wbudowane w Shadcn)

**Obsługiwana walidacja:**
- Brak (przekazuje do dzieci)

**Typy:**
- `WeekAccordionProps`
- `WorkoutDay[]`

**Propsy:**
```typescript
interface WeekAccordionProps {
  weekNumber: number;
  workoutDays: WorkoutDay[]; // 7 dni
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isCurrentWeek?: boolean; // czy tydzień zawiera dzisiejszy dzień
}
```

**Logika implementacji:**
```typescript
const WeekAccordion: React.FC<WeekAccordionProps> = ({
  weekNumber,
  workoutDays,
  onToggleCompleted,
  isCurrentWeek = false
}) => {
  // Obliczenie statystyk tygodnia
  const totalWorkouts = workoutDays.filter(w => !w.is_rest_day).length;
  const completedWorkouts = workoutDays.filter(w => w.is_completed).length;

  return (
    <AccordionItem value={`week-${weekNumber}`} defaultOpen={isCurrentWeek}>
      <AccordionTrigger>
        Tydzień {weekNumber}: {completedWorkouts}/{totalWorkouts} wykonanych
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {workoutDays.map(workout => (
            <WorkoutDayCard
              key={workout.id}
              workoutDay={workout}
              onToggleCompleted={onToggleCompleted}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
```

---

### 4.4. WorkoutDayCard.tsx

**Opis komponentu:**
Kafelek reprezentujący pojedynczy dzień treningowy. Wyświetla datę, numer dnia, opis treningu oraz checkbox do oznaczenia jako wykonany (jeśli nie jest rest day). Obsługuje 3 stany wizualne: rest day, pending workout, completed workout. Implementuje expand/collapse dla pełnego opisu treningu.

**Główne elementy:**
- `Card` (Shadcn/ui) - kontener
- `CardHeader` - data i numer dnia
- `CardContent` - opis treningu (truncated lub pełny)
- `CardFooter` - checkbox (jeśli !is_rest_day)
- `Badge` - wskaźnik statusu
- `Checkbox` (Shadcn/ui) - do oznaczenia jako wykonany

**Obsługiwane zdarzenia:**
- `onClick` na Card - toggle expand/collapse
- `onChange` na Checkbox - wywołanie `onToggleCompleted`

**Obsługiwana walidacja:**
- `is_rest_day === true` → nie renderuj checkbox, pokaż "Odpoczynek", disabled styling
- `is_rest_day === false` → renderuj checkbox, enable interaction

**Typy:**
- `WorkoutDayCardProps`
- `WorkoutDay`

**Propsy:**
```typescript
interface WorkoutDayCardProps {
  workoutDay: WorkoutDay;
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
}
```

**Stany wizualne:**
```typescript
// Rest Day
- Background: muted (bg-muted)
- Border: neutral (border-gray-200)
- Icon: 🛌
- Text: "Odpoczynek"
- Checkbox: nie renderowany

// Pending Workout
- Background: white (bg-white)
- Border: neutral (border-gray-300)
- Icon: brak
- Checkbox: unchecked

// Completed Workout
- Background: white (bg-white)
- Border: green (border-green-500)
- Icon: ✓ (text-green-600)
- Checkbox: checked
```

**Logika implementacji:**
```typescript
const WorkoutDayCard: React.FC<WorkoutDayCardProps> = ({
  workoutDay,
  onToggleCompleted
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent card expand

    if (workoutDay.is_rest_day) return; // Extra safety check

    setIsUpdating(true);
    await onToggleCompleted(workoutDay.id, workoutDay.is_completed);
    setIsUpdating(false);
  };

  const toggleExpand = () => setIsExpanded(prev => !prev);

  // Format date
  const formattedDate = new Date(workoutDay.date).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Determine card styling based on state
  const cardClassName = cn(
    "cursor-pointer transition-all",
    workoutDay.is_rest_day && "bg-muted",
    workoutDay.is_completed && !workoutDay.is_rest_day && "border-green-500 border-2",
    !workoutDay.is_completed && !workoutDay.is_rest_day && "border-gray-300"
  );

  return (
    <Card className={cardClassName} onClick={toggleExpand}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <p className="text-xs text-muted-foreground">Dzień {workoutDay.day_number}/70</p>
          </div>
          {workoutDay.is_completed && (
            <Badge variant="default" className="bg-green-500">
              <Check className="w-4 h-4 mr-1" />
              Wykonano
            </Badge>
          )}
          {workoutDay.is_rest_day && (
            <Badge variant="secondary">
              🛌 Odpoczynek
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {workoutDay.is_rest_day ? (
          <p className="text-muted-foreground">Dzień wolny od treningów</p>
        ) : (
          <div className={cn(
            "prose prose-sm",
            !isExpanded && "line-clamp-2"
          )}>
            {workoutDay.workout_description}
          </div>
        )}
      </CardContent>

      {!workoutDay.is_rest_day && (
        <CardFooter>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`workout-${workoutDay.id}`}
              checked={workoutDay.is_completed}
              onCheckedChange={handleCheckboxChange}
              disabled={isUpdating}
            />
            <label
              htmlFor={`workout-${workoutDay.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              onClick={(e) => e.stopPropagation()}
            >
              {workoutDay.is_completed ? "Oznaczono jako wykonane" : "Oznacz jako wykonane"}
            </label>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
```

---

### 4.5. PlanHeader.tsx

**Opis komponentu:**
Nagłówek planu treningowego wyświetlający kluczowe informacje: tytuł planu, zakres dat (start → end), oraz statystyki wykonania (X/Y treningów, procent ukończenia, progress bar).

**Główne elementy:**
- `Card` (Shadcn/ui)
- Tytuł: "Twój plan treningowy"
- Daty: "DD.MM.YYYY - DD.MM.YYYY"
- Statystyki:
  - "Wykonane treningi: X/Y"
  - "Procent ukończenia: Z%"
- `Progress` component (Shadcn/ui) - wizualizacja postępu

**Obsługiwane zdarzenia:**
- Brak (read-only display)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `PlanHeaderProps`
- `CompletionStatsDTO`

**Propsy:**
```typescript
interface PlanHeaderProps {
  trainingPlan: TrainingPlanDTO;
  completionStats: CompletionStatsDTO;
}
```

---

### 4.6. ScrollToTodayFAB.tsx

**Opis komponentu:**
Floating Action Button w prawym dolnym rogu ekranu. Umożliwia szybki scroll do dzisiejszego dnia. Pojawia się tylko gdy today's card nie jest w viewport (ukrywa się automatycznie gdy today's card jest widoczny).

**Główne elementy:**
- `Button` (Shadcn/ui) - circular FAB
- Icon: `ArrowDown` (lucide-react)
- Text: "Dzisiaj"

**Obsługiwane zdarzenia:**
- `onClick` - scroll to today's card (smooth scroll)

**Obsługiwana walidacja:**
- Sprawdzenie czy today's card jest w viewport (IntersectionObserver)
- Ukryj FAB jeśli today's card jest widoczny

**Typy:**
- `ScrollToTodayFABProps`

**Propsy:**
```typescript
interface ScrollToTodayFABProps {
  todayCardRef: React.RefObject<HTMLDivElement>;
}
```

**Logika implementacji:**
```typescript
const ScrollToTodayFAB: React.FC<ScrollToTodayFABProps> = ({ todayCardRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Pokaż FAB gdy today's card nie jest w viewport
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (todayCardRef.current) {
      observer.observe(todayCardRef.current);
    }

    return () => observer.disconnect();
  }, [todayCardRef]);

  const scrollToToday = () => {
    todayCardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      className="fixed bottom-20 right-6 rounded-full shadow-lg"
      size="lg"
      onClick={scrollToToday}
    >
      <ArrowDown className="mr-2 h-5 w-5" />
      Dzisiaj
    </Button>
  );
};
```

---

## 5. Typy

### 5.1. Entity Types (z database.types.ts)

```typescript
// Już zdefiniowane w src/types.ts

/**
 * Workout Day Entity - pojedynczy dzień treningowy
 */
type WorkoutDay = {
  id: string; // uuid
  training_plan_id: string; // uuid
  day_number: number; // 1-70
  date: string; // ISO date (YYYY-MM-DD)
  workout_description: string | null; // opis treningu lub null dla rest days
  is_rest_day: boolean; // czy dzień odpoczynku
  is_completed: boolean; // czy trening wykonany
  completed_at: string | null; // ISO datetime lub null
};

/**
 * Training Plan Entity - plan treningowy
 */
type TrainingPlan = {
  id: string; // uuid
  user_id: string; // uuid
  start_date: string; // ISO date
  end_date: string; // ISO date (start_date + 70 dni)
  goal_distance: DistanceType; // "5K" | "10K" | "Half Marathon" | "Marathon"
  is_active: boolean; // czy plan aktywny
  is_plan_completed: boolean; // czy plan ukończony
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
};

/**
 * Training Plan with Workouts DTO
 */
type TrainingPlanWithWorkoutsDTO = TrainingPlan & {
  workout_days: WorkoutDay[]; // 70 dni
  completion_stats: CompletionStatsDTO;
};

/**
 * Completion Stats DTO - statystyki wykonania
 */
interface CompletionStatsDTO {
  total_workouts: number; // łączna liczba treningów (bez rest days)
  completed_workouts: number; // liczba wykonanych treningów
  total_rest_days: number; // liczba dni odpoczynku
  completion_percentage: number; // procent ukończenia (0-100)
  is_plan_completed: boolean; // czy plan ukończony
}
```

### 5.2. ViewModel Types (nowe)

```typescript
/**
 * Props dla TrainingPlanView
 */
interface TrainingPlanViewProps {
  trainingPlan: TrainingPlanWithWorkoutsDTO;
}

/**
 * Props dla WeekAccordion
 */
interface WeekAccordionProps {
  weekNumber: number; // 1-10
  workoutDays: WorkoutDay[]; // 7 dni tego tygodnia
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isCurrentWeek?: boolean; // czy tydzień zawiera dzisiejszy dzień
}

/**
 * Props dla WorkoutDayCard
 */
interface WorkoutDayCardProps {
  workoutDay: WorkoutDay;
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isToday?: boolean; // czy to dzisiejszy dzień (dla ref)
}

/**
 * Props dla PlanHeader
 */
interface PlanHeaderProps {
  trainingPlan: TrainingPlan;
  completionStats: CompletionStatsDTO;
}

/**
 * Props dla ScrollToTodayFAB
 */
interface ScrollToTodayFABProps {
  todayCardRef: React.RefObject<HTMLDivElement>;
}
```

### 5.3. API Request/Response Types

```typescript
/**
 * PATCH /api/workout-days/:id Request Body
 */
interface UpdateWorkoutDayRequest {
  is_completed: boolean;
}

/**
 * PATCH /api/workout-days/:id Response (Success 200)
 */
interface UpdateWorkoutDayResponse {
  data: WorkoutDay;
}

/**
 * PATCH /api/workout-days/:id Error Response
 */
interface UpdateWorkoutDayErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}
```

---

## 6. Zarządzanie stanem

### 6.1. Struktura stanu

Stan w komponencie `TrainingPlanView`:

```typescript
// Workout days z optimistic updates
const [workouts, setWorkouts] = useState<WorkoutDay[]>(
  trainingPlan.workout_days
);

// Ref do dzisiejszego dnia (dla auto-scroll i FAB)
const todayCardRef = useRef<HTMLDivElement>(null);

// Flaga updating (optional - dla disablowania UI podczas update)
const [updatingWorkoutId, setUpdatingWorkoutId] = useState<string | null>(null);
```

### 6.2. Custom Hook: useOptimisticWorkouts

**Cel:** Enkapsulacja logiki optimistic updates dla workout completion.

**Implementacja:**

```typescript
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { WorkoutDay } from '@/types';

interface UseOptimisticWorkoutsReturn {
  workouts: WorkoutDay[];
  toggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isUpdating: (id: string) => boolean;
}

export function useOptimisticWorkouts(
  initialWorkouts: WorkoutDay[]
): UseOptimisticWorkoutsReturn {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>(initialWorkouts);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleCompleted = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Znajdź workout
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    // Nie pozwól na oznaczenie rest day
    if (workout.is_rest_day) {
      toast({
        title: "Błąd",
        description: "Dni odpoczynku nie mogą być oznaczone jako wykonane",
        variant: "destructive",
      });
      return;
    }

    // Mark as updating
    setUpdatingIds(prev => new Set(prev).add(id));

    // Optimistic update
    setWorkouts(prev =>
      prev.map(w =>
        w.id === id
          ? {
              ...w,
              is_completed: newStatus,
              completed_at: newStatus ? new Date().toISOString() : null,
            }
          : w
      )
    );

    try {
      // API call
      const response = await fetch(`/api/workout-days/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_completed: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update workout');
      }

      // Success toast
      toast({
        title: newStatus ? "Trening oznaczony jako wykonany" : "Oznaczenie cofnięte",
        variant: "default",
      });
    } catch (error) {
      // Rollback optimistic update
      setWorkouts(prev =>
        prev.map(w =>
          w.id === id
            ? {
                ...w,
                is_completed: currentStatus,
                completed_at: currentStatus ? workout.completed_at : null,
              }
            : w
        )
      );

      // Error toast
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się zaktualizować. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      // Remove from updating
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const isUpdating = (id: string) => updatingIds.has(id);

  return { workouts, toggleCompleted, isUpdating };
}
```

### 6.3. Custom Hook: useScrollToToday

**Cel:** Auto-scroll do dzisiejszego dnia po załadowaniu strony.

**Implementacja:**

```typescript
import { useEffect, useRef } from 'react';
import type { WorkoutDay } from '@/types';

export function useScrollToToday(workoutDays: WorkoutDay[]) {
  const todayCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to today's card on mount
    const timer = setTimeout(() => {
      todayCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 500); // Delay dla lepszej UX (pozwól stronie się załadować)

    return () => clearTimeout(timer);
  }, []); // Run only on mount

  // Find today's workout
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayWorkout = workoutDays.find(w => w.date === today);

  return { todayCardRef, todayWorkout };
}
```

---

## 7. Integracja API

### 7.1. Endpoint: PATCH /api/workout-days/:id

**Opis:** Aktualizacja statusu wykonania pojedynczego workout day.

**URL:** `/api/workout-days/:id`

**Method:** PATCH

**Authentication:** Required (JWT token via Supabase session)

**Path Parameters:**
- `id` (string, uuid) - ID workout day do aktualizacji

**Request Headers:**
```typescript
{
  'Content-Type': 'application/json'
}
```

**Request Body:**
```typescript
{
  is_completed: boolean // true - oznacz jako wykonany, false - cofnij oznaczenie
}
```

**Validation Rules:**
1. `is_completed` - Required, must be boolean
2. Cannot mark rest days as completed (enforced by database constraint)

**Response Success (200 OK):**
```typescript
{
  data: {
    id: "uuid",
    training_plan_id: "uuid",
    day_number: 5,
    date: "2025-01-12",
    workout_description: "Easy run 8km, conversational pace",
    is_rest_day: false,
    is_completed: true,
    completed_at: "2025-01-12T19:15:00Z"
  }
}
```

**Response Errors:**

1. **400 Bad Request** - Invalid input lub próba oznaczenia rest day
```typescript
{
  error: {
    message: "Validation failed" | "Rest days cannot be marked as completed",
    code?: "REST_DAY_COMPLETION_NOT_ALLOWED",
    details?: [
      {
        field: "is_completed",
        message: "is_completed must be a boolean"
      }
    ]
  }
}
```

2. **401 Unauthorized** - Brak/nieprawidłowy token
```typescript
{
  error: {
    message: "Unauthorized"
  }
}
```

3. **404 Not Found** - Workout nie istnieje lub należy do innego użytkownika (RLS)
```typescript
{
  error: {
    message: "Workout day not found",
    code: "WORKOUT_DAY_NOT_FOUND"
  }
}
```

4. **500 Internal Server Error** - Błąd serwera
```typescript
{
  error: {
    message: "Internal server error"
  }
}
```

### 7.2. Przykład użycia w kodzie

```typescript
// W komponencie WorkoutDayCard lub custom hook

const toggleWorkoutCompletion = async (
  workoutId: string,
  newStatus: boolean
): Promise<WorkoutDay> => {
  const response = await fetch(`/api/workout-days/${workoutId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      is_completed: newStatus,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update workout');
  }

  const result = await response.json();
  return result.data;
};
```

---

## 8. Interakcje użytkownika

### 8.1. Kliknięcie checkbox "Oznacz jako wykonany"

**Trigger:** User klika checkbox na WorkoutDayCard (nie rest day)

**Flow:**
1. `onChange` event na Checkbox
2. Wywołanie `handleToggleCompleted(workoutId, currentStatus)`
3. **Optimistic update:**
   - Natychmiastowa zmiana `is_completed` w local state
   - Natychmiastowa zmiana `completed_at` (NOW() lub NULL)
   - Wizualna zmiana: border color, icon ✓, checked checkbox
4. **API call:** PATCH `/api/workout-days/:id` { is_completed: !currentStatus }
5. **Success:**
   - Toast notification: "Trening oznaczony jako wykonany" lub "Oznaczenie cofnięte"
   - Zachowanie optimistic update
   - Aktualizacja statystyk w PlanHeader (recalculation)
6. **Error:**
   - Rollback optimistic update (powrót do previous state)
   - Toast notification: "Błąd: [message]. Spróbuj ponownie."

**Expected result:**
- Natychmiastowy feedback (optimistic UI)
- Zmiana koloru bordera kafelka (neutral → green lub green → neutral)
- Pojawienie się/zniknięcie ikony ✓
- Zmiana tekstu checkbox label
- Aktualizacja statystyk wykonania w headerze
- Toast notification potwierdzający akcję lub błąd

---

### 8.2. Kliknięcie na WorkoutDayCard (expand/collapse)

**Trigger:** User klika na obszar Card (poza checkboxem)

**Flow:**
1. `onClick` event na Card
2. Toggle local state `isExpanded`
3. Conditional rendering: pokaż pełny opis lub truncated (line-clamp-2)

**Expected result:**
- Rozwinięcie/zwinięcie opisu treningu
- Animacja transition (smooth)
- Brak wpływu na completion status

---

### 8.3. Kliknięcie FAB "Dzisiaj"

**Trigger:** User klika Floating Action Button w prawym dolnym rogu

**Flow:**
1. `onClick` event na Button
2. Wywołanie `scrollToToday()`
3. Smooth scroll do today's card: `todayCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })`

**Expected result:**
- Płynne przewinięcie do dzisiejszego dnia
- Today's card wycentrowany w viewport
- FAB automatycznie znika (IntersectionObserver)

---

### 8.4. Próba oznaczenia rest day jako wykonany

**Trigger:** User próbuje kliknąć checkbox na rest day (edge case, nie powinno być możliwe)

**Flow:**
1. Checkbox nie jest renderowany dla rest days
2. Jeśli jakoś zostanie wywołane (edge case): walidacja w `handleToggleCompleted`
3. Early return + toast error: "Dni odpoczynku nie mogą być oznaczone jako wykonane"

**Expected result:**
- Brak zmiany stanu
- Toast notification z błędem
- Visual cue: rest day ma muted styling i brak checkboxa

---

## 9. Warunki i walidacja

### 9.1. Warunek: Czy workout day jest rest day?

**Komponenty:** WorkoutDayCard

**Walidacja:**
```typescript
if (workoutDay.is_rest_day === true) {
  // NIE renderuj checkbox
  // Pokaż Badge "🛌 Odpoczynek"
  // Muted styling (bg-muted)
  // Disabled state
}
```

**Wpływ na UI:**
- Brak checkboxa w CardFooter
- Badge z ikoną 🛌 i tekstem "Odpoczynek"
- Muted background color
- Tekst: "Dzień wolny od treningów"
- Nie można oznaczyć jako wykonany

---

### 9.2. Warunek: Czy workout jest już wykonany?

**Komponenty:** WorkoutDayCard, WeekAccordion (statystyki)

**Walidacja:**
```typescript
if (workoutDay.is_completed === true) {
  // Checkbox: checked state
  // Border: green (border-green-500)
  // Badge: "✓ Wykonano" (green)
  // Label: "Oznaczono jako wykonane"
}
```

**Wpływ na UI:**
- Zielony border kafelka
- Checked checkbox
- Badge "Wykonano" z ikoną ✓
- Zmiana label tekstu
- Aktualizacja statystyk tygodnia (X+1/Y)

---

### 9.3. Warunek: Czy workout należy do zalogowanego użytkownika?

**Komponenty:** Backend (RLS policy)

**Walidacja:** Enforced przez Row Level Security na poziomie database

```sql
-- RLS policy sprawdza ownership:
EXISTS (
  SELECT 1 FROM training_plans
  WHERE training_plans.id = workout_days.training_plan_id
  AND training_plans.user_id = auth.uid()
)
```

**Wpływ na UI:**
- Jeśli user nie jest właścicielem: API zwraca 404 (RLS blocks)
- Frontend: rollback optimistic update + toast error
- Security: nie ujawniamy czy workout istnieje (404 dla obu przypadków)

---

### 9.4. Warunek: Czy API call się powiódł?

**Komponenty:** useOptimisticWorkouts hook

**Walidacja:**
```typescript
if (!response.ok) {
  // Rollback optimistic update
  // Toast error notification
  // Log error (console + optional Sentry)
  throw new Error(error.error?.message || 'Failed to update workout');
}
```

**Wpływ na UI:**
- Rollback do previous state
- Toast destructive: "Błąd: [message]"
- Statystyki nie zmieniają się (rollback)

---

### 9.5. Warunek: Czy jest dzisiaj?

**Komponenty:** TrainingPlanView, WorkoutDayCard

**Walidacja:**
```typescript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const isToday = workoutDay.date === today;
```

**Wpływ na UI:**
- Auto-scroll do tego dnia po mount
- Ref przypisany do tego WorkoutDayCard
- Opcjonalnie: dodatkowy visual indicator (badge "Dzisiaj")
- FAB scroll docelowo do tego kafelka

---

### 9.6. Warunek: Czy today's card jest w viewport?

**Komponenty:** ScrollToTodayFAB

**Walidacja:**
```typescript
// IntersectionObserver
const observer = new IntersectionObserver(
  ([entry]) => {
    setIsVisible(!entry.isIntersecting); // Pokaż FAB gdy NOT in viewport
  },
  { threshold: 0.5 }
);
```

**Wpływ na UI:**
- FAB visible gdy today's card nie jest widoczny
- FAB hidden gdy today's card jest w viewport
- Smooth transition (fade in/out)

---

## 10. Obsługa błędów

### 10.1. Błąd 400: Próba oznaczenia rest day jako wykonany

**Scenario:** User/backend próbuje oznaczyć rest day (błąd walidacji lub constraint violation)

**Obsługa:**
```typescript
if (dbError.code === '23514') { // CHECK constraint violation
  return errorResponse(
    "Rest days cannot be marked as completed",
    400,
    "REST_DAY_COMPLETION_NOT_ALLOWED"
  );
}
```

**Frontend handling:**
- Rollback optimistic update
- Toast: "Dni odpoczynku nie mogą być oznaczone jako wykonane"
- Visual cue: checkbox nie renderowany dla rest days (prevention)

---

### 10.2. Błąd 401: Sesja wygasła

**Scenario:** JWT token wygasł lub jest nieprawidłowy

**Obsługa:**
```typescript
if (response.status === 401) {
  // Redirect do login page
  window.location.href = '/auth/login';

  // Toast (opcjonalne, może być wyświetlony przed redirect)
  toast({
    title: "Sesja wygasła",
    description: "Zaloguj się ponownie",
    variant: "destructive",
  });
}
```

**Frontend handling:**
- Rollback optimistic update
- Redirect do `/auth/login`
- Toast notification (przed redirect)

---

### 10.3. Błąd 403: Brak dostępu (Forbidden)

**Scenario:** Workout należy do innego użytkownika (teoretycznie niemożliwe z RLS, ale dla kompletności)

**Obsługa:**
```typescript
if (response.status === 403) {
  toast({
    title: "Brak dostępu",
    description: "Ten trening należy do innego użytkownika",
    variant: "destructive",
  });
  // Rollback
}
```

**Frontend handling:**
- Rollback optimistic update
- Toast error
- Optional: refresh page dla consistency

---

### 10.4. Błąd 404: Workout nie znaleziony

**Scenario:** Workout nie istnieje lub został usunięty

**Obsługa:**
```typescript
if (response.status === 404) {
  toast({
    title: "Nie znaleziono treningu",
    description: "Ten trening mógł zostać usunięty. Odśwież stronę.",
    variant: "destructive",
  });

  // Optional: auto-refresh po 2s
  setTimeout(() => window.location.reload(), 2000);
}
```

**Frontend handling:**
- Rollback optimistic update
- Toast error z sugestią refresh
- Auto-refresh (optional)

---

### 10.5. Błąd 500: Błąd serwera

**Scenario:** Database error, unexpected exception

**Obsługa:**
```typescript
if (response.status === 500) {
  toast({
    title: "Błąd serwera",
    description: "Coś poszło nie tak. Spróbuj ponownie.",
    variant: "destructive",
  });
  // Optional: retry button
}
```

**Frontend handling:**
- Rollback optimistic update
- Toast error z retry option
- Log error (console + Sentry)

---

### 10.6. Network Error: Brak połączenia

**Scenario:** User traci połączenie internetowe podczas API call

**Obsługa:**
```typescript
try {
  const response = await fetch(...);
} catch (error) {
  // Network error (no response)
  if (error instanceof TypeError) {
    toast({
      title: "Brak połączenia",
      description: "Sprawdź połączenie internetowe i spróbuj ponownie",
      variant: "destructive",
      action: <Button onClick={retry}>Spróbuj ponownie</Button>
    });
  }
}
```

**Frontend handling:**
- Rollback optimistic update
- Toast error z retry button
- Offline indicator (optional)

---

### 10.7. Race Condition: Wielokrotne kliknięcia

**Scenario:** User klika checkbox wielokrotnie szybko

**Obsługa:**
```typescript
// W useOptimisticWorkouts:
const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

const toggleCompleted = async (id: string, currentStatus: boolean) => {
  if (updatingIds.has(id)) {
    // Ignore jeśli już w trakcie update
    return;
  }

  setUpdatingIds(prev => new Set(prev).add(id));

  try {
    // API call
  } finally {
    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
};

// W WorkoutDayCard:
<Checkbox
  disabled={isUpdating(workoutDay.id)}
  // ...
/>
```

**Frontend handling:**
- Disable checkbox podczas update
- Ignore kolejne kliknięcia jeśli request w locie
- Visual feedback: disabled state (opacity)

---

## 11. Kroki implementacji

### Faza 1: Setup i Shadcn/ui Components

1. **Dodanie brakujących Shadcn/ui components:**
   ```bash
   npx shadcn-ui@latest add checkbox
   npx shadcn-ui@latest add accordion
   npx shadcn-ui@latest add badge
   npx shadcn-ui@latest add progress
   npx shadcn-ui@latest add toast
   ```

2. **Utworzenie struktury folderów dla Dashboard:**
   ```
   src/components/dashboard/
   ├── TrainingPlanView.tsx
   ├── WeekAccordion.tsx
   ├── WorkoutDayCard.tsx
   ├── PlanHeader.tsx
   └── ScrollToTodayFAB.tsx

   src/components/hooks/
   ├── useOptimisticWorkouts.ts
   └── useScrollToToday.ts
   ```

3. **Dodanie typów ViewModel do `src/types.ts`:**
   - `WorkoutDayCardProps`
   - `WeekAccordionProps`
   - `TrainingPlanViewProps`
   - `PlanHeaderProps`
   - `ScrollToTodayFABProps`

---

### Faza 2: Implementacja Custom Hooks

4. **Implementacja `useOptimisticWorkouts` hook:**
   - Zarządzanie stanem `workouts`
   - Zarządzanie stanem `updatingIds`
   - Funkcja `toggleCompleted` z optimistic update
   - Error handling z rollback
   - Toast notifications

5. **Implementacja `useScrollToToday` hook:**
   - Znajdowanie today's workout
   - Utworzenie ref dla today's card
   - Auto-scroll effect (useEffect z delay)

---

### Faza 3: Implementacja Base Components

6. **Implementacja `WorkoutDayCard` component:**
   - Renderowanie Card z conditional styling (rest/pending/completed)
   - Checkbox dla non-rest days
   - Expand/collapse functionality (local state)
   - Integration z `onToggleCompleted` callback
   - Formatowanie daty (toLocaleDateString)
   - Badge dla statusów
   - Disabled state podczas update

7. **Implementacja `PlanHeader` component:**
   - Wyświetlanie tytułu
   - Formatowanie zakres dat
   - Wyświetlanie statystyk (total, completed, percentage)
   - Progress bar (Shadcn/ui Progress)

8. **Implementacja `ScrollToTodayFAB` component:**
   - Floating button (fixed position)
   - IntersectionObserver dla visibility
   - Smooth scroll handler
   - Conditional rendering (tylko gdy today not in viewport)

---

### Faza 4: Implementacja Container Components

9. **Implementacja `WeekAccordion` component:**
   - Shadcn/ui Accordion structure
   - Obliczanie statystyk tygodnia (completed/total)
   - Renderowanie 7x WorkoutDayCard
   - Przekazywanie `onToggleCompleted` do dzieci
   - Auto-expand dla current week

10. **Implementacja `TrainingPlanView` component:**
    - Integracja `useOptimisticWorkouts` hook
    - Integracja `useScrollToToday` hook
    - Grupowanie workout days po tygodniach (groupByWeeks helper)
    - Renderowanie PlanHeader
    - Renderowanie 10x WeekAccordion
    - Renderowanie ScrollToTodayFAB
    - Przekazywanie today ref do odpowiedniego WorkoutDayCard

---

### Faza 5: Integracja z Astro Page

11. **Utworzenie/aktualizacja `src/pages/dashboard.astro`:**
    - Import DashboardLayout
    - SSR fetch active training plan (GET /api/training-plans/active)
    - Conditional rendering:
      - Jeśli ma plan: render TrainingPlanView z client:load
      - Jeśli brak planu: render EmptyState
    - Error handling (try-catch)
    - Middleware protection (auth check)

12. **Testowanie SSR data fetching:**
    - Verify training plan fetch działa
    - Verify workout_days są included
    - Verify completion_stats są calculated
    - Verify data przekazane do React component

---

### Faza 6: Styling i Responsiveness

13. **Styling WorkoutDayCard:**
    - Conditional classes (cn utility)
    - Rest day: muted bg, disabled state
    - Pending: neutral border
    - Completed: green border
    - Transitions: smooth border color change
    - Mobile: touch-friendly targets (min 44x44px)

14. **Styling WeekAccordion:**
    - Spacing między cards (space-y-3)
    - Accordion trigger styling
    - Mobile: collapsible content padding

15. **Styling TrainingPlanView:**
    - Container max-width
    - Spacing między sections
    - Mobile: stack layout
    - Desktop: optimal width

16. **Styling ScrollToTodayFAB:**
    - Fixed position (bottom-20 right-6)
    - Shadow dla depth
    - Z-index dla visibility nad content
    - Mobile: adjust position dla BottomNav

---

### Faza 7: Error Handling i Edge Cases

17. **Implementacja comprehensive error handling:**
    - 400: Rest day validation error
    - 401: Session expired → redirect login
    - 403: Forbidden (ownership)
    - 404: Not found → toast + optional refresh
    - 500: Server error → toast + retry option
    - Network error → toast + retry + offline indicator

18. **Testowanie edge cases:**
    - Próba oznaczenia rest day (nie powinno być możliwe)
    - Wielokrotne szybkie kliknięcia (race condition)
    - Session expiry podczas API call
    - Network disconnect podczas update
    - Concurrent updates w różnych tabs (eventual consistency)

---

### Faza 8: Accessibility & UX Polish

19. **Accessibility improvements:**
    - ARIA labels dla checkboxów
    - ARIA live regions dla toast
    - Keyboard navigation (Tab, Enter, Space)
    - Focus management (focus first checkbox on page load)
    - Screen reader announcements dla completion status
    - Semantic HTML (section, article, ul/li)

20. **UX polish:**
    - Loading skeletons (opcjonalnie)
    - Smooth transitions (border color, opacity)
    - Optimistic UI performance (React.memo, useCallback)
    - Toast auto-dismiss timing (4-5 seconds)
    - Empty state dla brak planu
    - Completion modal (US-012, future)

---

### Faza 9: Testing

21. **Manual testing:**
    - Oznaczanie workout jako completed
    - Cofanie oznaczenia
    - Auto-scroll do today po load
    - FAB scroll functionality
    - Expand/collapse workout descriptions
    - Responsive design (mobile, tablet, desktop)
    - Error scenarios (network disconnect, etc.)

22. **Integration testing (opcjonalnie):**
    - Vitest + React Testing Library
    - Test optimistic updates
    - Test rollback logic
    - Test API integration (mock fetch)
    - Test keyboard navigation

---

### Faza 10: Deployment Preparation

23. **Performance optimization:**
    - React.memo dla WorkoutDayCard (prevent unnecessary re-renders)
    - useCallback dla event handlers
    - useMemo dla expensive calculations (group by weeks)
    - Lazy loading dla ScrollToTodayFAB (dynamic import)

24. **Production readiness:**
    - Remove console.logs (replace z proper logging)
    - Error monitoring setup (Sentry integration)
    - Environment variables check (.env.example)
    - Build verification (npm run build)
    - Preview testing (npm run preview)

25. **Documentation:**
    - Update README z Dashboard features
    - Add JSDoc comments do custom hooks
    - Document component props (TypeScript interfaces)
    - Add inline comments dla complex logic

---

## 12. Checklist Akceptacji

### User Story US-007: Oznaczanie treningu jako wykonanego

- [ ] Każdy workout day card ma checkbox (nie rest days)
- [ ] Checkbox jest interaktywny (onClick/onChange)
- [ ] Po kliknięciu checkbox: optimistic UI update
- [ ] Border kafelka zmienia się na zielony
- [ ] Pojawia się ikona ✓ i Badge "Wykonano"
- [ ] API call PATCH /api/workout-days/:id { is_completed: true }
- [ ] Toast notification: "Trening oznaczony jako wykonany"
- [ ] Statystyki w header aktualizują się (X+1/Y)

### User Story US-008: Cofanie oznaczenia

- [ ] Ponowne kliknięcie checkbox cofa oznaczenie
- [ ] Optimistic UI update (powrót do neutral state)
- [ ] Border wraca do neutral color
- [ ] Badge "Wykonano" znika
- [ ] API call PATCH /api/workout-days/:id { is_completed: false }
- [ ] Toast notification: "Oznaczenie cofnięte"
- [ ] Statystyki w header aktualizują się (X-1/Y)

### Dodatkowe wymagania z UI Plan

- [ ] Auto-scroll do dzisiejszego dnia po load
- [ ] FAB "Dzisiaj" pojawia się gdy today card poza viewport
- [ ] FAB scrolluje do today card (smooth scroll)
- [ ] WeekAccordion grupuje 7 dni
- [ ] 10 tygodni (WeekAccordion x10)
- [ ] Rest days wyświetlane jako "Odpoczynek" bez checkbox
- [ ] Expand/collapse workout description (click na card)
- [ ] Responsywny design (mobile, tablet, desktop)

### Error Handling

- [ ] Rollback przy błędzie API
- [ ] Toast error notifications
- [ ] Session expiry → redirect login
- [ ] Network error → retry option
- [ ] Rest day validation (cannot mark as completed)
- [ ] Race condition handling (disable podczas update)

### Accessibility

- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] ARIA labels dla checkboxów
- [ ] ARIA live dla toast
- [ ] Screen reader support
- [ ] Focus management
- [ ] Semantic HTML

### Performance

- [ ] React.memo dla WorkoutDayCard
- [ ] useCallback dla callbacks
- [ ] useMemo dla groupByWeeks
- [ ] Brak unnecessary re-renders
- [ ] Optimistic UI działa płynnie (bez lagów)

---

**Koniec planu implementacji**
