# Plan implementacji widoku Ankiety (Survey)

## 1. Przegląd

Widok ankiety (Survey Page) umożliwia użytkownikowi wypełnienie formularza z danymi osobowymi i treningowymi, które są następnie wykorzystywane przez AI do wygenerowania spersonalizowanego 10-tygodniowego planu treningowego. Widok składa się z czterech sekcji: cele treningowe, dane osobowe, rekordy życiowe i disclaimer prawny. Po przesłaniu formularza następuje weryfikacja czy użytkownik ma aktywny plan (jeśli tak - wyświetlane jest okno potwierdzenia), a następnie wywołanie API generującego plan z wyświetleniem modala ładowania.

## 2. Routing widoku

**Ścieżka:** `/survey`

**Typ widoku:** Chroniony (wymaga autentykacji)

**Layout:** `DashboardLayout.astro`

**Middleware:**
- Sprawdzenie autoryzacji (JWT token)
- Jeśli użytkownik nie jest zalogowany → przekierowanie do `/auth/login`

**Pre-loading danych (SSR):**
- Opcjonalne: GET `/api/profile` - pobranie danych profilu do pre-fill formularza
- Opcjonalne: GET `/api/personal-records` - pobranie rekordów życiowych do pre-fill

## 3. Struktura komponentów

```
SurveyPage.astro (SSR)
└── DashboardLayout.astro
    └── SurveyForm.tsx (React - główny komponent interaktywny)
        ├── Form (React Hook Form wrapper)
        │   ├── Card (TrainingGoalsSection.tsx)
        │   │   ├── Label + Select (goal_distance)
        │   │   ├── Label + Input (weekly_km)
        │   │   └── Label + Input (training_days_per_week)
        │   │
        │   ├── Card (PersonalDataSection.tsx)
        │   │   ├── Label + Input (age)
        │   │   ├── Label + Input (weight)
        │   │   ├── Label + Input (height)
        │   │   └── Label + RadioGroup (gender)
        │   │
        │   ├── Card (PersonalRecordsSection.tsx)
        │   │   ├── PersonalRecordItem[] (useFieldArray)
        │   │   │   ├── Label + Select (distance)
        │   │   │   ├── Label + Input (time_seconds)
        │   │   │   └── Button (remove record) [disabled if only 1]
        │   │   └── Button (add new record)
        │   │
        │   ├── Card (DisclaimerSection.tsx)
        │   │   ├── ScrollArea (disclaimer text)
        │   │   └── Checkbox (acceptance)
        │   │
        │   └── Button (submit: "Wygeneruj plan")
        │
        ├── ConfirmDialog.tsx (Shadcn Dialog)
        │   ├── DialogContent
        │   │   ├── DialogHeader
        │   │   │   └── DialogTitle
        │   │   ├── DialogDescription
        │   │   └── DialogFooter
        │   │       ├── Button (cancel)
        │   │       └── Button (confirm)
        │
        └── LoadingModal.tsx (Shadcn Dialog non-closable)
            └── DialogContent (cannot close)
                ├── Spinner (animated)
                ├── Progress messages
                └── Progress bar (optional)
```

## 4. Szczegóły komponentów

### SurveyPage.astro

**Opis komponentu:**
Główna strona widoku ankiety. Wykorzystuje server-side rendering (SSR) do opcjonalnego pobrania danych profilu i rekordów życiowych użytkownika w celu pre-fill formularza. Przekazuje te dane do komponentu `SurveyForm` jako props.

**Główne elementy:**
- `DashboardLayout.astro` - layout z nawigacją
- `SurveyForm` (React) - główny komponent formularza
- Error boundary dla obsługi błędów SSR

**Logika SSR:**
```typescript
// Pobranie danych użytkownika (opcjonalne)
const { data: profile } = await locals.supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();

const { data: personalRecords } = await locals.supabase
  .from('personal_records')
  .select('*')
  .eq('user_id', user.id);

// Przekazanie do komponentu React
const initialData = {
  profile: profile || null,
  personalRecords: personalRecords || []
};
```

**Propsy:**
- `initialProfile?: ProfileDTO | null` - opcjonalne dane profilu do pre-fill
- `initialPersonalRecords?: PersonalRecordDTO[]` - opcjonalne rekordy życiowe

### SurveyForm.tsx

**Opis komponentu:**
Główny kontener formularza ankiety. Zarządza całym stanem formularza za pomocą React Hook Form i Zod validation. Odpowiada za orkiestrację wszystkich sekcji, obsługę submitu, wywołania API, wyświetlanie dialogów (confirmation, loading) oraz obsługę błędów. Implementuje persistence danych w sessionStorage.

**Główne elementy:**
- Form wrapper (React Hook Form)
- 4 sekcje w Cards (TrainingGoals, PersonalData, PersonalRecords, Disclaimer)
- Submit button
- ConfirmDialog (conditional rendering)
- LoadingModal (conditional rendering)
- Toast notifications dla błędów

**Obsługiwane zdarzenia:**
- `onSubmit` - walidacja formularza i wywołanie logiki generowania planu
- Form persistence - automatyczny zapis do sessionStorage przy każdej zmianie
- API calls - check aktywnego planu, generowanie nowego planu

**Warunki walidacji:**
- Wszystkie pola wymagane (zgodnie z Zod schema)
- Real-time validation on blur
- Submit validation (przed wysłaniem)
- Pokazywanie inline error messages
- Scroll to first error on submit

**Typy:**
- `SurveyFormData` (ViewModel)
- `GenerateTrainingPlanCommand` (DTO request)
- `TrainingPlanWithWorkoutsDTO` (DTO response)
- `ApiErrorResponse` (error handling)

**Propsy:**
```typescript
interface SurveyFormProps {
  initialProfile?: ProfileDTO | null;
  initialPersonalRecords?: PersonalRecordDTO[];
}
```

**State:**
```typescript
// React Hook Form state
const form = useForm<SurveyFormData>({
  resolver: zodResolver(surveyFormSchema),
  defaultValues: {
    goal_distance: initialProfile?.goal_distance || "",
    weekly_km: initialProfile?.weekly_km?.toString() || "",
    training_days_per_week: initialProfile?.training_days_per_week?.toString() || "",
    age: initialProfile?.age?.toString() || "",
    weight: initialProfile?.weight?.toString() || "",
    height: initialProfile?.height?.toString() || "",
    gender: initialProfile?.gender || "",
    personal_records: initialPersonalRecords.length > 0
      ? initialPersonalRecords.map(r => ({
          id: crypto.randomUUID(),
          distance: r.distance,
          time_seconds: r.time_seconds.toString()
        }))
      : [{ id: crypto.randomUUID(), distance: "", time_seconds: "" }],
    disclaimer_accepted: false
  }
});

// Local state
const [isSubmitting, setIsSubmitting] = useState(false);
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
const [showLoadingModal, setShowLoadingModal] = useState(false);
const [apiError, setApiError] = useState<string | null>(null);
```

### TrainingGoalsSection.tsx

**Opis komponentu:**
Sekcja formularza odpowiedzialna za zbieranie informacji o celach treningowych użytkownika. Zawiera pola: cel-dystans (select), średni tygodniowy kilometraż (input number) oraz liczba dni treningowych w tygodniu (input number).

**Główne elementy:**
- Card container z tytułem "Cele treningowe"
- FormField (goal_distance) - Shadcn Select z opcjami: 5K, 10K, Half Marathon, Marathon
- FormField (weekly_km) - Input typu number z suffixem "km"
- FormField (training_days_per_week) - Input typu number z suffixem "dni/tydzień"
- FormLabel, FormControl, FormDescription (optional), FormMessage (errors)

**Obsługiwane zdarzenia:**
- `onChange` - aktualizacja wartości w formularzu (React Hook Form)
- `onBlur` - trigger validation dla pola

**Warunki walidacji:**
- **goal_distance**: Required, must be one of: "5K" | "10K" | "Half Marathon" | "Marathon"
- **weekly_km**: Required, must be number > 0, decimal allowed
- **training_days_per_week**: Required, must be integer 2-7 (inclusive)

**Typy:**
```typescript
interface TrainingGoalsData {
  goal_distance: DistanceType | "";
  weekly_km: string; // parsed to number on submit
  training_days_per_week: string; // parsed to number on submit
}
```

**Propsy:**
```typescript
// Używa React Hook Form Controller, więc nie ma bezpośrednich propsów
// Dostęp do form methods przez useFormContext()
```

### PersonalDataSection.tsx

**Opis komponentu:**
Sekcja formularza zbierająca dane osobowe użytkownika: wiek, wagę, wzrost i płeć. Dane te są wykorzystywane przez AI do personalizacji planu treningowego.

**Główne elementy:**
- Card container z tytułem "Dane osobowe"
- FormField (age) - Input typu number z suffixem "lat"
- FormField (weight) - Input typu number z suffixem "kg" (decimal allowed)
- FormField (height) - Input typu number z suffixem "cm"
- FormField (gender) - RadioGroup z opcjami "Mężczyzna" (M) i "Kobieta" (F)
- FormLabel, FormControl, FormDescription (optional), FormMessage (errors)

**Obsługiwane zdarzenia:**
- `onChange` - aktualizacja wartości
- `onBlur` - trigger validation

**Warunki walidacji:**
- **age**: Required, must be integer 1-119 (inclusive)
- **weight**: Required, must be number 0-300 (inclusive), decimal allowed
- **height**: Required, must be integer 0-300 (inclusive)
- **gender**: Required, must be "M" or "F"

**Typy:**
```typescript
interface PersonalData {
  age: string; // parsed to number
  weight: string; // parsed to number
  height: string; // parsed to number
  gender: "M" | "F" | "";
}
```

**Propsy:**
```typescript
// Używa useFormContext(), brak bezpośrednich propsów
```

### PersonalRecordsSection.tsx

**Opis komponentu:**
Sekcja formularza umożliwiająca użytkownikowi dodanie jednego lub więcej rekordów życiowych (personal records). Każdy rekord składa się z dystansu (5K, 10K, Half Marathon, Marathon) i czasu w sekundach. Minimum 1 rekord jest wymagany. Wykorzystuje `useFieldArray` z React Hook Form do zarządzania dynamiczną listą.

**Główne elementy:**
- Card container z tytułem "Rekordy życiowe"
- Array of PersonalRecordItem components (dynamiczna lista)
- Button "Dodaj kolejny rekord" (z ikoną +)
- Helper text: "Dodaj co najmniej jeden rekord życiowy"

**PersonalRecordItem (sub-component):**
- FormField (distance) - Select z opcjami: 5K, 10K, Half Marathon, Marathon
- FormField (time_seconds) - Input typu number z suffixem "sekund"
- Button "Usuń" (ikona trash) - disabled jeśli tylko 1 rekord

**Obsługiwane zdarzenia:**
- `onAddRecord` - dodanie nowego rekordu do tablicy
- `onRemoveRecord(index)` - usunięcie rekordu z tablicy
- `onChange` - aktualizacja wartości pola
- `onBlur` - trigger validation

**Warunki walidacji:**
- **Array**: minimum 1 rekord required (PRD requirement)
- **distance** (per record): Required, must be valid DistanceType enum
- **time_seconds** (per record): Required, must be integer > 0

**Typy:**
```typescript
interface PersonalRecordFormData {
  id: string; // temporary ID for React key
  distance: DistanceType | "";
  time_seconds: string; // parsed to number
}

interface PersonalRecordsData {
  personal_records: PersonalRecordFormData[];
}
```

**Propsy:**
```typescript
// Używa useFormContext() + useFieldArray
// Brak bezpośrednich propsów
```

**Logika useFieldArray:**
```typescript
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "personal_records"
});

const handleAddRecord = () => {
  append({
    id: crypto.randomUUID(),
    distance: "",
    time_seconds: ""
  });
};

const handleRemoveRecord = (index: number) => {
  if (fields.length > 1) {
    remove(index);
  }
};
```

### DisclaimerSection.tsx

**Opis komponentu:**
Sekcja formularza zawierająca disclaimer prawny i checkbox akceptacji. Użytkownik musi zaakceptować disclaimer przed wygenerowaniem planu. Tekst disclaimer jest scrollowalny jeśli jest długi.

**Główne elementy:**
- Card container z tytułem "Informacje prawne"
- ScrollArea (jeśli tekst długi) lub div z tekstem disclaimer
- FormField (disclaimer_accepted) - Checkbox z label "Akceptuję powyższe warunki"
- FormMessage (error jeśli nie zaakceptowane)

**Tekst disclaimer:**
```
"Przed rozpoczęciem jakiejkolwiek aktywności fizycznej zalecamy konsultację z lekarzem.
Plany treningowe generowane przez aplikację Athletica mają charakter wyłącznie informacyjny
i nie stanowią porady medycznej. Korzystanie z aplikacji i wykonywanie treningów odbywa się
na własną odpowiedzialność użytkownika. Athletica nie ponosi odpowiedzialności za jakiekolwiek
kontuzje, urazy lub inne problemy zdrowotne wynikające z użytkowania aplikacji."
```

**Obsługiwane zdarzenia:**
- `onChange` - toggle checkbox
- Validation on submit

**Warunki walidacji:**
- **disclaimer_accepted**: Required, must be `true`
- Submit button disabled jeśli nie zaakceptowany

**Typy:**
```typescript
interface DisclaimerData {
  disclaimer_accepted: boolean;
}
```

**Propsy:**
```typescript
// Używa useFormContext()
```

### ConfirmDialog.tsx

**Opis komponentu:**
Dialog potwierdzenia wyświetlany gdy użytkownik ma już aktywny plan treningowy i próbuje wygenerować nowy. Informuje że nowy plan nadpisze obecny i wymaga potwierdzenia akcji.

**Główne elementy:**
- Shadcn Dialog (controlled)
- DialogContent
  - DialogHeader z DialogTitle: "Nadpisanie planu"
  - DialogDescription: "Masz już aktywny plan treningowy. Wygenerowanie nowego planu spowoduje nadpisanie obecnego. Wszystkie dane dotyczące postępów w obecnym planie zostaną utracone. Czy chcesz kontynuować?"
- DialogFooter
  - Button "Anuluj" (variant: outline, onClick: onCancel)
  - Button "Tak, wygeneruj nowy plan" (variant: destructive, onClick: onConfirm)

**Obsługiwane zdarzenia:**
- `onConfirm` - potwierdzenie i kontynuacja generowania planu
- `onCancel` - zamknięcie dialogu, pozostanie na stronie

**Typy:**
- Brak specyficznych typów, używa boolean dla `isOpen`

**Propsy:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### LoadingModal.tsx

**Opis komponentu:**
Modal wyświetlany podczas generowania planu przez AI. Niedomykalny (użytkownik nie może go zamknąć), pokazuje spinner, progress messages i opcjonalnie progress bar. Timeout po 60 sekundach z obsługą błędu timeout.

**Główne elementy:**
- Shadcn Dialog (controlled, non-closable)
- DialogContent (hideCloseButton)
  - Animated Spinner (Lucide Loader2 icon z rotate animation)
  - Progress messages (rotacja co 5-10 sekund):
    - "Analizujemy Twoje dane..."
    - "Tworzenie spersonalizowanego planu..."
    - "Generowanie treningów..."
    - "To może potrwać 20-30 sekund"
  - Progress bar (Shadcn Progress) - opcjonalnie animowany
  - Error state (jeśli timeout lub błąd API):
    - Error icon (AlertCircle)
    - Error message
    - Button "Spróbuj ponownie" lub "Zamknij"

**Obsługiwane zdarzenia:**
- Automatyczne pokazywanie przy rozpoczęciu API call
- Automatyczne zamykanie po sukcesie (redirect)
- Zmiana na error state po błędzie lub timeout
- `onRetry` - ponowienie próby generowania (w error state)
- `onClose` - zamknięcie modala (tylko w error state)

**Typy:**
```typescript
type LoadingModalState = "loading" | "error" | "timeout";

interface LoadingModalProps {
  isOpen: boolean;
  state: LoadingModalState;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}
```

**Propsy:**
Jak w interfejsie powyżej.

**Logika timeout:**
```typescript
// W SurveyForm
useEffect(() => {
  if (showLoadingModal) {
    const timeout = setTimeout(() => {
      setLoadingModalState("timeout");
      setApiError("Generowanie trwało zbyt długo. Spróbuj ponownie.");
    }, 60000); // 60 seconds

    return () => clearTimeout(timeout);
  }
}, [showLoadingModal]);
```

## 5. Typy

### ViewModel Types (dla formularza)

```typescript
/**
 * ViewModel dla całego formularza ankiety
 * Wszystkie numeric fields są string w formularzu (parsowane przy submit)
 */
interface SurveyFormData {
  // Training Goals
  goal_distance: DistanceType | "";
  weekly_km: string;
  training_days_per_week: string;

  // Personal Data
  age: string;
  weight: string;
  height: string;
  gender: "M" | "F" | "";

  // Personal Records (dynamic array)
  personal_records: PersonalRecordFormData[];

  // Disclaimer
  disclaimer_accepted: boolean;
}

/**
 * ViewModel dla pojedynczego rekordu życiowego w formularzu
 */
interface PersonalRecordFormData {
  id: string; // Temporary UUID dla React key
  distance: DistanceType | "";
  time_seconds: string;
}
```

### DTO Types (z API)

```typescript
/**
 * Request DTO dla POST /api/training-plans/generate
 * Zgodny z GenerateTrainingPlanCommand z types.ts
 */
interface GenerateTrainingPlanRequest {
  profile: {
    goal_distance: DistanceType;
    weekly_km: number;
    training_days_per_week: number;
    age: number;
    weight: number;
    height: number;
    gender: "M" | "F";
  };
  personal_records: {
    distance: DistanceType;
    time_seconds: number;
  }[];
}

/**
 * Response DTO dla GET /api/training-plans/active
 * Używany do sprawdzenia czy użytkownik ma aktywny plan
 */
type CheckActivePlanResponse = TrainingPlanDTO | null;

/**
 * Response DTO dla POST /api/training-plans/generate (success)
 */
type GenerateTrainingPlanResponse = ApiSuccessResponse<TrainingPlanWithWorkoutsDTO>;

/**
 * Error response (wszystkie endpointy)
 */
interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: ValidationErrorDetail[];
    requires_confirmation?: boolean;
  };
}
```

### Zod Schema

```typescript
import { z } from "zod";

/**
 * Zod schema dla walidacji formularza Survey
 * Musi być zgodny z API validation (generate.ts)
 */
const surveyFormSchema = z.object({
  goal_distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"], {
    errorMap: () => ({ message: "Wybierz dystans docelowy" })
  }),
  weekly_km: z.string()
    .min(1, "Pole wymagane")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Kilometraż musi być większy od 0"
    ),
  training_days_per_week: z.string()
    .min(1, "Pole wymagane")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && Number.isInteger(num) && num >= 2 && num <= 7;
      },
      "Liczba dni treningowych musi być liczbą całkowitą od 2 do 7"
    ),
  age: z.string()
    .min(1, "Pole wymagane")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 119;
      },
      "Wiek musi być liczbą całkowitą od 1 do 119"
    ),
  weight: z.string()
    .min(1, "Pole wymagane")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0 && num <= 300;
      },
      "Waga musi być liczbą od 0 do 300 kg"
    ),
  height: z.string()
    .min(1, "Pole wymagane")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && Number.isInteger(num) && num > 0 && num <= 300;
      },
      "Wzrost musi być liczbą całkowitą od 0 do 300 cm"
    ),
  gender: z.enum(["M", "F"], {
    errorMap: () => ({ message: "Wybierz płeć" })
  }),
  personal_records: z.array(
    z.object({
      id: z.string(),
      distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"], {
        errorMap: () => ({ message: "Wybierz dystans" })
      }),
      time_seconds: z.string()
        .min(1, "Pole wymagane")
        .refine(
          (val) => {
            const num = Number(val);
            return !isNaN(num) && Number.isInteger(num) && num > 0;
          },
          "Czas musi być liczbą całkowitą większą od 0"
        )
    })
  ).min(1, "Wymagany jest co najmniej jeden rekord życiowy"),
  disclaimer_accepted: z.boolean().refine(
    (val) => val === true,
    "Musisz zaakceptować warunki aby kontynuować"
  )
});

type SurveyFormData = z.infer<typeof surveyFormSchema>;
```

## 6. Zarządzanie stanem

### React Hook Form

Główny mechanizm zarządzania stanem formularza. Wykorzystuje Zod resolver dla validation.

```typescript
const form = useForm<SurveyFormData>({
  resolver: zodResolver(surveyFormSchema),
  mode: "onBlur", // validation on blur
  defaultValues: {
    goal_distance: "",
    weekly_km: "",
    training_days_per_week: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    personal_records: [{
      id: crypto.randomUUID(),
      distance: "",
      time_seconds: ""
    }],
    disclaimer_accepted: false
  }
});
```

### Custom Hooks

#### useFormPersistence

Custom hook do automatycznego zapisywania i przywracania danych formularza w sessionStorage.

```typescript
/**
 * Hook do persystencji danych formularza w sessionStorage
 */
function useFormPersistence(
  key: string,
  formData: SurveyFormData,
  setValue: UseFormSetValue<SurveyFormData>
) {
  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((fieldKey) => {
          setValue(fieldKey as any, parsed[fieldKey]);
        });
      } catch (error) {
        console.error("Failed to parse saved form data:", error);
      }
    }
  }, []);

  // Save to sessionStorage on change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      sessionStorage.setItem(key, JSON.stringify(formData));
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData, key]);

  // Clear saved data
  const clearSaved = () => {
    sessionStorage.removeItem(key);
  };

  return { clearSaved };
}
```

#### useTrainingPlanGeneration

Custom hook zarządzający logiką generowania planu treningowego.

```typescript
/**
 * Hook do zarządzania generowaniem planu treningowego
 */
function useTrainingPlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);

  /**
   * Sprawdza czy użytkownik ma aktywny plan
   */
  const checkActivePlan = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/training-plans/active");
      if (response.ok) {
        const data = await response.json();
        return data.data !== null;
      }
      return false;
    } catch (err) {
      console.error("Failed to check active plan:", err);
      return false;
    }
  };

  /**
   * Generuje nowy plan treningowy
   */
  const generatePlan = async (
    data: SurveyFormData
  ): Promise<{ success: boolean; error?: string }> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Transform form data to API request format
      const requestBody: GenerateTrainingPlanRequest = {
        profile: {
          goal_distance: data.goal_distance as DistanceType,
          weekly_km: Number(data.weekly_km),
          training_days_per_week: Number(data.training_days_per_week),
          age: Number(data.age),
          weight: Number(data.weight),
          height: Number(data.height),
          gender: data.gender as "M" | "F"
        },
        personal_records: data.personal_records.map((record) => ({
          distance: record.distance as DistanceType,
          time_seconds: Number(record.time_seconds)
        }))
      };

      // Call API
      const response = await fetch("/api/training-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error.message);
      }

      // Success - will redirect to dashboard
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    error,
    hasActivePlan,
    checkActivePlan,
    generatePlan
  };
}
```

### Local Component State

```typescript
// W SurveyForm.tsx
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
const [showLoadingModal, setShowLoadingModal] = useState(false);
const [loadingModalState, setLoadingModalState] = useState<LoadingModalState>("loading");
```

## 7. Integracja API

### Endpoint: GET /api/training-plans/active

**Cel:** Sprawdzenie czy użytkownik ma aktywny plan treningowy przed generowaniem nowego.

**Kiedy wywołać:** Przed submitem formularza (po walidacji client-side)

**Request:**
- Method: GET
- Headers: Authorization z JWT token (automatycznie przez Supabase client)
- Body: brak

**Response:**
- **200 OK**: `{ data: TrainingPlanDTO }` - użytkownik ma aktywny plan
- **404 Not Found**: `{ data: null }` - brak aktywnego planu

**Obsługa w kodzie:**
```typescript
const hasActivePlan = await checkActivePlan();
if (hasActivePlan) {
  setShowConfirmDialog(true); // pokaż dialog potwierdzenia
} else {
  await handleGenerate(); // bezpośrednie generowanie
}
```

### Endpoint: POST /api/training-plans/generate

**Cel:** Wygenerowanie nowego 10-tygodniowego planu treningowego.

**Kiedy wywołać:** Po potwierdzeniu przez użytkownika (lub jeśli brak aktywnego planu)

**Request:**
- Method: POST
- Headers:
  - `Content-Type: application/json`
  - Authorization z JWT token
- Body: `GenerateTrainingPlanRequest`

**Typ Request Body:**
```typescript
{
  profile: {
    goal_distance: "Marathon",
    weekly_km: 45.0,
    training_days_per_week: 5,
    age: 32,
    weight: 72.5,
    height: 175,
    gender: "M"
  },
  personal_records: [
    {
      distance: "5K",
      time_seconds: 1200
    },
    {
      distance: "10K",
      time_seconds: 2700
    }
  ]
}
```

**Response:**

**201 Created** (sukces):
```typescript
{
  data: {
    id: "uuid",
    user_id: "uuid",
    start_date: "2025-01-08",
    end_date: "2025-03-18",
    generated_at: "2025-01-08T10:00:00Z",
    is_active: true,
    metadata: null,
    workout_days: [...], // 70 workout days
    completion_stats: {...}
  }
}
```

**400 Bad Request** (validation error):
```typescript
{
  error: {
    message: "Validation failed",
    details: [
      {
        field: "personal_records",
        message: "At least one personal record is required"
      }
    ]
  }
}
```

**401 Unauthorized** - sesja wygasła, redirect do `/auth/login`

**409 Conflict** - aktywny plan istnieje (nie powinno się zdarzyć, bo sprawdzamy wcześniej)

**500/503** - błąd serwera lub AI service

**Obsługa w kodzie:**
```typescript
const handleSubmit = async (data: SurveyFormData) => {
  // 1. Check active plan
  const hasActive = await checkActivePlan();

  if (hasActive) {
    setShowConfirmDialog(true);
    return;
  }

  await handleGenerate(data);
};

const handleGenerate = async (data: SurveyFormData) => {
  setShowLoadingModal(true);
  setLoadingModalState("loading");

  const result = await generatePlan(data);

  if (result.success) {
    // Clear sessionStorage
    sessionStorage.removeItem("survey-form-data");

    // Redirect to dashboard
    window.location.href = "/dashboard";
  } else {
    // Show error in modal
    setLoadingModalState("error");
    setApiError(result.error);
  }
};
```

## 8. Interakcje użytkownika

### 1. Wypełnianie formularza

**Interakcja:** User wpisuje dane w pola formularza

**Oczekiwany wynik:**
- Real-time update wartości w formularzu (React Hook Form)
- onBlur → validation pojedynczego pola
- Inline error message pod polem jeśli validation failed
- Auto-save do sessionStorage (debounced 500ms)

### 2. Dodawanie rekordu życiowego

**Interakcja:** User klika "Dodaj kolejny rekord"

**Oczekiwany wynik:**
- Nowy pusty rekord pojawia się na liście
- Focus przenosi się na pierwszy input nowego rekordu
- Button "Usuń" jest enabled dla wszystkich rekordów (jeśli więcej niż 1)

### 3. Usuwanie rekordu życiowego

**Interakcja:** User klika "Usuń" przy rekordzie

**Oczekiwany wynik:**
- Rekord jest usuwany z listy (animacja fade-out opcjonalnie)
- Jeśli pozostał tylko 1 rekord → button "Usuń" jest disabled
- Walidacja ponownie sprawdzana (minimum 1 rekord)

### 4. Akceptacja disclaimer

**Interakcja:** User zaznacza checkbox disclaimer

**Oczekiwany wynik:**
- Checkbox status zmienia się na checked
- Submit button staje się enabled (jeśli reszta formularza valid)

### 5. Submit formularza

**Interakcja:** User klika "Wygeneruj plan"

**Oczekiwany wynik:**
- Client-side validation całego formularza
- Jeśli invalid → scroll to first error, show inline errors
- Jeśli valid → wywołanie `checkActivePlan()`
  - Jeśli ma aktywny plan → show ConfirmDialog
  - Jeśli nie ma → show LoadingModal + API call

### 6. Anulowanie w ConfirmDialog

**Interakcja:** User klika "Anuluj" w dialogu potwierdzenia

**Oczekiwany wynik:**
- Dialog zamyka się
- User pozostaje na stronie /survey
- Dane formularza zachowane

### 7. Potwierdzenie w ConfirmDialog

**Interakcja:** User klika "Tak, wygeneruj nowy plan"

**Oczekiwany wynik:**
- Dialog zamyka się
- LoadingModal pokazuje się
- API call POST /api/training-plans/generate

### 8. Oczekiwanie na generowanie

**Interakcja:** LoadingModal widoczny podczas API call

**Oczekiwany wynik:**
- Spinner animowany
- Progress messages rotują co 5-10 sekund
- Modal niedomykalny (brak close button, escape nie działa)
- Jeśli API call > 60s → timeout error state

### 9. Sukces generowania

**Interakcja:** API zwraca 201 Created

**Oczekiwany wynik:**
- sessionStorage cleared
- Redirect do `/dashboard`
- Toast notification "Plan został wygenerowany!"

### 10. Błąd podczas generowania

**Interakcja:** API zwraca error (400, 500, 503)

**Oczekiwany wynik:**
- LoadingModal zmienia się na error state
- Pokazuje error message (user-friendly)
- Button "Spróbuj ponownie" lub "Zamknij"
- Click "Spróbuj ponownie" → powtórz API call
- Click "Zamknij" → zamknij modal, user pozostaje na /survey

### 11. Timeout podczas generowania

**Interakcja:** API call > 60 sekund

**Oczekiwany wynik:**
- LoadingModal zmienia się na timeout state
- Message: "Generowanie trwało zbyt długo. Spróbuj ponownie."
- Button "Spróbuj ponownie" lub "Zamknij"

### 12. Odświeżenie strony podczas wypełniania

**Interakcja:** User refreshuje przeglądarkę

**Oczekiwany wynik:**
- Dane formularza przywracane z sessionStorage
- User może kontynuować wypełnianie od miejsca gdzie przerwał

## 9. Warunki i walidacja

### Client-side Validation (Zod)

Wszystkie pola są walidowane na client-side przed submitem formularza. Walidacja jest także triggerowana on blur dla lepszego UX.

#### Training Goals

| Pole | Warunek | Komponent | Wpływ na UI |
|------|---------|-----------|-------------|
| `goal_distance` | Required, must be one of: "5K", "10K", "Half Marathon", "Marathon" | TrainingGoalsSection | Inline error: "Wybierz dystans docelowy" |
| `weekly_km` | Required, must be number > 0, decimal allowed | TrainingGoalsSection | Inline error: "Kilometraż musi być większy od 0" |
| `training_days_per_week` | Required, must be integer 2-7 | TrainingGoalsSection | Inline error: "Liczba dni treningowych musi być liczbą całkowitą od 2 do 7" |

#### Personal Data

| Pole | Warunek | Komponent | Wpływ na UI |
|------|---------|-----------|-------------|
| `age` | Required, must be integer 1-119 | PersonalDataSection | Inline error: "Wiek musi być liczbą całkowitą od 1 do 119" |
| `weight` | Required, must be number 0-300, decimal allowed | PersonalDataSection | Inline error: "Waga musi być liczbą od 0 do 300 kg" |
| `height` | Required, must be integer 0-300 | PersonalDataSection | Inline error: "Wzrost musi być liczbą całkowitą od 0 do 300 cm" |
| `gender` | Required, must be "M" or "F" | PersonalDataSection | Inline error: "Wybierz płeć" |

#### Personal Records

| Pole | Warunek | Komponent | Wpływ na UI |
|------|---------|-----------|-------------|
| `personal_records` (array) | Minimum 1 record required | PersonalRecordsSection | Inline error: "Wymagany jest co najmniej jeden rekord życiowy" |
| `distance` (per record) | Required, must be valid DistanceType | PersonalRecordItem | Inline error: "Wybierz dystans" |
| `time_seconds` (per record) | Required, must be integer > 0 | PersonalRecordItem | Inline error: "Czas musi być liczbą całkowitą większą od 0" |

#### Disclaimer

| Pole | Warunek | Komponent | Wpływ na UI |
|------|---------|-----------|-------------|
| `disclaimer_accepted` | Required, must be `true` | DisclaimerSection | Inline error: "Musisz zaakceptować warunki aby kontynuować" |
| Submit button | Disabled if form invalid | SurveyForm | Button disabled + tooltip "Wypełnij wszystkie wymagane pola" |

### Submit Validation Flow

```
1. User clicks "Wygeneruj plan"
   ↓
2. React Hook Form trigger validation (all fields)
   ↓
3. IF invalid:
   - Show inline errors
   - Scroll to first error field (smooth scroll)
   - Focus first error field
   - Toast: "Popraw błędy w formularzu"
   ↓
4. IF valid:
   - Proceed to checkActivePlan()
```

### Server-side Validation

API endpoint `/api/training-plans/generate` ma własną walidację (Zod schema w `generate.ts`). Jest to backup jeśli client-side validation fail lub request został zmodyfikowany.

**Obsługa błędów 400 Bad Request:**
```typescript
if (response.status === 400) {
  const errorData: ApiErrorResponse = await response.json();

  if (errorData.error.details) {
    // Map validation errors to form fields
    errorData.error.details.forEach((detail) => {
      form.setError(detail.field as any, {
        type: "server",
        message: detail.message
      });
    });

    // Scroll to first error
    const firstErrorField = errorData.error.details[0].field;
    document.querySelector(`[name="${firstErrorField}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  } else {
    // Generic error
    toast.error(errorData.error.message);
  }
}
```

## 10. Obsługa błędów

### 1. Validation Errors (Client-side)

**Scenario:** User submits invalid form data

**Obsługa:**
- Inline error messages pod każdym niepoprawnym polem (red text)
- Scroll to first error field (smooth scroll, block: center)
- Focus first error field dla keyboard accessibility
- Submit button disabled jeśli form invalid
- Toast notification: "Popraw błędy w formularzu"

### 2. API Validation Errors (400 Bad Request)

**Scenario:** Server-side validation fails

**Obsługa:**
- Map API validation errors to form fields używając `form.setError()`
- Show inline errors pod odpowiednimi polami
- Scroll to first error field
- Toast notification z głównym error message

**Przykład response:**
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "personal_records",
        "message": "At least one personal record is required"
      }
    ]
  }
}
```

### 3. Unauthorized (401)

**Scenario:** JWT token expired lub invalid

**Obsługa:**
- Redirect do `/auth/login`
- Toast notification: "Sesja wygasła. Zaloguj się ponownie."
- Preserve intent: zapisać `/survey` w sessionStorage, redirect back after login

### 4. Conflict - Active Plan Exists (409)

**Scenario:** User ma aktywny plan (nie powinno się zdarzyć bo sprawdzamy wcześniej)

**Obsługa:**
- Jeśli zdarzy się mimo pre-check → show ConfirmDialog
- User może potwierdzić nadpisanie planu

### 5. Server Error (500)

**Scenario:** Backend error (database, unexpected error)

**Obsługa:**
- LoadingModal zmienia się na error state
- Error icon (AlertCircle)
- Message: "Wystąpił błąd podczas generowania planu. Spróbuj ponownie."
- Button "Spróbuj ponownie" → retry API call
- Button "Zamknij" → close modal, stay on /survey
- Log error do console (production: send to Sentry)

### 6. AI Service Unavailable (503)

**Scenario:** OpenRouter API unavailable

**Obsługa:**
- LoadingModal → error state
- Message: "Usługa AI jest tymczasowo niedostępna. Spróbuj za chwilę."
- Button "Spróbuj ponownie"
- Button "Zamknij"

### 7. Timeout (> 60 seconds)

**Scenario:** AI generation takes too long

**Obsługa:**
- LoadingModal → timeout state
- Message: "Generowanie planu trwało zbyt długo. Spróbuj ponownie."
- Button "Spróbuj ponownie" → new API call
- Button "Zamknij" → close modal
- Note: Plan może być wciąż generowany w tle (async job)

**Implementacja timeout:**
```typescript
useEffect(() => {
  if (showLoadingModal && loadingModalState === "loading") {
    const timeoutId = setTimeout(() => {
      setLoadingModalState("timeout");
    }, 60000);

    return () => clearTimeout(timeoutId);
  }
}, [showLoadingModal, loadingModalState]);
```

### 8. Network Error

**Scenario:** Brak połączenia internetowego

**Obsługa:**
- Catch network error w try-catch
- Toast notification: "Sprawdź połączenie internetowe"
- Button "Spróbuj ponownie" w toast
- LoadingModal → error state z message o problemie z siecią

```typescript
try {
  const response = await fetch("/api/training-plans/generate", {...});
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    // Network error
    setApiError("Sprawdź połączenie internetowe i spróbuj ponownie.");
    setLoadingModalState("error");
  }
}
```

### 9. Browser Refresh During Generation

**Scenario:** User refreshes page podczas API call

**Obsługa:**
- LoadingModal state jest lost (nie persist)
- Form data jest zachowana w sessionStorage
- User wraca do /survey z wypełnionym formularzem
- Może spróbować ponownie wygenerować plan
- (Post-MVP: backend job queue dla resilience)

### 10. Concurrent Requests

**Scenario:** User klika "Wygeneruj plan" multiple times

**Obsługa:**
- Submit button disabled podczas `isSubmitting`
- Prevent multiple API calls
- LoadingModal pokazuje się tylko raz

```typescript
const handleSubmit = async (data: SurveyFormData) => {
  if (isSubmitting) return; // prevent concurrent requests

  setIsSubmitting(true);
  // ... API call
  setIsSubmitting(false);
};
```

## 11. Kroki implementacji

### Faza 1: Setup i struktura

1. **Utworzenie struktury plików**
   ```
   src/
   ├── pages/
   │   └── survey.astro
   ├── components/
   │   └── survey/
   │       ├── SurveyForm.tsx
   │       ├── TrainingGoalsSection.tsx
   │       ├── PersonalDataSection.tsx
   │       ├── PersonalRecordsSection.tsx
   │       ├── DisclaimerSection.tsx
   │       ├── ConfirmDialog.tsx
   │       └── LoadingModal.tsx
   ├── lib/
   │   └── hooks/
   │       ├── useFormPersistence.ts
   │       └── useTrainingPlanGeneration.ts
   └── types/
       └── survey.types.ts (jeśli potrzebne dodatkowe typy)
   ```

2. **Dodanie Shadcn/ui components** (jeśli jeszcze nie dodane)
   ```bash
   npx shadcn@latest add form
   npx shadcn@latest add input
   npx shadcn@latest add select
   npx shadcn@latest add radio-group
   npx shadcn@latest add checkbox
   npx shadcn@latest add dialog
   npx shadcn@latest add scroll-area
   npx shadcn@latest add progress
   ```

3. **Zdefiniowanie typów ViewModel**
   - Utworzenie `SurveyFormData` interface
   - Utworzenie `PersonalRecordFormData` interface
   - Zdefiniowanie Zod schema `surveyFormSchema`

### Faza 2: Podstawowe komponenty formularza

4. **Implementacja TrainingGoalsSection.tsx**
   - FormField dla goal_distance (Select)
   - FormField dla weekly_km (Input number)
   - FormField dla training_days_per_week (Input number)
   - Dodanie walidacji i error messages

5. **Implementacja PersonalDataSection.tsx**
   - FormField dla age (Input number)
   - FormField dla weight (Input number)
   - FormField dla height (Input number)
   - FormField dla gender (RadioGroup)
   - Dodanie walidacji

6. **Implementacja PersonalRecordsSection.tsx**
   - useFieldArray dla dynamicznej listy
   - PersonalRecordItem sub-component
   - Button "Dodaj rekord"
   - Button "Usuń" z disabled state
   - Walidacja minimum 1 record

7. **Implementacja DisclaimerSection.tsx**
   - Tekst disclaimer w ScrollArea
   - Checkbox akceptacji
   - Walidacja must be true

### Faza 3: Główny komponent i dialogi

8. **Implementacja SurveyForm.tsx**
   - Setup React Hook Form z Zod resolver
   - Integration wszystkich sekcji
   - Submit button z loading state
   - Conditional rendering ConfirmDialog i LoadingModal
   - Error handling i toast notifications

9. **Implementacja ConfirmDialog.tsx**
   - Shadcn Dialog z controlled state
   - DialogContent z message
   - Buttons: Anuluj i Potwierdź
   - Props: isOpen, onConfirm, onCancel

10. **Implementacja LoadingModal.tsx**
    - Shadcn Dialog niedomykalny
    - Spinner animowany (Lucide Loader2)
    - Progress messages z rotacją
    - Progress bar (opcjonalnie)
    - Error state z retry button
    - Timeout state

### Faza 4: Custom Hooks i logika

11. **Implementacja useFormPersistence**
    - Load data z sessionStorage on mount
    - Auto-save do sessionStorage (debounced)
    - clearSaved() function

12. **Implementacja useTrainingPlanGeneration**
    - checkActivePlan() function
    - generatePlan() function
    - State management (isGenerating, error)
    - Error handling dla API calls

### Faza 5: Strona Astro i integracja

13. **Implementacja survey.astro**
    - Setup DashboardLayout
    - SSR: fetch profile i personal_records (opcjonalnie)
    - Pass initialData do SurveyForm
    - Error boundary

14. **Integracja API calls**
    - GET /api/training-plans/active
    - POST /api/training-plans/generate
    - Proper error handling dla wszystkich responses
    - Redirect do /dashboard po sukcesie

### Faza 6: UX improvements

15. **Dodanie scroll to error**
    - useEffect hook do scroll to first error
    - Smooth scroll behavior
    - Focus management dla accessibility

16. **Dodanie toast notifications**
    - Success: "Plan został wygenerowany!"
    - Error: różne messages w zależności od błędu
    - Network error: "Sprawdź połączenie"

17. **Pre-fill formularza**
    - Load profile data do form defaultValues
    - Load personal_records do initial array
    - Merge z sessionStorage data jeśli istnieje

### Faza 7: Styling i responsywność

18. **Stylowanie komponentów**
    - Tailwind classes dla layoutu
    - Card styling dla sekcji
    - Button variants
    - Error message styling (red text)
    - Loading states

19. **Responsywność**
    - Mobile: stack layout, full-width Cards
    - Tablet: 1-2 kolumny dla form sections
    - Desktop: max-width container, proper spacing
    - Touch-friendly targets (min 44x44px)

### Faza 8: Accessibility

20. **Accessibility audit**
    - Semantic HTML (fieldsets, labels)
    - ARIA labels dla form fields
    - ARIA live regions dla error messages
    - Keyboard navigation (Tab order)
    - Focus management
    - Screen reader testing

### Faza 9: Testing i edge cases

21. **Testing validation**
    - Wszystkie pola wymagane
    - Numeric constraints (ranges)
    - Personal records minimum 1
    - Disclaimer must be accepted
    - Server-side validation match

22. **Testing error scenarios**
    - 401 Unauthorized → redirect
    - 400 Bad Request → inline errors
    - 500/503 → error modal
    - Network error → toast with retry
    - Timeout → timeout state

23. **Testing persistence**
    - sessionStorage save/load
    - Browser refresh zachowuje dane
    - Clear po successful submit

24. **Testing flows**
    - New user flow (brak profilu)
    - Returning user flow (pre-fill)
    - Active plan exists → ConfirmDialog
    - Successful generation → redirect

### Faza 10: Polish i dokumentacja

25. **Code review i refactoring**
    - Extract duplicate code
    - Improve error messages (Polish, user-friendly)
    - Add comments gdzie potrzebne
    - Type safety check

26. **Performance optimization**
    - Debounce validation
    - Memoize expensive calculations
    - Lazy load components jeśli potrzebne
    - Optimize re-renders

27. **Documentation**
    - Dodanie JSDoc comments
    - README dla survey components
    - User guide (opcjonalnie)

28. **Final testing**
    - Manual testing wszystkich flows
    - Cross-browser testing (Chrome, Firefox, Safari)
    - Mobile devices testing (iOS, Android)
    - Accessibility testing (VoiceOver, NVDA)

---

## Podsumowanie

Plan implementacji widoku ankiety (Survey) obejmuje 28 kroków podzielonych na 10 faz, od setupu struktury plików przez implementację komponentów, custom hooks, integrację API, aż po accessibility, testing i finalne polish. Każdy krok jest szczegółowo opisany i mapuje się do konkretnych wymagań z PRD i User Story US-005.

Kluczowe aspekty implementacji:
- **React Hook Form + Zod** dla zarządzania stanem i walidacji
- **Shadcn/ui components** dla spójnego UI
- **sessionStorage persistence** dla ochrony przed utratą danych
- **Custom hooks** dla reusable logic (persistence, API calls)
- **Comprehensive error handling** dla wszystkich scenariuszy
- **Accessibility-first approach** z semantic HTML i ARIA
- **Responsive design** dla mobile/tablet/desktop

Implementacja powinna zająć doświadczonemu frontend developerowi około 3-5 dni pracy, w zależności od doświadczenia z technologiami (Astro, React Hook Form, Zod).
