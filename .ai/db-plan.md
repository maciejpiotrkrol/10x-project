# Schemat bazy danych PostgreSQL - Athletica MVP

## 1. Typy niestandardowe (ENUM)

### gender_type
```sql
CREATE TYPE gender_type AS ENUM ('M', 'F');
```
Typ określający płeć użytkownika.

### distance_type
```sql
CREATE TYPE distance_type AS ENUM ('5K', '10K', 'Half Marathon', 'Marathon');
```
Typ określający dystanse celowe i rekordy życiowe. Wspólny dla `profiles.goal_distance` i `personal_records.distance`.

---

## 2. Tabele

### 2.1. profiles

Tabela przechowująca dane użytkownika z ankiety. Relacja 1:1 z `auth.users`. Dane są nadpisywane przy każdym wypełnieniu nowej ankiety (brak historyzacji w MVP).

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_distance distance_type NOT NULL,
  weekly_km DECIMAL(6,2) NOT NULL,
  training_days_per_week INTEGER NOT NULL CHECK (training_days_per_week BETWEEN 2 AND 7),
  age INTEGER NOT NULL CHECK (age > 0 AND age < 120),
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight < 300),
  height INTEGER NOT NULL CHECK (height > 0 AND height < 300),
  gender gender_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**
- `user_id` (UUID, PRIMARY KEY, FK): Identyfikator użytkownika z Supabase Auth
- `goal_distance` (distance_type, NOT NULL): Dystans docelowy użytkownika
- `weekly_km` (DECIMAL(6,2), NOT NULL): Średni tygodniowy kilometraż
- `training_days_per_week` (INTEGER, NOT NULL): Liczba dni treningowych w tygodniu (2-7)
- `age` (INTEGER, NOT NULL): Wiek użytkownika (1-119)
- `weight` (DECIMAL(5,2), NOT NULL): Waga użytkownika w kg (0-300)
- `height` (INTEGER, NOT NULL): Wzrost użytkownika w cm (0-300)
- `gender` (gender_type, NOT NULL): Płeć użytkownika
- `created_at` (TIMESTAMPTZ, NOT NULL): Data utworzenia profilu
- `updated_at` (TIMESTAMPTZ, NOT NULL): Data ostatniej aktualizacji profilu

**Constraints:**
- CHECK dla `training_days_per_week`: wartość między 2 a 7
- CHECK dla `age`: wartość większa od 0 i mniejsza od 120
- CHECK dla `weight`: wartość większa od 0 i mniejsza od 300
- CHECK dla `height`: wartość większa od 0 i mniejsza od 300
- ON DELETE CASCADE: usunięcie użytkownika usuwa jego profil

---

### 2.2. personal_records

Tabela przechowująca rekordy życiowe użytkownika dla różnych dystansów. Relacja 1:N z `auth.users` (jeden użytkownik może mieć wiele rekordów). Brak kolumny `achieved_at` w MVP - rekordy są proste i bez historyzacji.

```sql
CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distance distance_type NOT NULL,
  time_seconds INTEGER NOT NULL CHECK (time_seconds > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Kolumny:**
- `id` (UUID, PRIMARY KEY): Unikalny identyfikator rekordu
- `user_id` (UUID, NOT NULL, FK): Identyfikator użytkownika
- `distance` (distance_type, NOT NULL): Dystans, na którym osiągnięto rekord
- `time_seconds` (INTEGER, NOT NULL): Czas w sekundach
- `created_at` (TIMESTAMPTZ, NOT NULL): Data dodania rekordu

**Constraints:**
- CHECK dla `time_seconds`: wartość większa od 0
- ON DELETE CASCADE: usunięcie użytkownika usuwa jego rekordy

---

### 2.3. training_plans

Tabela przechowująca plany treningowe użytkowników. Relacja 1:N z `auth.users`, ale tylko jeden plan może być aktywny na raz (`is_active = true`). Stare plany są oznaczane jako nieaktywne (soft-delete) zamiast fizycznego usuwania, co pozwala na przyszłą funkcję historii planów.

```sql
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_active_plan UNIQUE (user_id, is_active) WHERE (is_active = true)
);
```

**Kolumny:**
- `id` (UUID, PRIMARY KEY): Unikalny identyfikator planu
- `user_id` (UUID, NOT NULL, FK): Identyfikator użytkownika
- `start_date` (DATE, NOT NULL): Data rozpoczęcia planu (dzień generowania)
- `end_date` (DATE, NOT NULL): Data zakończenia planu (start_date + 69 dni)
- `generated_at` (TIMESTAMPTZ, NOT NULL): Timestamp generowania planu
- `is_active` (BOOLEAN, NOT NULL): Czy plan jest aktywny (true = aktywny, false = historyczny)
- `metadata` (JSONB, NULL): Dodatkowe metadane dla przyszłej elastyczności
- `created_at` (TIMESTAMPTZ, NOT NULL): Data utworzenia rekordu
- `updated_at` (TIMESTAMPTZ, NOT NULL): Data ostatniej aktualizacji rekordu

**Constraints:**
- UNIQUE constraint: tylko jeden aktywny plan na użytkownika (`unique_active_plan`)
- ON DELETE CASCADE: usunięcie użytkownika usuwa jego plany (i kaskadowo workout_days)

**Notatki:**
- Partial unique index automatycznie filtruje tylko rekordy z `is_active = true`
- Kolumna `metadata` przygotowana na przyszłe rozszerzenia bez konieczności migracji

---

### 2.4. workout_days

Tabela przechowująca poszczególne dni treningowe w planie. Relacja 1:70 z `training_plans` (każdy plan ma 70 dni). Granularna struktura (każdy dzień jako osobny rekord) ułatwia query'owanie, filtrowanie i aktualizacje statusu wykonania.

```sql
CREATE TABLE workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 70),
  date DATE NOT NULL,
  workout_description TEXT NOT NULL,
  is_rest_day BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  CONSTRAINT unique_day_per_plan UNIQUE (training_plan_id, day_number),
  CONSTRAINT no_completed_rest_days CHECK (NOT (is_rest_day = true AND is_completed = true))
);
```

**Kolumny:**
- `id` (UUID, PRIMARY KEY): Unikalny identyfikator dnia treningowego
- `training_plan_id` (UUID, NOT NULL, FK): Identyfikator planu treningowego
- `day_number` (INTEGER, NOT NULL): Numer dnia w planie (1-70)
- `date` (DATE, NOT NULL): Data konkretnego dnia treningowego
- `workout_description` (TEXT, NOT NULL): Pełny opis treningu wygenerowany przez AI (sformatowany tekst)
- `is_rest_day` (BOOLEAN, NOT NULL): Czy dzień jest dniem odpoczynku
- `is_completed` (BOOLEAN, NOT NULL): Czy trening został oznaczony jako wykonany
- `completed_at` (TIMESTAMPTZ, NULL): Timestamp oznaczenia jako wykonany (NULL jeśli niewykonany)

**Constraints:**
- CHECK dla `day_number`: wartość między 1 a 70
- UNIQUE constraint: unikalna kombinacja `training_plan_id` + `day_number`
- CHECK constraint: dni odpoczynku nie mogą być oznaczone jako wykonane
- ON DELETE CASCADE: usunięcie planu usuwa wszystkie jego dni treningowe

**Notatki:**
- Typ TEXT dla `workout_description` zapewnia elastyczność dla AI do generowania sformatowanych bloków tekstowych
- `completed_at` umożliwia śledzenie, kiedy trening został oznaczony jako wykonany (bez historii zmian w MVP)

---

## 3. Relacje między tabelami

### Diagram relacji

```
auth.users (Supabase Auth)
    ├── 1:1 ──> profiles
    ├── 1:N ──> personal_records
    └── 1:N ──> training_plans
                    └── 1:70 ──> workout_days
```

### Szczegółowy opis relacji

1. **auth.users → profiles** (1:1)
   - Jeden użytkownik ma dokładnie jeden profil
   - `profiles.user_id` REFERENCES `auth.users.id`
   - ON DELETE CASCADE

2. **auth.users → personal_records** (1:N)
   - Jeden użytkownik może mieć wiele rekordów życiowych (różne dystanse)
   - `personal_records.user_id` REFERENCES `auth.users.id`
   - ON DELETE CASCADE

3. **auth.users → training_plans** (1:N, ale tylko 1 aktywny)
   - Jeden użytkownik może mieć wiele planów (historycznych)
   - Tylko jeden plan może być aktywny jednocześnie (`is_active = true`)
   - `training_plans.user_id` REFERENCES `auth.users.id`
   - ON DELETE CASCADE

4. **training_plans → workout_days** (1:70)
   - Jeden plan treningowy ma dokładnie 70 dni treningowych
   - `workout_days.training_plan_id` REFERENCES `training_plans.id`
   - ON DELETE CASCADE

---

## 4. Indeksy

### Indeksy dla wydajności zapytań

```sql
-- Indeks dla rekordów życiowych użytkownika
CREATE INDEX idx_personal_records_user_id ON personal_records(user_id);

-- Partial index dla aktywnych planów (optymalizacja najczęstszego query)
CREATE INDEX idx_training_plans_user_active ON training_plans(user_id, is_active) WHERE is_active = true;

-- Indeks dla dni treningowych w planie
CREATE INDEX idx_workout_days_plan_id ON workout_days(training_plan_id);

-- Indeks dla wyszukiwania dni treningowych po dacie
CREATE INDEX idx_workout_days_date ON workout_days(date);
```

**Uzasadnienie:**
- `idx_personal_records_user_id`: Szybkie pobieranie wszystkich rekordów użytkownika
- `idx_training_plans_user_active`: Partial index optymalizuje najczęstsze zapytanie (pobieranie aktywnego planu użytkownika)
- `idx_workout_days_plan_id`: Szybkie pobieranie wszystkich dni dla konkretnego planu
- `idx_workout_days_date`: Umożliwia filtrowanie i sortowanie dni treningowych po dacie

**Strategia indeksowania w MVP:**
- Minimalistyczne podejście - tylko niezbędne indeksy
- Unikanie over-indexing (mniejszy koszt INSERT/UPDATE)
- Możliwość dodania dodatkowych indeksów w przyszłości na podstawie rzeczywistych danych użytkowania

---

## 5. Row Level Security (RLS) Policies

### 5.1. Polityki RLS dla profiles

```sql
-- Włączenie RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT dla authenticated users
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Polityka INSERT dla authenticated users
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Polityka UPDATE dla authenticated users
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Polityka DELETE dla authenticated users
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Blokada dla anon users
CREATE POLICY "Anon users have no access to profiles"
ON profiles FOR ALL
TO anon
USING (false);
```

### 5.2. Polityki RLS dla personal_records

```sql
-- Włączenie RLS
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT dla authenticated users
CREATE POLICY "Users can view own personal records"
ON personal_records FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Polityka INSERT dla authenticated users
CREATE POLICY "Users can insert own personal records"
ON personal_records FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Polityka UPDATE dla authenticated users
CREATE POLICY "Users can update own personal records"
ON personal_records FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Polityka DELETE dla authenticated users
CREATE POLICY "Users can delete own personal records"
ON personal_records FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Blokada dla anon users
CREATE POLICY "Anon users have no access to personal records"
ON personal_records FOR ALL
TO anon
USING (false);
```

### 5.3. Polityki RLS dla training_plans

```sql
-- Włączenie RLS
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT dla authenticated users
CREATE POLICY "Users can view own training plans"
ON training_plans FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Polityka INSERT dla authenticated users
CREATE POLICY "Users can insert own training plans"
ON training_plans FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Polityka UPDATE dla authenticated users
CREATE POLICY "Users can update own training plans"
ON training_plans FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Polityka DELETE dla authenticated users
CREATE POLICY "Users can delete own training plans"
ON training_plans FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Blokada dla anon users
CREATE POLICY "Anon users have no access to training plans"
ON training_plans FOR ALL
TO anon
USING (false);
```

### 5.4. Polityki RLS dla workout_days

```sql
-- Włączenie RLS
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT dla authenticated users (przez JOIN z training_plans)
CREATE POLICY "Users can view own workout days"
ON workout_days FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM training_plans
    WHERE training_plans.id = workout_days.training_plan_id
    AND training_plans.user_id = auth.uid()
  )
);

-- Polityka INSERT dla authenticated users
CREATE POLICY "Users can insert own workout days"
ON workout_days FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM training_plans
    WHERE training_plans.id = workout_days.training_plan_id
    AND training_plans.user_id = auth.uid()
  )
);

-- Polityka UPDATE dla authenticated users (głównie dla oznaczania jako wykonany)
CREATE POLICY "Users can update own workout days"
ON workout_days FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM training_plans
    WHERE training_plans.id = workout_days.training_plan_id
    AND training_plans.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM training_plans
    WHERE training_plans.id = workout_days.training_plan_id
    AND training_plans.user_id = auth.uid()
  )
);

-- Polityka DELETE dla authenticated users
CREATE POLICY "Users can delete own workout days"
ON workout_days FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM training_plans
    WHERE training_plans.id = workout_days.training_plan_id
    AND training_plans.user_id = auth.uid()
  )
);

-- Blokada dla anon users
CREATE POLICY "Anon users have no access to workout days"
ON workout_days FOR ALL
TO anon
USING (false);
```

**Notatki dotyczące RLS:**
- Wszystkie tabele mają włączone RLS
- Granularne polityki per operacja (SELECT, INSERT, UPDATE, DELETE)
- Separacja ról: `anon` (brak dostępu), `authenticated` (pełny dostęp do własnych danych)
- Tabela `workout_days` nie ma bezpośredniego `user_id`, więc polityki używają EXISTS z JOIN do `training_plans`

---

## 6. Funkcje i triggery

### 6.1. Funkcja automatycznej aktualizacji updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 6.2. Triggery dla automatycznej aktualizacji updated_at

```sql
-- Trigger dla profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla training_plans
CREATE TRIGGER update_training_plans_updated_at
BEFORE UPDATE ON training_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Notatki:**
- Funkcja automatycznie aktualizuje kolumnę `updated_at` przy każdej operacji UPDATE
- Triggery stosowane tylko dla tabel z kolumną `updated_at` (`profiles`, `training_plans`)
- Tabela `workout_days` nie wymaga `updated_at` - używa `completed_at` do śledzenia zmian statusu

---

## 7. Walidacja na poziomie aplikacji

Poniższe reguły walidacji powinny być implementowane na poziomie aplikacji (nie na poziomie bazy danych):

1. **Wymagany co najmniej jeden personal record przed generowaniem planu**
   - Zapytanie: `SELECT COUNT(*) FROM personal_records WHERE user_id = $1`
   - Sprawdzenie: count >= 1

2. **Dokładnie 70 dni w planie**
   - Przy generowaniu planu aplikacja tworzy INSERT dla 70 rekordów `workout_days`
   - Numeracja `day_number` od 1 do 70

3. **Daty rozpoczęcia i zakończenia planu**
   - `start_date` = data generowania planu (dzisiejsza data)
   - `end_date` = `start_date` + 69 dni (70 dni łącznie, licząc od dnia 1)

4. **Proces generowania nowego planu treningowego**
   ```sql
   -- Krok 1: Dezaktywacja starego planu
   UPDATE training_plans
   SET is_active = false
   WHERE user_id = $1 AND is_active = true;

   -- Krok 2: Utworzenie nowego planu
   INSERT INTO training_plans (user_id, start_date, end_date, is_active)
   VALUES ($1, $2, $3, true);

   -- Krok 3: Utworzenie 70 dni treningowych
   INSERT INTO workout_days (training_plan_id, day_number, date, workout_description, is_rest_day)
   VALUES ($1, $2, $3, $4, $5); -- x70 razy
   ```

5. **Sprawdzenie ukończenia planu**
   - Logika w aplikacji sprawdza, czy `end_date` minęła LUB wszystkie treningi (z `is_rest_day = false`) zostały oznaczone jako wykonane
   - Wyświetlenie pop-up z gratulacjami

**Zalety walidacji na poziomie aplikacji:**
- Bardziej czytelne komunikaty błędów dla użytkownika
- Łatwiejsze debugowanie i testowanie
- Mniejsze obciążenie bazy danych
- Elastyczność w zmianie reguł biznesowych bez modyfikacji schematu DB

---

## 8. Dodatkowe uwagi i wyjaśnienia

### 8.1. Decyzje architektoniczne

**Brak historyzacji profilu**
- Dane z ankiety są nadpisywane przy każdym wypełnieniu nowej ankiety
- Upraszcza to strukturę i jest wystarczające dla MVP
- W przyszłości można dodać tabelę `profile_history` bez konieczności migracji danych

**Soft-delete dla training_plans**
- Zamiast fizycznego usuwania, stare plany są oznaczane jako `is_active = false`
- Przygotowuje na przyszłą funkcję "historia planów"
- Minimalne koszty storage w MVP, duża wartość dla analiz produktowych

**Granularna struktura workout_days**
- 70 osobnych rekordów zamiast JSONB
- Ułatwia query'owanie, filtrowanie i aktualizacje statusu wykonania
- Umożliwia indeksowanie i wydajne wyszukiwanie po dacie

**UUID zamiast SERIAL**
- Globalna unikalność identyfikatorów
- Bezpieczeństwo (trudniejsze do przewidzenia niż sekwencyjne ID)
- Przygotowanie na distributed systems w przyszłości

**TIMESTAMPTZ zamiast TIMESTAMP**
- Prawidłowe zarządzanie strefami czasowymi
- Ważne dla użytkowników z różnych lokalizacji
- Zgodność z best practices PostgreSQL

### 8.2. Wydajność i skalowalność

**Indeksowanie**
- Minimalistyczne podejście - tylko niezbędne indeksy
- Możliwość dodania dodatkowych indeksów w przyszłości na podstawie rzeczywistych danych użytkowania
- Partial index dla aktywnych planów optymalizuje najczęstsze zapytania

**Storage**
- Zachowywanie nieaktywnych planów - koszt minimalny w MVP, wartość dla przyszłych analiz
- Brak automatycznego czyszczenia - dane historyczne przydatne dla product insights
- W przyszłości można rozważyć partycjonowanie tabeli `workout_days` po dacie

**Query optimization**
- Relacje 1:N i 1:1 zapewniają wydajne JOIN'y
- ON DELETE CASCADE automatycznie czyści powiązane dane
- RLS policies używają indeksowanych kolumn (`user_id`, `is_active`)

### 8.3. Bezpieczeństwo

**Row Level Security (RLS)**
- Włączone dla wszystkich tabel
- Granularne polityki per operacja
- Separacja ról: `anon` (brak dostępu), `authenticated` (dostęp do własnych danych)
- Dodatkowe zabezpieczenie poza autentykacją Supabase

**Constraints**
- Foreign keys z ON DELETE CASCADE zapobiegają osieroconým rekordom
- CHECK constraints zapewniają poprawność danych na poziomie DB
- UNIQUE constraints zapobiegają duplikatom (tylko jeden aktywny plan)

**Walidacja**
- Podstawowa walidacja na poziomie DB (CHECK constraints)
- Szczegółowa walidacja na poziomie aplikacji (lepsze UX)
- Brak zaufania do danych wejściowych (defense in depth)

### 8.4. Migracja i deployment

**Pojedynczy plik migracji**
- `supabase/migrations/20250108000000_create_initial_schema.sql`
- Zawiera wszystkie elementy schematu w jednym miejscu
- Atomowość operacji - albo wszystko się powiedzie, albo nic
- Kompletny snapshot struktury DB

**Kolejność operacji w migracji:**
1. CREATE TYPE (gender_type, distance_type)
2. CREATE TABLE (profiles, personal_records, training_plans, workout_days)
3. CREATE INDEX
4. ALTER TABLE ... ENABLE ROW LEVEL SECURITY
5. CREATE POLICY (RLS policies)
6. CREATE FUNCTION (update_updated_at_column)
7. CREATE TRIGGER

**Rollback strategy:**
- Migracja powinna zawierać sekcję `-- Down migration` dla cofnięcia zmian
- Kolejność rollback odwrotna do kolejności tworzenia
- Testowanie migracji na środowisku deweloperskim przed production

### 8.5. Przyszłe rozszerzenia (poza MVP)

**Historia planów treningowych**
- Obecnie przygotowane przez soft-delete (`is_active = false`)
- W przyszłości dodać UI do przeglądania historycznych planów
- Możliwość porównywania planów i śledzenia długoterminowych postępów

**Analityka i metryki**
- Widoki materializowane dla dashboardu administracyjnego
- Funkcje agregujące dla "procentu wykonanych treningów"
- Analiza retencji użytkowników

**Rozszerzenie dystansów**
- Obecnie tylko 4 popularne dystanse (5K, 10K, Half Marathon, Marathon)
- W przyszłości: 15K, 30K, Ultra Marathon, custom distances
- Zmiana ENUM wymaga migracji, alternatywa: tabela `distances`

**Partycjonowanie**
- Jeśli liczba użytkowników i planów znacznie wzrośnie
- Partycjonowanie `workout_days` po dacie lub `training_plan_id`
- Poprawa wydajności zapytań dla dużych zbiorów danych

**Backup i recovery**
- Polityka retencji dla nieaktywnych planów (np. 2 lata)
- Automatyczne archiwizowanie starych danych
- Point-in-time recovery dla przypadków utraty danych

---

## 9. Podsumowanie

Schemat bazy danych PostgreSQL dla Athletica MVP został zaprojektowany z myślą o:
- **Prostocie**: Minimalistyczne podejście - tylko niezbędne elementy
- **Wydajności**: Odpowiednie indeksowanie i optymalizacja zapytań
- **Bezpieczeństwie**: RLS policies i constraints zapewniające integralność danych
- **Skalowalności**: Przygotowanie na przyszłe rozszerzenia bez konieczności dużych migracji
- **Zgodności z wymaganiami**: Pełne pokrycie wszystkich funkcjonalności z PRD

Struktura jest gotowa do implementacji w formie migracji Supabase. Wszystkie kluczowe decyzje zostały uzasadnione w kontekście MVP i przyszłych rozszerzeń produktu.