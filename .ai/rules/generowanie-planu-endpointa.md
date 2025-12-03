Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
   <route_api_specification>

#### PATCH /api/workout-days/:id

**Description:** Update a workout day (primarily for toggling completion status)

**Authentication:** Required (JWT token)

**Path Parameters:**

- `id` (uuid) - Workout day ID to update

**Query Parameters:** None

**Request Body:**

```json
{
  "is_completed": true
}
```

**Validation Rules:**

- `is_completed`: Required, boolean
- Cannot mark rest days as completed (database constraint will reject)

**Response (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "training_plan_id": "uuid",
    "day_number": 5,
    "date": "2025-01-12",
    "workout_description": "Easy run 8km, conversational pace",
    "is_rest_day": false,
    "is_completed": true,
    "completed_at": "2025-01-12T19:15:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input or attempting to mark rest day as completed
  ```json
  {
    "error": {
      "message": "Validation failed",
      "details": [
        {
          "field": "is_completed",
          "message": "Rest days cannot be marked as completed"
        }
      ]
    }
  }
  ```
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Workout belongs to another user's plan (RLS blocks)
- `404 Not Found` - Workout day does not exist
- `500 Internal Server Error` - Database error

**Implementation Notes:**

- If `is_completed` = true, set `completed_at` = NOW()
- If `is_completed` = false, set `completed_at` = NULL
- RLS policy verifies ownership via JOIN to training_plans:
  ```sql
  EXISTS (
    SELECT 1 FROM training_plans
    WHERE training_plans.id = workout_days.training_plan_id
    AND training_plans.user_id = auth.uid()
  )
  ```
- Database constraint prevents marking rest days as completed

**Development/Testing Notes:**

⚠️ **TRYB DEWELOPERSKI** - Dla celów testowania bez autentykacji:

- W pliku `.env` ustaw `SKIP_AUTH=true` aby ominąć autentykację
- Tryb ten używa mock użytkownika z ID: `00000000-0000-0000-0000-000000000000`
- Middleware automatycznie używa service role client (omija RLS)
- Helper `verifyAuth()` zwraca mock użytkownika zamiast sprawdzać JWT
- **NIGDY nie używaj SKIP_AUTH=true w produkcji!**
- Implementuj endpoint z pełną autentykacją - SKIP_AUTH to tylko hack do testowania
- Gdy będziesz gotowy na produkcję, ustaw `SKIP_AUTH=false` i wszystko będzie działać z prawdziwymi JWT tokenami

Przykład testowania bez auth:

```bash
# W .env ustaw: SKIP_AUTH=true
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
# Brak nagłówka Authorization - działa!
```

---

</route_api_specification>

2. Related database resources:
   <related_db_resources>
   Check file: db-plan.md
   </related_db_resources>

3. Definicje typów:
   <type_definitions>
   check file: src/types.ts
   </type_definitions>

4. Tech stack:
   <tech_stack>
   Check tech-stack.md
   </tech_stack>

5. Implementation rules:
   <implementation_rules>
   Check backend.mdc
   </implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu interfejsu API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (istniejącego lub nowego, jeśli nie istnieje).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API endpointa, zasobami bazy danych i regułami implementacji.
6. Określenie sposobu rejestrowania błędów w tabeli błędów (jeśli dotyczy).
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa w oparciu o specyfikację API i stack technologiczny.
8. Nakreśl potencjalne scenariusze błędów i odpowiadające im kody stanu.

Po przeprowadzeniu analizy utwórz szczegółowy plan wdrożenia w formacie markdown. Plan powinien zawierać następujące sekcje:

1. Przegląd punktu końcowego
2. Szczegóły żądania
3. Szczegóły odpowiedzi
4. Przepływ danych
5. Względy bezpieczeństwa
6. Obsługa błędów
7. Wydajność
8. Kroki implementacji

W całym planie upewnij się, że

- Używać prawidłowych kodów stanu API:
  - 200 dla pomyślnego odczytu
  - 201 dla pomyślnego utworzenia
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych zasobów
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown. Oto przykład tego, jak powinny wyglądać dane wyjściowe:

``markdown

# API Endpoint Implementation Plan: [Nazwa punktu końcowego]

## 1. Przegląd punktu końcowego

[Krótki opis celu i funkcjonalności punktu końcowego]

## 2. Szczegóły żądania

- Metoda HTTP: [GET/POST/PUT/DELETE]
- Struktura URL: [wzorzec URL]
- Parametry:
  - Wymagane: [Lista wymaganych parametrów]
  - Opcjonalne: [Lista opcjonalnych parametrów]
- Request Body: [Struktura treści żądania, jeśli dotyczy]

## 3. Wykorzystywane typy

[DTOs i Command Modele niezbędne do implementacji]

## 3. Szczegóły odpowiedzi

[Oczekiwana struktura odpowiedzi i kody statusu]

## 4. Przepływ danych

[Opis przepływu danych, w tym interakcji z zewnętrznymi usługami lub bazami danych]

## 5. Względy bezpieczeństwa

[Szczegóły uwierzytelniania, autoryzacji i walidacji danych]

## 6. Obsługa błędów

[Lista potencjalnych błędów i sposób ich obsługi]

## 7. Rozważania dotyczące wydajności

[Potencjalne wąskie gardła i strategie optymalizacji]

## 8. Etapy wdrożenia

1. [Krok 1]
2. [Krok 2]
3. [Krok 3]
   ...

```

Końcowe wyniki powinny składać się wyłącznie z planu wdrożenia w formacie markdown i nie powinny powielać ani powtarzać żadnej pracy wykonanej w sekcji analizy.

Pamiętaj, aby zapisać swój plan wdrożenia jako .ai/view-implementation-plan.md. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów.
```
