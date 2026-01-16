# Plan implementacji widoku Dashboard (Przeglądanie aktywnego planu treningowego)

## 1. Przegląd

Widok Dashboard to główny ekran aplikacji, który wyświetla aktywny 10-tygodniowy plan treningowy użytkownika. Umożliwia przeglądanie wszystkich 70 dni treningowych, oznaczanie treningów jako wykonane, śledzenie postępów oraz nawigację do dzisiejszego dnia. Widok wykorzystuje progresywne ujawnianie treści poprzez accordion tygodni oraz optymistyczne aktualizacje UI dla lepszego doświadczenia użytkownika.

## 2. Routing widoku

- **Ścieżka:** `/dashboard`
- **Dostępność:** Chroniona (wymaga autentykacji)
- **Middleware:** Sprawdza sesję Supabase, w przypadku braku autoryzacji przekierowuje do `/auth/login`
- **Domyślny widok:** Po zalogowaniu użytkownik jest automatycznie przekierowywany na `/dashboard`
- **Layout:** `DashboardLayout.astro` (z górnym navbar i dolnym mobile navigation)

## 3. Struktura komponentów

```
DashboardPage.astro (SSR)
├── DashboardLayout.astro
│   ├── Navbar.astro
│   └── BottomNav.tsx (mobile only)
│
└── TrainingPlanView.tsx (client:load)
    │   Props: trainingPlan: TrainingPlanWithWorkoutsDTO | null
    │
    ├── Conditional Rendering:
    │   ├── IF trainingPlan === null:
    │   │   └── EmptyState.tsx
    │   │
    │   └── IF trainingPlan !== null:
    │       ├── PlanHeader.tsx
    │       ├── WeeksContainer (div)
    │       │   └── WeekAccordion.tsx (×10)
    │       │       └── WorkoutDayCard.tsx (×7 per week)
    │       ├── FloatingActionButton.tsx
    │       └── CompletionModal.tsx (conditional)
```

## 4. Szczegóły komponentów

### 4.1. DashboardPage.astro

**Opis komponentu:**
Główna strona dashboard renderowana po stronie serwera (SSR). Odpowiada za fetching aktywnego planu treningowego z API i przekazanie danych do komponentu React `TrainingPlanView`.

**Główne elementy:**
- `DashboardLayout.astro` (wrapper layout)
- Astro fetch: `GET /api/training-plans/active` (server-side)
- Error handling dla 401, 404, 500
- `TrainingPlanView` component (React) z dyrektywą `client:load`

**Obsługiwane zdarzenia:**
Brak - komponent statyczny (SSR)

**Warunki walidacji:**
- Sprawdzenie czy `response.ok` (status 200)
- Obsługa status 401: Redirect do `/auth/login`
- Obsługa status 404: Przekazanie `null` do TrainingPlanView (empty state)
- Obsługa status 500: Wyświetlenie error toast + retry

**Typy:**
- Response: `ApiSuccessResponse<TrainingPlanWithWorkoutsDTO>` lub `ApiErrorResponse`
- Props przekazywane do TrainingPlanView: `{ trainingPlan: TrainingPlanWithWorkoutsDTO | null }`

**Propsy:**
Brak (top-level page)

**Kod szkieletowy:**
```astro
---
import DashboardLayout from '@/layouts/DashboardLayout.astro';
import TrainingPlanView from '@/components/TrainingPlanView';

// Fetch active plan server-side
const response = await fetch(`${Astro.url.origin}/api/training-plans/active`, {
  headers: {
    Cookie: Astro.request.headers.get('Cookie') || '',
  },
});

let trainingPlan = null;

if (response.ok) {
  const data = await response.json();
  trainingPlan = data.data;
} else if (response.status === 404) {
  // No active plan - will show EmptyState
  trainingPlan = null;
} else if (response.status === 401) {
  // Unauthorized - redirect to login
  return Astro.redirect('/auth/login');
}
---

<DashboardLayout title="Dashboard - Twój plan treningowy">
  <TrainingPlanView client:load trainingPlan={trainingPlan} />
</DashboardLayout>
```

---

### 4.2. TrainingPlanView.tsx

**Opis komponentu:**
Główny kontener React dla całego widoku planu treningowego. Zarządza stanem lokalnym dla optimistic updates, obsługuje auto-scroll do dzisiejszego dnia oraz renderuje wszystkie pod-komponenty (header, accordions, FAB, modals).

**Główne elementy:**
- Conditional rendering: EmptyState (jeśli `trainingPlan === null`)
- `PlanHeader` component
- Container `div` z 10x `WeekAccordion` components
- `FloatingActionButton` (FAB)
- `CompletionModal` (conditional based on `is_plan_completed`)

**Obsługiwane zdarzenia:**
- `onWorkoutToggle(workoutId: string)` - delegowane z WorkoutDayCard, obsługuje marking completed
- `onScrollToToday()` - scroll do dzisiejszego dnia (triggered by FAB)
- `onCloseCompletionModal()` - zamknięcie modal z gratulacjami
- `onGenerateNewPlan()` - redirect do `/survey`

**Warunki walidacji:**
- Sprawdzenie `trainingPlan !== null` (jeśli null → EmptyState)
- Sprawdzenie `completion_stats.is_plan_completed` (jeśli true → show CompletionModal)
- Walidacja przed toggle: `!workout.is_rest_day` (rest days nie mogą być marked)

**Typy:**
- Props: `TrainingPlanViewProps`
- State: `workoutDays: WorkoutDayDTO[]`, `showCompletionModal: boolean`
- Computed: `weeks: WeekViewModel[]` (grouped workout days)

**Propsy:**
```typescript
interface TrainingPlanViewProps {
  trainingPlan: TrainingPlanWithWorkoutsDTO | null;
}
```

**Custom hooks używane:**
- `useWorkoutToggle` - zarządzanie optimistic updates
- `useScrollToToday` - auto-scroll on mount
- `useFABVisibility` - kontrola widoczności FAB

**Kod szkieletowy:**
```tsx
import React, { useState, useEffect, useRef } from 'react';
import type { TrainingPlanWithWorkoutsDTO, WorkoutDayDTO } from '@/types';
import PlanHeader from './PlanHeader';
import WeekAccordion from './WeekAccordion';
import FloatingActionButton from './FloatingActionButton';
import EmptyState from './EmptyState';
import CompletionModal from './CompletionModal';
import { groupWorkoutsByWeeks } from '@/lib/utils/workout-helpers';

interface TrainingPlanViewProps {
  trainingPlan: TrainingPlanWithWorkoutsDTO | null;
}

export default function TrainingPlanView({ trainingPlan }: TrainingPlanViewProps) {
  if (!trainingPlan) {
    return <EmptyState variant="no-plan" />;
  }

  const [workoutDays, setWorkoutDays] = useState(trainingPlan.workout_days);
  const [showCompletionModal, setShowCompletionModal] = useState(
    trainingPlan.completion_stats.is_plan_completed
  );
  const todayCardRef = useRef<HTMLDivElement>(null);

  const weeks = groupWorkoutsByWeeks(workoutDays);
  const todayDate = new Date().toISOString().split('T')[0];

  // Auto-scroll to today on mount
  useEffect(() => {
    setTimeout(() => {
      todayCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const handleWorkoutToggle = async (workoutId: string) => {
    // Optimistic update logic + API call
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PlanHeader
        startDate={trainingPlan.start_date}
        endDate={trainingPlan.end_date}
        completionStats={trainingPlan.completion_stats}
      />

      <div className="mt-8 space-y-4">
        {weeks.map((week) => (
          <WeekAccordion
            key={week.weekNumber}
            week={week}
            todayDate={todayDate}
            todayCardRef={todayCardRef}
            onWorkoutToggle={handleWorkoutToggle}
          />
        ))}
      </div>

      <FloatingActionButton onScrollToToday={() => {
        todayCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }} />

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onGenerateNewPlan={() => window.location.href = '/survey'}
      />
    </div>
  );
}
```

---

### 4.3. PlanHeader.tsx

**Opis komponentu:**
Wyświetla nagłówek planu treningowego z tytułem, datami rozpoczęcia i zakończenia oraz statystykami ukończenia (liczba wykonanych treningów, procent, progress bar).

**Główne elementy:**
- `Card` (Shadcn/ui)
- Tytuł: "Twój plan treningowy"
- Daty: start_date - end_date (formatted DD.MM.YYYY)
- Statystyki:
  - "Wykonane treningi: X/Y"
  - "Procent ukończenia: Z%"
  - `Progress` component (Shadcn/ui) - visual bar

**Obsługiwane zdarzenia:**
Brak (display only)

**Warunki walidacji:**
Brak

**Typy:**
- Props: `PlanHeaderProps`

**Propsy:**
```typescript
interface PlanHeaderProps {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  completionStats: CompletionStatsDTO;
}
```

**Kod szkieletowy:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils/date-helpers';
import type { CompletionStatsDTO } from '@/types';

interface PlanHeaderProps {
  startDate: string;
  endDate: string;
  completionStats: CompletionStatsDTO;
}

export default function PlanHeader({ startDate, endDate, completionStats }: PlanHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Twój plan treningowy</CardTitle>
        <p className="text-sm text-muted-foreground">
          {formatDate(startDate)} - {formatDate(endDate)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">
              Wykonane treningi: {completionStats.completed_workouts}/{completionStats.total_workouts}
            </p>
            <p className="text-sm text-muted-foreground">
              Procent ukończenia: {completionStats.completion_percentage}%
            </p>
          </div>
          <Progress value={completionStats.completion_percentage} />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 4.4. WeekAccordion.tsx

**Opis komponentu:**
Accordion item reprezentujący jeden tydzień treningu (7 dni). Wyświetla nagłówek z numerem tygodnia i liczbą wykonanych treningów, a po rozwinięciu pokazuje 7 kart WorkoutDayCard.

**Główne elementy:**
- `AccordionItem` (Shadcn/ui Accordion)
- `AccordionTrigger`: "Tydzień X: Y/Z wykonanych"
- `AccordionContent`: 7x `WorkoutDayCard` components

**Obsługiwane zdarzenia:**
- Expand/collapse (obsługiwane przez Shadcn Accordion)
- Delegowanie `onWorkoutToggle` do WorkoutDayCard

**Warunki walidacji:**
Brak

**Typy:**
- Props: `WeekAccordionProps`
- Używa: `WeekViewModel` (computed w TrainingPlanView)

**Propsy:**
```typescript
interface WeekAccordionProps {
  week: WeekViewModel;
  todayDate: string;
  todayCardRef: React.RefObject<HTMLDivElement>;
  onWorkoutToggle: (workoutId: string) => void;
}
```

**Kod szkieletowy:**
```tsx
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import WorkoutDayCard from './WorkoutDayCard';
import type { WeekViewModel } from '@/types/view-models';

interface WeekAccordionProps {
  week: WeekViewModel;
  todayDate: string;
  todayCardRef: React.RefObject<HTMLDivElement>;
  onWorkoutToggle: (workoutId: string) => void;
}

export default function WeekAccordion({
  week,
  todayDate,
  todayCardRef,
  onWorkoutToggle
}: WeekAccordionProps) {
  return (
    <AccordionItem value={`week-${week.weekNumber}`}>
      <AccordionTrigger>
        Tydzień {week.weekNumber}: {week.completedCount}/{week.totalWorkouts} wykonanych
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 mt-3">
          {week.workoutDays.map((workout) => {
            const isToday = workout.date === todayDate;
            return (
              <WorkoutDayCard
                key={workout.id}
                workout={workout}
                isToday={isToday}
                ref={isToday ? todayCardRef : null}
                onToggle={() => onWorkoutToggle(workout.id)}
              />
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
```

---

### 4.5. WorkoutDayCard.tsx

**Opis komponentu:**
Karta pojedynczego dnia treningowego. Wyświetla datę, numer dnia, opis treningu oraz checkbox do oznaczania jako wykonane. Obsługuje trzy stany wizualne: rest day (szary, disabled), pending (neutralny), completed (zielony border, checked).

**Główne elementy:**
- `Card` (Shadcn/ui)
- Header: Data (DD.MM.YYYY) + day_number
- Body: workout_description (z możliwością expand/collapse dla długich opisów)
- Footer: `Checkbox` (Shadcn/ui) - tylko dla non-rest days
- Visual indicators:
  - Rest day: 🛌 icon + "Odpoczynek" + muted background
  - Pending: neutral border + unchecked checkbox
  - Completed: green border + ✓ icon + checked checkbox

**Obsługiwane zdarzenia:**
- `onClick` (card) - expand/collapse description (optional feature)
- `onCheckedChange` (checkbox) - toggle completed status
- Event propagation: call parent's `onToggle` callback

**Warunki walidacji:**
- Checkbox `disabled={workout.is_rest_day === true}` (rest days nie mogą być marked)
- Checkbox nie renderowany dla rest days (alternatywne podejście)

**Typy:**
- Props: `WorkoutDayCardProps`

**Propsy:**
```typescript
interface WorkoutDayCardProps {
  workout: WorkoutDayDTO;
  isToday: boolean;
  onToggle: () => void;
}
```

**Kod szkieletowy:**
```tsx
import React, { forwardRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils/date-helpers';
import { cn } from '@/lib/utils';
import type { WorkoutDayDTO } from '@/types';

interface WorkoutDayCardProps {
  workout: WorkoutDayDTO;
  isToday: boolean;
  onToggle: () => void;
}

const WorkoutDayCard = forwardRef<HTMLDivElement, WorkoutDayCardProps>(
  ({ workout, isToday, onToggle }, ref) => {
    const cardClasses = cn(
      'transition-colors',
      workout.is_rest_day && 'bg-muted',
      workout.is_completed && 'border-green-500 border-2',
      isToday && 'ring-2 ring-blue-500'
    );

    return (
      <Card ref={ref} className={cardClasses}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{formatDate(workout.date)}</p>
              <p className="text-xs text-muted-foreground">Dzień {workout.day_number}/70</p>
            </div>
            {workout.is_rest_day ? (
              <span className="text-2xl">🛌</span>
            ) : workout.is_completed ? (
              <span className="text-2xl text-green-500">✓</span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {workout.is_rest_day ? (
            <p className="text-muted-foreground">Odpoczynek</p>
          ) : (
            <>
              <p className="text-sm">{workout.workout_description}</p>
              <div className="mt-4 flex items-center space-x-2">
                <Checkbox
                  id={`workout-${workout.id}`}
                  checked={workout.is_completed}
                  onCheckedChange={onToggle}
                />
                <label
                  htmlFor={`workout-${workout.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Oznacz jako wykonany
                </label>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
);

WorkoutDayCard.displayName = 'WorkoutDayCard';

export default WorkoutDayCard;
```

---

### 4.6. FloatingActionButton.tsx

**Opis komponentu:**
Floating Action Button (FAB) wyświetlany w prawym dolnym rogu ekranu. Widoczny tylko wtedy, gdy dzisiejsza karta nie jest w viewport. Po kliknięciu scrolluje do dzisiejszego dnia.

**Główne elementy:**
- `Button` (Shadcn/ui) z fixed positioning
- Icon: ↓ lub similar (arrow down)
- Text: "Dzisiaj"

**Obsługiwane zdarzenia:**
- `onClick` - scroll to today's card

**Warunki walidacji:**
- Widoczność kontrolowana przez IntersectionObserver (w TrainingPlanView)
- Render only gdy `isFABVisible === true`

**Typy:**
- Props: `FloatingActionButtonProps`

**Propsy:**
```typescript
interface FloatingActionButtonProps {
  onScrollToToday: () => void;
}
```

**Kod szkieletowy:**
```tsx
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

interface FloatingActionButtonProps {
  onScrollToToday: () => void;
}

export default function FloatingActionButton({ onScrollToToday }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onScrollToToday}
      className="fixed bottom-20 right-6 rounded-full shadow-lg md:bottom-6"
      size="lg"
    >
      <ArrowDown className="mr-2 h-4 w-4" />
      Dzisiaj
    </Button>
  );
}
```

---

### 4.7. EmptyState.tsx

**Opis komponentu:**
Wyświetlany gdy użytkownik nie ma aktywnego planu treningowego. Pokazuje komunikat i przycisk CTA do wygenerowania nowego planu.

**Główne elementy:**
- `Card` (Shadcn/ui)
- Icon (optional): 📋 lub similar
- Message: "Nie masz aktywnego planu treningowego"
- `Button` CTA: "Wygeneruj plan" → `/survey`

**Obsługiwane zdarzenia:**
- `onClick` (button) - redirect do `/survey`

**Warunki walidacji:**
Brak

**Typy:**
- Props: `EmptyStateProps`

**Propsy:**
```typescript
interface EmptyStateProps {
  variant: 'no-plan';
}
```

**Kod szkieletowy:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  variant: 'no-plan';
}

export default function EmptyState({ variant }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Nie masz aktywnego planu treningowego</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Wygeneruj swój pierwszy plan treningowy, aby rozpocząć.
          </p>
          <Button asChild>
            <a href="/survey">Wygeneruj plan</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 4.8. CompletionModal.tsx

**Opis komponentu:**
Modal wyświetlany automatycznie po ukończeniu planu treningowego (wszystkie treningi wykonane lub end_date passed). Pokazuje gratulacje i zachęca do wygenerowania nowego planu.

**Główne elementy:**
- `Dialog` (Shadcn/ui)
- Icon: 🎉
- Title: "Gratulacje!"
- Message: "Ukończyłeś swój 10-tygodniowy plan treningowy!"
- Buttons:
  - "Zamknij" (secondary)
  - "Wygeneruj nowy plan" (primary) → `/survey`

**Obsługiwane zdarzenia:**
- `onOpenChange` - zamknięcie modal
- `onClick` (CTA button) - redirect do `/survey`

**Warunki walidacji:**
Brak

**Typy:**
- Props: `CompletionModalProps`

**Propsy:**
```typescript
interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateNewPlan: () => void;
}
```

**Kod szkieletowy:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateNewPlan: () => void;
}

export default function CompletionModal({
  isOpen,
  onClose,
  onGenerateNewPlan
}: CompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🎉 Gratulacje!
          </DialogTitle>
          <DialogDescription className="text-center">
            Ukończyłeś swój 10-tygodniowy plan treningowy!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-center">
          <Button variant="outline" onClick={onClose}>
            Zamknij
          </Button>
          <Button onClick={onGenerateNewPlan}>
            Wygeneruj nowy plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. Typy

### 5.1. Typy z API (już zdefiniowane w src/types.ts)

#### TrainingPlanWithWorkoutsDTO
```typescript
type TrainingPlanWithWorkoutsDTO = TrainingPlan & {
  workout_days: WorkoutDayDTO[];
  completion_stats: CompletionStatsDTO;
};
```
**Pola:**
- `id`: string - UUID planu
- `user_id`: string - UUID użytkownika
- `start_date`: string - data rozpoczęcia (ISO format)
- `end_date`: string - data zakończenia (ISO format)
- `generated_at`: string - timestamp generowania (ISO format)
- `is_active`: boolean - czy plan jest aktywny
- `metadata`: unknown | null - dodatkowe metadane
- `workout_days`: WorkoutDayDTO[] - tablica 70 dni treningowych
- `completion_stats`: CompletionStatsDTO - statystyki ukończenia

#### WorkoutDayDTO
```typescript
type WorkoutDayDTO = WorkoutDay;
```
**Pola:**
- `id`: string - UUID dnia
- `training_plan_id`: string - UUID planu
- `day_number`: number - numer dnia (1-70)
- `date`: string - data dnia (ISO format YYYY-MM-DD)
- `workout_description`: string - pełny opis treningu
- `is_rest_day`: boolean - czy to dzień odpoczynku
- `is_completed`: boolean - czy trening wykonany
- `completed_at`: string | null - timestamp wykonania (ISO format)

#### CompletionStatsDTO
```typescript
interface CompletionStatsDTO {
  total_workouts: number;
  completed_workouts: number;
  total_rest_days: number;
  completion_percentage: number;
  is_plan_completed: boolean;
}
```
**Pola:**
- `total_workouts`: number - całkowita liczba treningów (bez dni odpoczynku)
- `completed_workouts`: number - liczba wykonanych treningów
- `total_rest_days`: number - liczba dni odpoczynku
- `completion_percentage`: number - procent ukończenia (0-100)
- `is_plan_completed`: boolean - czy plan jest całkowicie ukończony

### 5.2. Nowe typy ViewModel (do utworzenia w src/types/view-models.ts)

#### WeekViewModel
```typescript
interface WeekViewModel {
  weekNumber: number;
  workoutDays: WorkoutDayDTO[];
  completedCount: number;
  totalWorkouts: number;
}
```
**Opis:** Reprezentuje jeden tydzień treningu z obliczonymi statystykami.

**Pola:**
- `weekNumber`: number - numer tygodnia (1-10)
- `workoutDays`: WorkoutDayDTO[] - tablica 7 dni dla tego tygodnia
- `completedCount`: number - liczba wykonanych treningów w tym tygodniu
- `totalWorkouts`: number - liczba treningów (bez dni odpoczynku) w tym tygodniu

#### WorkoutDayViewModel
```typescript
interface WorkoutDayViewModel extends WorkoutDayDTO {
  isToday: boolean;
  weekNumber: number;
  displayDate: string;
  isPast: boolean;
  isFuture: boolean;
}
```
**Opis:** Rozszerza WorkoutDayDTO o dodatkowe pola pomocnicze dla UI.

**Pola:**
- Wszystkie pola z `WorkoutDayDTO`
- `isToday`: boolean - czy to dzisiejszy dzień
- `weekNumber`: number - numer tygodnia (1-10)
- `displayDate`: string - sformatowana data (DD.MM.YYYY)
- `isPast`: boolean - czy data jest w przeszłości
- `isFuture`: boolean - czy data jest w przyszłości

### 5.3. Typy Props komponentów

```typescript
// src/types/component-props.ts

interface TrainingPlanViewProps {
  trainingPlan: TrainingPlanWithWorkoutsDTO | null;
}

interface PlanHeaderProps {
  startDate: string;
  endDate: string;
  completionStats: CompletionStatsDTO;
}

interface WeekAccordionProps {
  week: WeekViewModel;
  todayDate: string;
  todayCardRef: React.RefObject<HTMLDivElement>;
  onWorkoutToggle: (workoutId: string) => void;
}

interface WorkoutDayCardProps {
  workout: WorkoutDayDTO;
  isToday: boolean;
  onToggle: () => void;
}

interface FloatingActionButtonProps {
  onScrollToToday: () => void;
}

interface EmptyStateProps {
  variant: 'no-plan';
}

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateNewPlan: () => void;
}
```

---

## 6. Zarządzanie stanem

### 6.1. Server-side state (Astro SSR)

**Źródło danych:** GET /api/training-plans/active

**Flow:**
1. DashboardPage.astro wykonuje fetch server-side
2. Response deserializowany do `TrainingPlanWithWorkoutsDTO | null`
3. Dane przekazywane jako props do `TrainingPlanView` (client:load)

### 6.2. Client-side state (React)

#### Stan w TrainingPlanView:

**1. workoutDays**
- **Typ:** `WorkoutDayDTO[]`
- **Inicjalizacja:** `useState(trainingPlan.workout_days)`
- **Cel:** Local state dla optimistic updates
- **Mutacje:** Update przy marking workout as completed/uncompleted

**2. showCompletionModal**
- **Typ:** `boolean`
- **Inicjalizacja:** `useState(trainingPlan.completion_stats.is_plan_completed)`
- **Cel:** Kontrola widoczności completion modal
- **Mutacje:** `setShowCompletionModal(false)` po zamknięciu modal

**3. todayCardRef**
- **Typ:** `React.RefObject<HTMLDivElement>`
- **Inicjalizacja:** `useRef<HTMLDivElement>(null)`
- **Cel:** Referencja do dzisiejszej karty dla scroll functionality

### 6.3. Custom Hooks

#### useWorkoutToggle
```typescript
function useWorkoutToggle(
  initialWorkouts: WorkoutDayDTO[],
  onError: (message: string) => void
) {
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleWorkout = async (workoutId: string) => {
    const workoutIndex = workouts.findIndex(w => w.id === workoutId);
    if (workoutIndex === -1) return;

    const workout = workouts[workoutIndex];
    const newCompletedStatus = !workout.is_completed;

    // Optimistic update
    const updatedWorkouts = [...workouts];
    updatedWorkouts[workoutIndex] = {
      ...workout,
      is_completed: newCompletedStatus,
      completed_at: newCompletedStatus ? new Date().toISOString() : null,
    };
    setWorkouts(updatedWorkouts);

    // API call
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/workout-days/${workoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: newCompletedStatus }),
      });

      if (!response.ok) throw new Error('Update failed');

      // Optionally update with server response
      const data = await response.json();
      updatedWorkouts[workoutIndex] = data.data;
      setWorkouts(updatedWorkouts);
    } catch (error) {
      // Rollback on error
      setWorkouts(initialWorkouts);
      onError('Nie udało się zaktualizować. Spróbuj ponownie.');
    } finally {
      setIsUpdating(false);
    }
  };

  return { workouts, toggleWorkout, isUpdating };
}
```

**Użycie:** W TrainingPlanView dla optimistic updates przy marking completed.

#### useScrollToToday
```typescript
function useScrollToToday(
  todayCardRef: React.RefObject<HTMLDivElement>,
  delay = 100
) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayCardRef.current) {
        todayCardRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [todayCardRef, delay]);
}
```

**Użycie:** W TrainingPlanView dla auto-scroll do dzisiejszego dnia po mount.

#### useFABVisibility
```typescript
function useFABVisibility(
  todayCardRef: React.RefObject<HTMLDivElement>
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!todayCardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // FAB visible gdy today card NOT in viewport
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(todayCardRef.current);

    return () => observer.disconnect();
  }, [todayCardRef]);

  return isVisible;
}
```

**Użycie:** W TrainingPlanView dla kontroli widoczności FAB button.

### 6.4. Computed values

#### groupWorkoutsByWeeks
```typescript
function groupWorkoutsByWeeks(workoutDays: WorkoutDayDTO[]): WeekViewModel[] {
  const weeks: WeekViewModel[] = [];

  for (let weekNum = 1; weekNum <= 10; weekNum++) {
    const startDay = (weekNum - 1) * 7 + 1;
    const endDay = weekNum * 7;

    const weekDays = workoutDays.filter(
      (day) => day.day_number >= startDay && day.day_number <= endDay
    );

    const totalWorkouts = weekDays.filter((day) => !day.is_rest_day).length;
    const completedCount = weekDays.filter(
      (day) => !day.is_rest_day && day.is_completed
    ).length;

    weeks.push({
      weekNumber: weekNum,
      workoutDays: weekDays,
      completedCount,
      totalWorkouts,
    });
  }

  return weeks;
}
```

**Lokalizacja:** `src/lib/utils/workout-helpers.ts`

---

## 7. Integracja API

### 7.1. Endpoint: GET /api/training-plans/active

**Kiedy:** Server-side fetch w DashboardPage.astro

**Request:**
- Method: GET
- Headers: Cookie (JWT token) - automatycznie przekazywany przez Astro
- Body: Brak

**Response Success (200):**
```typescript
ApiSuccessResponse<TrainingPlanWithWorkoutsDTO> = {
  data: {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    generated_at: string;
    is_active: true;
    metadata: null;
    completion_stats: {
      total_workouts: number;
      completed_workouts: number;
      total_rest_days: number;
      completion_percentage: number;
      is_plan_completed: boolean;
    };
    workout_days: [
      // 70 items
      {
        id: string;
        training_plan_id: string;
        day_number: number; // 1-70
        date: string; // YYYY-MM-DD
        workout_description: string;
        is_rest_day: boolean;
        is_completed: boolean;
        completed_at: string | null;
      }
    ];
  }
}
```

**Response Error (404):**
```typescript
ApiErrorResponse = {
  error: {
    message: "No active training plan found";
    code: "NO_ACTIVE_PLAN";
  }
}
```

**Response Error (401):**
```typescript
ApiErrorResponse = {
  error: {
    message: "Unauthorized";
  }
}
```

**Response Error (500):**
```typescript
ApiErrorResponse = {
  error: {
    message: "Failed to fetch active training plan";
  }
}
```

**Frontend handling:**
```typescript
// W DashboardPage.astro
const response = await fetch(`${Astro.url.origin}/api/training-plans/active`, {
  headers: {
    Cookie: Astro.request.headers.get('Cookie') || '',
  },
});

if (response.ok) {
  const { data } = await response.json();
  // Pass data to TrainingPlanView
} else if (response.status === 404) {
  // Pass null to TrainingPlanView → EmptyState
  trainingPlan = null;
} else if (response.status === 401) {
  // Redirect to login
  return Astro.redirect('/auth/login');
} else {
  // 500 error → show error page or toast
  throw new Error('Failed to load training plan');
}
```

### 7.2. Endpoint: PATCH /api/workout-days/:id

**Kiedy:** Client-side w TrainingPlanView (useWorkoutToggle hook)

**Request:**
- Method: PATCH
- Headers:
  - Content-Type: application/json
  - Cookie: JWT token (automatycznie przez browser)
- Body:
```typescript
{
  is_completed: boolean
}
```

**Response Success (200):**
```typescript
ApiSuccessResponse<WorkoutDayDTO> = {
  data: {
    id: string;
    training_plan_id: string;
    day_number: number;
    date: string;
    workout_description: string;
    is_rest_day: boolean;
    is_completed: boolean; // updated value
    completed_at: string | null; // updated timestamp
  }
}
```

**Response Error (400):**
```typescript
ApiErrorResponse = {
  error: {
    message: "Cannot mark rest day as completed";
    code: "INVALID_OPERATION";
  }
}
```

**Response Error (404):**
```typescript
ApiErrorResponse = {
  error: {
    message: "Workout day not found";
    code: "NOT_FOUND";
  }
}
```

**Frontend handling:**
```typescript
// W useWorkoutToggle hook
try {
  const response = await fetch(`/api/workout-days/${workoutId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_completed: newCompletedStatus }),
  });

  if (!response.ok) {
    throw new Error('Update failed');
  }

  const { data } = await response.json();
  // Update local state z server response (confirmation)
  updateWorkout(data);

  // Show success toast
  showToast('Trening oznaczony jako wykonany', 'success');
} catch (error) {
  // Rollback optimistic update
  revertWorkout(workoutId);

  // Show error toast
  showToast('Nie udało się zaktualizować. Spróbuj ponownie.', 'error');
}
```

---

## 8. Interakcje użytkownika

### 8.1. Page Load (Initial Render)

**Akcja użytkownika:** User naviguje do `/dashboard` (po zalogowaniu)

**Flow:**
1. Middleware sprawdza auth → jeśli OK, pozwala na dostęp
2. DashboardPage.astro wykonuje SSR fetch: GET /api/training-plans/active
3. Jeśli 200 OK:
   - Deserializacja response do TrainingPlanWithWorkoutsDTO
   - Render TrainingPlanView z danymi
   - React hydration (client:load)
   - Auto-scroll do dzisiejszego dnia (useEffect po mount)
   - Accordion dla dzisiejszego tygodnia auto-expanded
4. Jeśli 404 Not Found:
   - Render EmptyState component
5. Jeśli 401 Unauthorized:
   - Redirect do /auth/login

**Oczekiwany wynik:**
- User widzi swój plan treningowy z wszystkimi 70 dniami
- Smooth scroll do dzisiejszego dnia (centered w viewport)
- Dzisiejsza karta ma blue ring (highlight)
- Statystyki ukończenia wyświetlone w header

### 8.2. Expand/Collapse Week Accordion

**Akcja użytkownika:** User klika na WeekAccordion trigger (tytuł tygodnia)

**Flow:**
1. User klika na "Tydzień X: Y/Z wykonanych"
2. Shadcn Accordion obsługuje expand/collapse (built-in behavior)
3. AccordionContent smoothly expands/collapses
4. 7 WorkoutDayCards staje się visible/hidden
5. ARIA attributes automatycznie updated (aria-expanded)

**Oczekiwany wynik:**
- Smooth animation expand/collapse
- WorkoutDayCards wyświetlone w kolejności (dzień 1-7 tygodnia)
- Accessible keyboard navigation (Tab, Enter, Space)

### 8.3. Mark Workout as Completed

**Akcja użytkownika:** User klika checkbox "Oznacz jako wykonany" w WorkoutDayCard

**Flow:**
1. User klika checkbox (unchecked → checked)
2. Event handler w WorkoutDayCard wywołuje `onToggle()`
3. TrainingPlanView.useWorkoutToggle hook:
   - **Optimistic update:** Local state natychmiast updated
   - Card zmienia visual state: green border, ✓ icon, checkbox checked
   - Header stats re-computed (X+1/Y, procent update)
   - Week accordion header re-computed (Y+1/Z)
4. **Background API call:** PATCH /api/workout-days/:id { is_completed: true }
5. **Success response (200):**
   - Confirmation z server data
   - Toast notification: "Trening oznaczony jako wykonany" (success)
6. **Error response:**
   - Rollback optimistic update (card wraca do unchecked)
   - Toast notification: "Nie udało się zaktualizować. Spróbuj ponownie." (error)

**Oczekiwany wynik:**
- Instant visual feedback (optimistic UI)
- Green border na card
- ✓ icon wyświetlony
- Statystyki zaktualizowane
- Toast confirmation po success

### 8.4. Unmark Workout as Completed

**Akcja użytkownika:** User klika checkbox ponownie (checked → unchecked)

**Flow:**
1. User klika checkbox (checked → unchecked)
2. Event handler wywołuje `onToggle()`
3. Optimistic update: is_completed = false
4. Card zmienia visual state: neutral border, no icon, checkbox unchecked
5. Background API call: PATCH /api/workout-days/:id { is_completed: false }
6. Success: Toast "Oznaczenie cofnięte"
7. Error: Rollback + toast error

**Oczekiwany wynik:**
- Instant unchecking
- Card wraca do pending state (neutral)
- Statystyki zaktualizowane (X-1/Y)

### 8.5. Scroll to Today (FAB Click)

**Akcja użytkownika:** User klika FloatingActionButton "Dzisiaj"

**Flow:**
1. User klika FAB (fixed bottom-right)
2. Event handler wywołuje `onScrollToToday()`
3. `todayCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })`
4. Browser smoothly scrolls do dzisiejszej karty
5. Today card centered w viewport
6. IntersectionObserver detects today card in viewport
7. FAB disappears (fade out animation)

**Oczekiwany wynik:**
- Smooth scroll animation
- Today card centered
- FAB znika (bo today card w viewport)

### 8.6. Plan Completion (Auto-open Modal)

**Akcja użytkownika:** User kończy ostatni trening LUB end_date passed

**Flow:**
1. User marks last workout as completed
2. completion_stats.is_plan_completed = true (computed by backend)
3. TrainingPlanView re-renders
4. CompletionModal auto-opens (isOpen={true})
5. User widzi gratulacje: "🎉 Gratulacje! Ukończyłeś swój plan!"
6. User może:
   - Kliknąć "Zamknij" → modal closes
   - Kliknąć "Wygeneruj nowy plan" → redirect do /survey

**Oczekiwany wynik:**
- Modal wyświetlony automatycznie
- User może zamknąć i dalej przeglądać ukończony plan
- Lub wygenerować nowy plan (redirect /survey)

---

## 9. Warunki i walidacja

### 9.1. Auth validation (Middleware)

**Warunek:** User musi być authenticated (JWT token)

**Weryfikacja:**
- Astro middleware sprawdza `context.locals.supabase.auth.getUser()`
- Jeśli user === null → redirect /auth/login

**Komponenty dotknięte:** DashboardPage.astro (cała strona chroniona)

**Wpływ na UI:** Jeśli brak auth, user nie widzi dashboard tylko login page

### 9.2. Active plan existence

**Warunek:** User musi mieć aktywny plan treningowy

**Weryfikacja:**
- API endpoint GET /api/training-plans/active zwraca 404 jeśli brak planu
- Frontend sprawdza `trainingPlan === null`

**Komponenty dotknięte:** TrainingPlanView

**Wpływ na UI:**
- Jeśli `trainingPlan === null` → render EmptyState component
- EmptyState pokazuje CTA "Wygeneruj plan" → /survey

### 9.3. Workout days count validation

**Warunek:** Plan musi mieć dokładnie 70 workout_days

**Weryfikacja:** Backend (API endpoint)
- `if (!activePlan.workout_days || activePlan.workout_days.length !== 70)`
- Zwraca 500 Internal Server Error

**Komponenty dotknięte:** DashboardPage.astro

**Wpływ na UI:** Jeśli 500 error, show error toast lub error page

### 9.4. Rest day marking prevention

**Warunek:** Nie można oznaczać rest days jako completed

**Weryfikacja (dwa poziomy):**
1. **Frontend:** Checkbox disabled dla `is_rest_day === true`
   ```tsx
   <Checkbox
     disabled={workout.is_rest_day}
     checked={workout.is_completed}
   />
   ```
2. **Backend:** Database constraint CHECK
   ```sql
   CHECK (is_rest_day = false OR is_completed = false)
   ```
   - Jeśli user próbuje ominąć frontend validation, backend zwróci 400 error

**Komponenty dotknięte:** WorkoutDayCard

**Wpływ na UI:**
- Rest day cards nie mają checkboxa (alternatywnie: disabled checkbox)
- Jeśli jakoś API call zostanie wysłany, rollback + toast error

### 9.5. Today's date calculation

**Warunek:** Today's date musi być w lokalnej timezone użytkownika

**Weryfikacja:** Frontend (JavaScript Date API)
```typescript
const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
```

**Komponenty dotknięte:** TrainingPlanView, WeekAccordion, WorkoutDayCard

**Wpływ na UI:**
- Today's card ma `isToday={true}` prop
- Wyświetla blue ring (highlight)
- Today's week accordion auto-expanded
- FAB scrolls to today

### 9.6. Optimistic update validation

**Warunek:** Optimistic update musi być rollback-able w przypadku error

**Weryfikacja:** useWorkoutToggle hook
- Przed API call: save previous state
- Po error response: revert to previous state

**Komponenty dotknięte:** TrainingPlanView (hook), WorkoutDayCard (visual)

**Wpływ na UI:**
- Jeśli API error: card animates back to previous state
- Toast error displayed
- User może retry

---

## 10. Obsługa błędów

### 10.1. No Active Plan (404)

**Scenariusz:** User nie ma aktywnego planu treningowego

**Handling:**
- DashboardPage.astro: `trainingPlan = null`
- TrainingPlanView: conditional render `<EmptyState variant="no-plan" />`
- EmptyState message: "Nie masz aktywnego planu treningowego"
- CTA button: "Wygeneruj plan" → `/survey`

**User experience:**
- Clear message o braku planu
- Łatwy dostęp do generowania nowego planu
- Nie blokuje nawigacji (navbar nadal dostępna)

### 10.2. Unauthorized (401)

**Scenariusz:** JWT token expired lub invalid

**Handling (SSR):**
- DashboardPage.astro: `return Astro.redirect('/auth/login')`
- Optional: Set flash message "Sesja wygasła. Zaloguj się ponownie."

**Handling (Client-side API calls):**
- useWorkoutToggle hook: catch 401 response
- Redirect: `window.location.href = '/auth/login'`
- Toast: "Sesja wygasła. Zaloguj się ponownie."

**User experience:**
- Seamless redirect do login page
- Clear message o wygaśnięciu sesji
- Po re-login: redirect back do dashboard (optional feature)

### 10.3. API Timeout / Network Error

**Scenariusz:** API call takes too long lub brak połączenia

**Handling:**
- useWorkoutToggle hook: catch network error w try/catch
- Rollback optimistic update
- Toast: "Sprawdź połączenie internetowe. Spróbuj ponownie."
- Optional: Retry button w toast

**User experience:**
- Visual feedback o problemie z siecią
- Możliwość retry bez refresh strony
- Local state preserved (nie tracić postępu)

### 10.4. Incomplete Plan Data (500)

**Scenariusz:** Plan nie ma 70 workout_days (data corruption)

**Handling:**
- API returns 500 Internal Server Error
- DashboardPage.astro: catch error
- Option 1: Show error page z retry button
- Option 2: Toast error + EmptyState (graceful degradation)

**User experience:**
- Clear error message: "Błąd ładowania planu. Spróbuj ponownie."
- Retry button
- Contact support link (optional)

### 10.5. Optimistic Update Rollback

**Scenariusz:** Marking workout fails (400, 500, network error)

**Handling:**
- useWorkoutToggle hook: detect error response
- Revert `workoutDays` state do previous value
- Card animates back do poprzedniego stanu (smooth transition)
- Toast: "Nie udało się zaktualizować. Spróbuj ponownie."

**User experience:**
- Smooth rollback animation (nie jarring)
- Clear feedback o błędzie
- Możliwość retry (user może kliknąć checkbox ponownie)

### 10.6. Plan Completed Edge Cases

**Scenariusz A:** User marks last workout → is_plan_completed = true

**Handling:**
- CompletionModal auto-opens
- User może zamknąć modal (closable)
- Plan nadal visible (user może przeglądać completed plan)

**Scenariusz B:** end_date passed (SSR)

**Handling:**
- API zwraca `is_plan_completed: true`
- CompletionModal auto-opens on page load
- Same behavior jak Scenariusz A

**User experience:**
- Gratulacje wyświetlone automatycznie
- User nie jest zablokowany (może zamknąć modal)
- Może wygenerować nowy plan lub dalej przeglądać stary

### 10.7. Concurrent Updates (Multiple Tabs)

**Scenariusz:** User ma otwarte 2 tabs, oznacza workout w obu

**Handling:**
- Każdy tab ma niezależny local state
- Optimistic update w obu tabs
- API calls z obu tabs (race condition)
- Ostatni request wins (eventual consistency)
- Brak synchronizacji real-time w MVP

**User experience:**
- W MVP: brak synchronizacji między tabs (acceptable tradeoff)
- Post-MVP: Consider WebSocket lub polling dla real-time sync
- User może refresh strony aby zobaczyć latest state

### 10.8. Browser Refresh During API Call

**Scenariusz:** User refreshuje stronę podczas pending API call (mark completed)

**Handling:**
- Pending API call jest cancelled (browser behavior)
- Po refresh: SSR fetch zwraca latest state z database
- Jeśli API call zdążył się wykonać: workout marked
- Jeśli nie zdążył: workout nie marked (no phantom updates)

**User experience:**
- Refresh zawsze pokazuje prawdziwy stan z database
- Brak phantom updates
- User może retry marking jeśli nie poszło

---

## 11. Kroki implementacji

### Krok 1: Setup typów i helpers

**Zadania:**
1. Dodaj nowe typy do `src/types/view-models.ts`:
   - `WeekViewModel`
   - `WorkoutDayViewModel`
2. Dodaj typy props do `src/types/component-props.ts` (wszystkie interfejsy z sekcji 5.3)
3. Stwórz utility functions w `src/lib/utils/workout-helpers.ts`:
   - `groupWorkoutsByWeeks(workouts: WorkoutDayDTO[]): WeekViewModel[]`
   - `calculateWeekStats(workouts: WorkoutDayDTO[]): { completed: number, total: number }`
4. Stwórz date helpers w `src/lib/utils/date-helpers.ts`:
   - `formatDate(isoDate: string): string` (DD.MM.YYYY format)
   - `isToday(isoDate: string): boolean`
   - `getTodayDateString(): string` (YYYY-MM-DD format)

**Acceptance criteria:**
- Wszystkie typy TypeScript poprawnie zdefiniowane
- Utility functions przetestowane (manual testing w console)
- Brak błędów kompilacji TypeScript

---

### Krok 2: Stworzenie custom hooks

**Zadania:**
1. Stwórz `src/components/hooks/useWorkoutToggle.ts`:
   - Implementuj optimistic updates logic
   - API call PATCH /api/workout-days/:id
   - Rollback on error
   - Return: `{ workouts, toggleWorkout, isUpdating }`

2. Stwórz `src/components/hooks/useScrollToToday.ts`:
   - useEffect z setTimeout delay (100ms)
   - scrollIntoView({ behavior: 'smooth', block: 'center' })

3. Stwórz `src/components/hooks/useFABVisibility.ts`:
   - IntersectionObserver dla today card ref
   - Return boolean: isVisible (true gdy today NOT in viewport)

**Acceptance criteria:**
- Hooki poprawnie exportowane i typowane
- Można używać w komponentach React
- Logic testowana (manual testing)

---

### Krok 3: Implementacja podstawowych UI komponentów

**Zadania:**
1. Stwórz `src/components/EmptyState.tsx`:
   - Używa Shadcn Card, Button
   - Prop: `variant: 'no-plan'`
   - Message + CTA button → /survey

2. Stwórz `src/components/CompletionModal.tsx`:
   - Używa Shadcn Dialog
   - Props: isOpen, onClose, onGenerateNewPlan
   - 🎉 icon + gratulacje message
   - 2 buttons: Zamknij, Wygeneruj nowy plan

3. Stwórz `src/components/FloatingActionButton.tsx`:
   - Używa Shadcn Button
   - Fixed positioning (bottom-right)
   - Icon (ArrowDown z lucide-react)
   - Prop: onScrollToToday callback

**Acceptance criteria:**
- Komponenty renderują się poprawnie w isolation (Storybook optional)
- Styling zgodny z Tailwind + Shadcn
- Responsive (mobile/desktop)

---

### Krok 4: Implementacja PlanHeader komponenta

**Zadania:**
1. Stwórz `src/components/PlanHeader.tsx`:
   - Props: startDate, endDate, completionStats
   - Layout: Card z header i content
   - Header: Tytuł + daty (formatted)
   - Content: Statystyki + Progress bar (Shadcn Progress)
   - Format dates używając `formatDate()` helper

**Acceptance criteria:**
- Header renderuje się z mock data
- Progress bar shows correct percentage
- Responsive layout (stack na mobile)

---

### Krok 5: Implementacja WorkoutDayCard

**Zadania:**
1. Stwórz `src/components/WorkoutDayCard.tsx`:
   - Props: workout, isToday, onToggle
   - forwardRef dla ref forwarding
   - Conditional styling:
     - Rest day: muted background + 🛌 icon
     - Completed: green border + ✓ icon + checked checkbox
     - Today: blue ring (ring-2 ring-blue-500)
   - Checkbox z label "Oznacz jako wykonany"
   - Checkbox disabled dla rest days

**Acceptance criteria:**
- 3 stany wizualne poprawnie wyświetlone (rest/pending/completed)
- Checkbox działa (controlled component)
- Today highlight visible (blue ring)
- Accessible (ARIA labels, keyboard navigation)

---

### Krok 6: Implementacja WeekAccordion

**Zadania:**
1. Stwórz `src/components/WeekAccordion.tsx`:
   - Props: week (WeekViewModel), todayDate, todayCardRef, onWorkoutToggle
   - Używa Shadcn Accordion (AccordionItem, Trigger, Content)
   - AccordionTrigger: "Tydzień X: Y/Z wykonanych"
   - AccordionContent: map przez week.workoutDays
   - Render WorkoutDayCard dla każdego dnia
   - Pass todayCardRef do today's card (conditional ref forwarding)

**Acceptance criteria:**
- Accordion expand/collapse działa smoothly
- 7 WorkoutDayCards renderuje się w content
- Today's card ma ref assigned
- Week stats (Y/Z) poprawnie obliczone

---

### Krok 7: Implementacja TrainingPlanView

**Zadania:**
1. Stwórz `src/components/TrainingPlanView.tsx`:
   - Props: trainingPlan (nullable)
   - Conditional: jeśli null → EmptyState
   - Setup state: workoutDays, showCompletionModal
   - Setup ref: todayCardRef
   - Use custom hooks: useWorkoutToggle, useScrollToToday, useFABVisibility
   - Compute weeks: groupWorkoutsByWeeks(workoutDays)
   - Render:
     - PlanHeader
     - 10x WeekAccordion
     - FloatingActionButton (conditional visibility)
     - CompletionModal (conditional isOpen)

**Acceptance criteria:**
- TrainingPlanView renderuje wszystkie sub-components
- Optimistic updates działają (marking completed)
- Auto-scroll to today działa po mount
- FAB pokazuje się tylko gdy today NOT in viewport
- CompletionModal otwiera się gdy is_plan_completed

---

### Krok 8: Implementacja DashboardPage.astro

**Zadania:**
1. Stwórz/edytuj `src/pages/dashboard.astro`:
   - Import DashboardLayout
   - Server-side fetch: GET /api/training-plans/active
   - Error handling:
     - 401 → Astro.redirect('/auth/login')
     - 404 → trainingPlan = null
     - 500 → error handling (toast lub error page)
   - Pass trainingPlan to TrainingPlanView (client:load)

**Acceptance criteria:**
- SSR fetch działa poprawnie
- Dane przekazywane do React component
- Error handling dla wszystkich cases (401, 404, 500)
- React hydration działa (client:load)

---

### Krok 9: Dodanie Toast notifications

**Zadania:**
1. Dodaj Shadcn Toast/Sonner component (jeśli jeszcze nie ma):
   ```bash
   npx shadcn@latest add sonner
   ```
2. Setup Toaster w Layout (DashboardLayout.astro):
   - Import i render `<Toaster />` component
3. Użyj toast w useWorkoutToggle hook:
   - Success: `toast.success('Trening oznaczony jako wykonany')`
   - Error: `toast.error('Nie udało się zaktualizować. Spróbuj ponownie.')`

**Acceptance criteria:**
- Toast notifications wyświetlają się poprawnie
- Success toast (green) po successful update
- Error toast (red) po failed update
- Toasts auto-dismiss po 3-5 sekundach

---

### Krok 10: Styling i responsiveness

**Zadania:**
1. Review wszystkich komponentów pod kątem responsiveness:
   - Mobile (<768px): single column, bottom nav visible
   - Tablet (768-1024px): full navbar, wider cards
   - Desktop (>1024px): max-width container, hover states
2. Dodaj touch-friendly targets (min 44x44px) dla mobile
3. Test keyboard navigation (Tab, Enter, Space)
4. Test screen reader accessibility (ARIA attributes)
5. Adjust spacing, padding, margins dla all breakpoints

**Acceptance criteria:**
- Dashboard wygląda dobrze na mobile/tablet/desktop
- Touch targets wystarczająco duże na mobile
- Keyboard navigation działa smoothly
- Screen reader może nawigować (test z VoiceOver/NVDA)

---

### Krok 11: Testing i edge cases

**Zadania:**
1. Test happy path:
   - User ma aktywny plan → widzi dashboard
   - Marking workout as completed → optimistic update → success
   - Scroll to today → działa
   - FAB visibility → działa
2. Test edge cases:
   - No active plan → EmptyState
   - Session expired → redirect to login
   - API error podczas marking → rollback + toast
   - Plan completed → CompletionModal
3. Test error scenarios:
   - Network offline → rollback + toast
   - API timeout → error handling
   - Multiple rapid clicks (debouncing)
4. Test accessibility:
   - Keyboard only navigation
   - Screen reader (basic test)

**Acceptance criteria:**
- Wszystkie happy paths działają
- Edge cases poprawnie obsłużone
- Errors wyświetlają user-friendly messages
- Accessibility baseline spełniony (keyboard + screen reader)

---

### Krok 12: Performance optimization (optional)

**Zadania:**
1. Add React.memo dla często re-renderowanych komponentów:
   - `React.memo(WorkoutDayCard)` (70 instances)
   - `React.memo(WeekAccordion)` (10 instances)
2. Use useMemo dla expensive calculations:
   - `useMemo(() => groupWorkoutsByWeeks(workoutDays), [workoutDays])`
3. Lazy load CompletionModal (React.lazy):
   - Only load modal code gdy is_plan_completed
4. Consider virtualization dla 70 cards (opcjonalne w MVP):
   - Use react-window lub podobna biblioteka
   - Render only visible cards (performance boost)

**Acceptance criteria:**
- Reduced unnecessary re-renders (React DevTools Profiler)
- Smooth scrolling (60fps)
- Initial load time < 2s (Lighthouse)

---

### Krok 13: Final review i dokumentacja

**Zadania:**
1. Code review:
   - Sprawdź TypeScript types (brak `any`)
   - Sprawdź error handling (wszystkie cases covered)
   - Sprawdź accessibility (ARIA, keyboard)
2. Dokumentacja:
   - Dodaj JSDoc comments do utility functions
   - Dodaj README dla komponentów (jeśli Storybook)
   - Update CLAUDE.md jeśli potrzeba
3. Manual testing (final):
   - Test wszystkich user stories (US-006 + related)
   - Test na różnych devices (mobile/tablet/desktop)
   - Test na różnych browsers (Chrome, Firefox, Safari)

**Acceptance criteria:**
- Brak błędów TypeScript
- Wszystkie user stories fulfilled
- Kod czytelny i dobrze udokumentowany
- Ready for production deploy

---

## Podsumowanie

Ten plan implementacji pokrywa wszystkie aspekty widoku Dashboard, od struktury komponentów po obsługę błędów i accessibility. Kolejność kroków zapewnia stopniowe budowanie funkcjonalności, zaczynając od fundamentów (typy, hooki) poprzez UI komponenty, aż do finalnego połączenia wszystkiego w DashboardPage.

Kluczowe elementy do zapamiętania:
- **Optimistic UI** - natychmiastowy feedback dla użytkownika
- **Progressive disclosure** - accordion dla tygodni (nie overwhelm)
- **Accessibility** - keyboard navigation, screen readers, ARIA
- **Error handling** - graceful degradation, rollback, user-friendly messages
- **Performance** - React.memo, useMemo, lazy loading

Implementation time estimate: 2-3 dni dla doświadczonego frontend developera (zakładając że API endpoint już działa i Shadcn/ui już setup).
