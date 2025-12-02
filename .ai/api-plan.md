# REST API Plan for Athletica MVP

## Project Context

This plan defines the REST API architecture for Athletica, an AI-powered running training plan generator. The API will be implemented using Astro server endpoints with Supabase backend integration.

## API Design Principles

1. **RESTful conventions** - Standard HTTP methods and resource naming
2. **Supabase RLS enforcement** - All data access secured by Row Level Security policies
3. **Type-safe operations** - Leverage TypeScript and auto-generated database types
4. **Minimal API surface for MVP** - Only essential endpoints to support user stories
5. **Transactional integrity** - Complex operations handled atomically
6. **Client-side auth** - Use Supabase Auth SDK directly (no custom auth endpoints)

---

## 1. Resources

| Resource         | Database Table     | Relationship                           |
| ---------------- | ------------------ | -------------------------------------- |
| Profile          | `profiles`         | 1:1 with authenticated user            |
| Personal Records | `personal_records` | 1:N with authenticated user            |
| Training Plans   | `training_plans`   | 1:N with authenticated user (1 active) |
| Workout Days     | `workout_days`     | 1:70 with training_plans               |

---

## 2. API Endpoints

### 2.1 Profile Management

#### GET /api/profile

**Description:** Retrieve the authenticated user's profile data (survey responses)

**Authentication:** Required (JWT token)

**Query Parameters:** None

**Request Body:** None

**Response (200 OK):**

```json
{
  "data": {
    "user_id": "uuid",
    "goal_distance": "5K" | "10K" | "Half Marathon" | "Marathon",
    "weekly_km": 25.50,
    "training_days_per_week": 4,
    "age": 32,
    "weight": 72.5,
    "height": 175,
    "gender": "M" | "F",
    "created_at": "2025-01-08T10:00:00Z",
    "updated_at": "2025-01-08T10:00:00Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Profile not yet created (user hasn't completed survey)
- `500 Internal Server Error` - Database error

**Implementation Notes:**

- Uses `context.locals.supabase.auth.getUser()` to get user_id
- Query: `SELECT * FROM profiles WHERE user_id = auth.uid()`
- RLS policy automatically enforces user can only see their own profile

---

### 2.2 Personal Records Management

#### GET /api/personal-records

**Description:** Retrieve all personal records for the authenticated user

**Authentication:** Required (JWT token)

**Query Parameters:** None

**Request Body:** None

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "distance": "5K",
      "time_seconds": 1200,
      "created_at": "2025-01-08T10:00:00Z"
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "distance": "10K",
      "time_seconds": 2700,
      "created_at": "2025-01-08T10:00:00Z"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database error

**Implementation Notes:**

- Query: `SELECT * FROM personal_records WHERE user_id = auth.uid() ORDER BY created_at DESC`
- Empty array if no records exist

---

#### POST /api/personal-records

**Description:** Add a new personal record for the authenticated user

**Authentication:** Required (JWT token)

**Query Parameters:** None

**Request Body:**

```json
{
  "distance": "5K" | "10K" | "Half Marathon" | "Marathon",
  "time_seconds": 1200
}
```

**Validation Rules:**

- `distance`: Required, must be valid distance_type enum value
- `time_seconds`: Required, integer > 0

**Response (201 Created):**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "distance": "5K",
    "time_seconds": 1200,
    "created_at": "2025-01-08T10:00:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
  ```json
  {
    "error": {
      "message": "Validation failed",
      "details": [
        {
          "field": "time_seconds",
          "message": "Must be greater than 0"
        }
      ]
    }
  }
  ```
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database error

**Implementation Notes:**

- Use Zod for validation
- `user_id` automatically set from authenticated user
- RLS policy enforces user can only insert their own records

---

#### DELETE /api/personal-records/:id

**Description:** Delete a specific personal record

**Authentication:** Required (JWT token)

**Path Parameters:**

- `id` (uuid) - Personal record ID to delete

**Query Parameters:** None

**Request Body:** None

**Response (204 No Content):**
No response body

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Record belongs to another user (RLS blocks)
- `404 Not Found` - Record does not exist
- `500 Internal Server Error` - Database error

**Implementation Notes:**

- RLS policy ensures user can only delete their own records
- Returns 404 if record doesn't exist or belongs to another user

---

### 2.3 Training Plan Management

#### POST /api/training-plans/generate

**Description:** Generate a new 10-week training plan using AI. This endpoint:

1. Updates user profile with new survey data
2. Updates/creates personal records
3. Deactivates current active plan (if exists)
4. Generates new training plan via AI
5. Creates 70 workout days
6. Marks new plan as active

**Authentication:** Required (JWT token)

**Query Parameters:** None

**Request Body:**

```json
{
  "profile": {
    "goal_distance": "Marathon",
    "weekly_km": 45.0,
    "training_days_per_week": 5,
    "age": 32,
    "weight": 72.5,
    "height": 175,
    "gender": "M"
  },
  "personal_records": [
    {
      "distance": "5K",
      "time_seconds": 1200
    },
    {
      "distance": "10K",
      "time_seconds": 2700
    }
  ]
}
```

**Validation Rules:**

Profile:

- `goal_distance`: Required, valid distance_type enum
- `weekly_km`: Required, decimal > 0
- `training_days_per_week`: Required, integer 2-7
- `age`: Required, integer 1-119
- `weight`: Required, decimal 0-300
- `height`: Required, integer 0-300
- `gender`: Required, "M" or "F"

Personal Records:

- Array must contain at least 1 record (PRD requirement)
- Each record:
  - `distance`: Required, valid distance_type enum
  - `time_seconds`: Required, integer > 0

**Response (201 Created):**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "start_date": "2025-01-08",
    "end_date": "2025-03-18",
    "generated_at": "2025-01-08T10:00:00Z",
    "is_active": true,
    "metadata": null,
    "workout_days": [
      {
        "id": "uuid",
        "training_plan_id": "uuid",
        "day_number": 1,
        "date": "2025-01-08",
        "workout_description": "Rozgrzewka 10 min, 5x1000m tempo 10K (odpoczynek 2 min), wychłodzenie 10 min",
        "is_rest_day": false,
        "is_completed": false,
        "completed_at": null
      }
      // ... 69 more workout days
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data or validation failure
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
- `401 Unauthorized` - Missing or invalid authentication token
- `409 Conflict` - Active plan exists and user hasn't confirmed overwrite
  ```json
  {
    "error": {
      "message": "Active training plan exists",
      "code": "ACTIVE_PLAN_EXISTS",
      "requires_confirmation": true
    }
  }
  ```
- `500 Internal Server Error` - Database error or AI generation error
- `503 Service Unavailable` - AI service (OpenRouter) unavailable

**Implementation Notes:**

- Transactional operation (all-or-nothing):
  1. UPSERT profile data
  2. DELETE existing personal_records, INSERT new ones
  3. UPDATE old training_plan SET is_active = false WHERE user_id = X AND is_active = true
  4. Call AI service (OpenRouter) to generate workout descriptions
  5. INSERT new training_plan
  6. INSERT 70 workout_days records
- If user has active plan, client should send confirmation flag or handle 409 response
- `start_date` = current date (plan starts immediately)
- `end_date` = start_date + 69 days (70 total days)
- AI prompt includes: goal_distance, weekly_km, training_days_per_week, personal_records, age, weight, gender
- Generate rest days based on training_days_per_week (e.g., 5 days = 2 rest days per week)
- Workout description format: Plain text with newlines, AI-generated

---

#### GET /api/training-plans/active

**Description:** Retrieve the currently active training plan with all 70 workout days

**Authentication:** Required (JWT token)

**Query Parameters:** None

**Request Body:** None

**Response (200 OK):**

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "start_date": "2025-01-08",
    "end_date": "2025-03-18",
    "generated_at": "2025-01-08T10:00:00Z",
    "is_active": true,
    "metadata": null,
    "completion_stats": {
      "total_workouts": 50,
      "completed_workouts": 12,
      "total_rest_days": 20,
      "completion_percentage": 24,
      "is_plan_completed": false
    },
    "workout_days": [
      {
        "id": "uuid",
        "training_plan_id": "uuid",
        "day_number": 1,
        "date": "2025-01-08",
        "workout_description": "Rozgrzewka 10 min, 5x1000m tempo 10K (odpoczynek 2 min), wychłodzenie 10 min",
        "is_rest_day": false,
        "is_completed": true,
        "completed_at": "2025-01-08T18:30:00Z"
      },
      {
        "id": "uuid",
        "training_plan_id": "uuid",
        "day_number": 2,
        "date": "2025-01-09",
        "workout_description": "Odpoczynek",
        "is_rest_day": true,
        "is_completed": false,
        "completed_at": null
      }
      // ... 68 more workout days
    ]
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - No active training plan exists
  ```json
  {
    "error": {
      "message": "No active training plan found",
      "code": "NO_ACTIVE_PLAN"
    }
  }
  ```
- `500 Internal Server Error` - Database error

**Implementation Notes:**

- Query with JOIN:
  ```sql
  SELECT tp.*, json_agg(wd.* ORDER BY wd.day_number) as workout_days
  FROM training_plans tp
  JOIN workout_days wd ON wd.training_plan_id = tp.id
  WHERE tp.user_id = auth.uid() AND tp.is_active = true
  GROUP BY tp.id
  ```
- Calculate completion_stats on backend:
  - `total_workouts` = COUNT(workout_days WHERE is_rest_day = false)
  - `completed_workouts` = COUNT(workout_days WHERE is_rest_day = false AND is_completed = true)
  - `completion_percentage` = (completed_workouts / total_workouts) \* 100
  - `is_plan_completed` = (end_date < today) OR (completed_workouts = total_workouts)
- RLS policies ensure user can only see their own plan
- Workout days sorted by day_number (1-70)

---

### 2.4 Workout Day Management

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

---

## 3. Authentication and Authorization

### Authentication Mechanism

**Supabase Auth with JWT Tokens**

All API endpoints (except public auth flows) require authentication via Supabase JWT tokens passed in request headers:

```
Authorization: Bearer <jwt_token>
```

**Implementation:**

- Client-side: Use Supabase Auth SDK for all auth operations
  - `supabase.auth.signUp()` - Registration (US-001)
  - `supabase.auth.signInWithPassword()` - Login (US-002)
  - `supabase.auth.signOut()` - Logout (US-003)
  - `supabase.auth.resetPasswordForEmail()` - Password reset request (US-004)
- Server-side: Access authenticated user via `context.locals.supabase.auth.getUser()`
- No custom auth endpoints needed - Supabase handles all auth flows

**Token Validation:**

```typescript
// In API endpoint handler
const {
  data: { user },
  error,
} = await Astro.locals.supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: { message: "Unauthorized" },
    }),
    { status: 401 }
  );
}
```

### Authorization via Row Level Security (RLS)

**Principle:** Database-level authorization ensures users can only access their own data

**RLS Policy Pattern:**

- All tables have RLS enabled
- Separate policies for each operation: SELECT, INSERT, UPDATE, DELETE
- Policies use `auth.uid()` to match authenticated user
- Anonymous users explicitly denied all access

**Example Policy (profiles table):**

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

**Indirect Ownership (workout_days):**

- `workout_days` doesn't have `user_id` column
- RLS policies use JOIN to verify ownership via `training_plans`:

```sql
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
```

**Security Benefits:**

- Defense in depth (app + database layers)
- Prevents data leaks even if app logic has bugs
- Automatic enforcement across all queries
- No need for manual authorization checks in API handlers

---

## 4. Validation and Business Logic

### 4.1 Input Validation

**Validation Library:** Zod

**Validation Location:** API endpoint handlers (before database operations)

**Error Response Format:**

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "field_name",
        "message": "Error description"
      }
    ]
  }
}
```

**Validation Rules by Resource:**

#### Profile Validation

```typescript
const ProfileSchema = z.object({
  goal_distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"]),
  weekly_km: z.number().positive(),
  training_days_per_week: z.number().int().min(2).max(7),
  age: z.number().int().min(1).max(119),
  weight: z.number().positive().max(300),
  height: z.number().int().positive().max(300),
  gender: z.enum(["M", "F"]),
});
```

#### Personal Record Validation

```typescript
const PersonalRecordSchema = z.object({
  distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"]),
  time_seconds: z.number().int().positive(),
});

const PersonalRecordsArraySchema = z.array(PersonalRecordSchema).min(1, "At least one personal record is required");
```

#### Training Plan Generation Request Validation

```typescript
const GeneratePlanSchema = z.object({
  profile: ProfileSchema,
  personal_records: PersonalRecordsArraySchema,
});
```

#### Workout Day Update Validation

```typescript
const WorkoutDayUpdateSchema = z.object({
  is_completed: z.boolean(),
});
```

### 4.2 Business Logic Implementation

#### BL-1: Plan Generation Process

**Location:** `POST /api/training-plans/generate` endpoint

**Process:**

1. Validate input (profile + personal_records)
2. Check for existing active plan
   - If exists and no confirmation → return 409 Conflict
3. Begin database transaction
4. Upsert user profile (UPDATE if exists, INSERT if not)
5. Replace personal records:
   - DELETE FROM personal_records WHERE user_id = X
   - INSERT new records
6. Deactivate old plan:
   - UPDATE training_plans SET is_active = false WHERE user_id = X AND is_active = true
7. Call AI service (OpenRouter.ai):
   - Send prompt with user data
   - Receive 70 workout descriptions
8. Insert new training plan:
   - start_date = today
   - end_date = today + 69 days
   - is_active = true
9. Insert 70 workout_days records:
   - Distribute rest days based on training_days_per_week
   - Assign dates (start_date + day_number - 1)
   - Set workout_description from AI response
10. Commit transaction
11. Return new plan with all workout days

**AI Prompt Template:**

```
Generate a 10-week (70-day) running training plan with the following parameters:
- Goal: {goal_distance}
- Current weekly volume: {weekly_km} km
- Training days per week: {training_days_per_week}
- Personal records: {personal_records_list}
- Runner profile: {age} years, {weight} kg, {height} cm, {gender}

Requirements:
- Exactly {training_days_per_week * 10} workout days (rest on other days)
- Progressive overload principle
- Include variety: easy runs, tempo runs, intervals, long runs
- Peak week around week 8, taper in weeks 9-10
- Format: Each workout as plain text description

Return JSON array of 70 objects:
[
  { "day_number": 1, "is_rest_day": false, "description": "..." },
  { "day_number": 2, "is_rest_day": true, "description": "Odpoczynek" },
  ...
]
```

**Error Handling:**

- Validation errors → 400 Bad Request
- Active plan conflict → 409 Conflict
- AI service timeout → 503 Service Unavailable
- Database errors → 500 Internal Server Error (rollback transaction)

---

#### BL-2: Active Plan Unique Constraint

**Location:** Database constraint + application logic

**Database Constraint:**

```sql
CONSTRAINT unique_active_plan UNIQUE (user_id, is_active) WHERE (is_active = true)
```

**Application Logic:**

- Before creating new plan: Set existing plan's `is_active = false`
- Database ensures only one active plan per user
- Client shows confirmation dialog before overwriting (US-009)

---

#### BL-3: Rest Day Completion Constraint

**Location:** Database constraint + API validation

**Database Constraint:**

```sql
CONSTRAINT no_completed_rest_days CHECK (NOT (is_rest_day = true AND is_completed = true))
```

**API Validation:**

```typescript
// In PATCH /api/workout-days/:id
if (workoutDay.is_rest_day && updateData.is_completed === true) {
  return new Response(
    JSON.stringify({
      error: {
        message: "Rest days cannot be marked as completed",
      },
    }),
    { status: 400 }
  );
}
```

---

#### BL-4: Plan Completion Detection

**Location:** `GET /api/training-plans/active` response calculation

**Logic:**

```typescript
const isCompleted =
  // All workouts completed
  completedWorkouts === totalWorkouts ||
  // Plan end date has passed
  new Date(plan.end_date) < new Date();
```

**UI Behavior (PRD US-012):**

- Client checks `completion_stats.is_plan_completed`
- If true → show congratulations popup
- Popup includes button to generate new plan

---

#### BL-5: Workout Day Completion Timestamp

**Location:** `PATCH /api/workout-days/:id` endpoint

**Logic:**

```typescript
const updateData: any = {
  is_completed: input.is_completed,
};

if (input.is_completed) {
  updateData.completed_at = new Date().toISOString();
} else {
  updateData.completed_at = null;
}
```

**Purpose:** Track when workout was marked as completed (for future analytics)

---

#### BL-6: Personal Records Requirement

**Location:** `POST /api/training-plans/generate` validation

**Logic:**

```typescript
if (!input.personal_records || input.personal_records.length === 0) {
  return new Response(
    JSON.stringify({
      error: {
        message: "At least one personal record is required to generate a plan",
      },
    }),
    { status: 400 }
  );
}
```

**PRD Reference:** Section 3.2.1 - "co najmniej jeden rekord życiowy"

---

### 4.3 Database Constraints Summary

| Constraint                                             | Table            | Description                  | Enforcement                      |
| ------------------------------------------------------ | ---------------- | ---------------------------- | -------------------------------- |
| CHECK training_days_per_week BETWEEN 2 AND 7           | profiles         | Valid training frequency     | Database + API validation        |
| CHECK age > 0 AND age < 120                            | profiles         | Valid age range              | Database + API validation        |
| CHECK weight > 0 AND weight < 300                      | profiles         | Valid weight range           | Database + API validation        |
| CHECK height > 0 AND height < 300                      | profiles         | Valid height range           | Database + API validation        |
| CHECK time_seconds > 0                                 | personal_records | Valid time                   | Database + API validation        |
| UNIQUE (user_id, is_active) WHERE is_active = true     | training_plans   | One active plan per user     | Database + application logic     |
| CHECK day_number BETWEEN 1 AND 70                      | workout_days     | Valid day range              | Application (70 records created) |
| CHECK NOT (is_rest_day = true AND is_completed = true) | workout_days     | Rest days can't be completed | Database + API validation        |
| UNIQUE (training_plan_id, day_number)                  | workout_days     | One record per day per plan  | Application (70 records created) |

---

## 5. Response Envelope Format

### Success Response

```json
{
  "data": {
    /* resource or array of resources */
  }
}
```

### Error Response

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE", // optional
    "details": [
      /* optional validation errors */
    ]
  }
}
```

---

## 6. Implementation Checklist

### Dependencies to Add

- [ ] `zod` - Input validation
- [ ] `@openrouter/ai-sdk-provider` or similar - AI service integration

### Endpoints to Implement

- [ ] GET /api/profile
- [ ] GET /api/personal-records
- [ ] POST /api/personal-records
- [ ] DELETE /api/personal-records/:id
- [ ] POST /api/training-plans/generate
- [ ] GET /api/training-plans/active
- [ ] PATCH /api/workout-days/:id

### Shared Utilities to Create

- [ ] `src/lib/api/validation.ts` - Zod schemas
- [ ] `src/lib/api/errors.ts` - Error response helpers
- [ ] `src/lib/api/auth.ts` - Auth verification helper
- [ ] `src/lib/services/ai-generator.ts` - AI plan generation service
- [ ] `src/lib/services/training-plan.ts` - Plan business logic

### Testing Considerations

- [ ] Test RLS policies work correctly
- [ ] Test transaction rollback on errors
- [ ] Test AI service timeout/failure handling
- [ ] Test validation for all edge cases
- [ ] Test rest day completion constraint
- [ ] Test unique active plan constraint

---

## 7. Future Enhancements (Post-MVP)

### Pagination (for history features)

```
GET /api/training-plans?page=1&limit=10&active=false
```

### Filtering workout days by date range

```
GET /api/workout-days?start_date=2025-01-01&end_date=2025-01-31
```

### Partial plan updates (edit individual workouts)

```
PATCH /api/workout-days/:id/description
```

### Training plan history

```
GET /api/training-plans?active=false
GET /api/training-plans/:id (specific historical plan)
```

### Export functionality

```
GET /api/training-plans/:id/export?format=pdf|ics|fit
```

### Analytics endpoints

```
GET /api/stats/completion-rate
GET /api/stats/weekly-summary
```

---

## Summary

This API plan provides a complete RESTful architecture for the Athletica MVP. The design prioritizes:

1. **Security** - RLS policies + JWT authentication
2. **Simplicity** - Minimal endpoints, clear responsibilities
3. **Type Safety** - TypeScript + Zod validation
4. **Atomicity** - Transactional plan generation
5. **User Experience** - Aggregated responses reduce client complexity

All endpoints map directly to user stories in the PRD and leverage the comprehensive database schema with proper constraints and relationships.
