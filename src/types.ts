import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// ============================================================================
// Entity Types (Direct database table mappings)
// ============================================================================

/**
 * Profile entity - represents user's profile data from the survey
 * Maps directly to profiles table Row type
 */
export type Profile = Tables<"profiles">;

/**
 * Personal record entity - represents user's race time records
 * Maps directly to personal_records table Row type
 */
export type PersonalRecord = Tables<"personal_records">;

/**
 * Training plan entity - represents a generated 10-week training plan
 * Maps directly to training_plans table Row type
 */
export type TrainingPlan = Tables<"training_plans">;

/**
 * Workout day entity - represents a single day in a training plan
 * Maps directly to workout_days table Row type
 */
export type WorkoutDay = Tables<"workout_days">;

// ============================================================================
// Enum Types (Re-exported for convenience)
// ============================================================================

/**
 * Distance type enum - valid race distances
 * Values: "5K" | "10K" | "Half Marathon" | "Marathon"
 */
export type DistanceType = Enums<"distance_type">;

/**
 * Gender type enum - valid gender values
 * Values: "M" | "F"
 */
export type GenderType = Enums<"gender_type">;

// ============================================================================
// DTOs (Data Transfer Objects) - API Response Types
// ============================================================================

/**
 * Profile DTO - returned by GET /api/profile
 * Contains all profile fields including timestamps
 */
export type ProfileDTO = Profile;

/**
 * Personal Record DTO - returned by GET /api/personal-records
 * Contains all personal record fields including id and timestamps
 */
export type PersonalRecordDTO = PersonalRecord;

/**
 * Workout Day DTO - returned in training plan responses
 * Contains all workout day fields including completion status
 */
export type WorkoutDayDTO = WorkoutDay;

/**
 * Completion statistics DTO - calculated stats for active training plan
 * Not directly tied to database entity - computed from workout_days
 */
export interface CompletionStatsDTO {
  /** Total number of workout days (excluding rest days) */
  total_workouts: number;
  /** Number of completed workout days */
  completed_workouts: number;
  /** Total number of rest days in the plan */
  total_rest_days: number;
  /** Completion percentage (0-100) */
  completion_percentage: number;
  /** Whether the plan is fully completed (all workouts done OR end_date passed) */
  is_plan_completed: boolean;
}

/**
 * Training Plan DTO - base training plan response without workout days
 * Used when workout days are not needed in the response
 */
export type TrainingPlanDTO = TrainingPlan;

/**
 * Training Plan with Workouts DTO - returned by GET /api/training-plans/active
 * Extends TrainingPlan with array of workout days and completion statistics
 */
export type TrainingPlanWithWorkoutsDTO = TrainingPlan & {
  /** All 70 workout days for this plan, sorted by day_number */
  workout_days: WorkoutDayDTO[];
  /** Calculated completion statistics */
  completion_stats: CompletionStatsDTO;
};

// ============================================================================
// Command Models (Input DTOs) - API Request Types
// ============================================================================

/**
 * Profile Input DTO - used in POST /api/training-plans/generate request
 * Omits system-managed fields: user_id, created_at, updated_at
 * These fields are set by the backend during profile creation/update
 */
export type ProfileInputDTO = Omit<TablesInsert<"profiles">, "user_id" | "created_at" | "updated_at">;

/**
 * Create Personal Record DTO - used in POST /api/personal-records
 * Omits system-managed fields: id, user_id, created_at
 * These fields are set by the backend during record creation
 */
export type CreatePersonalRecordDTO = Omit<TablesInsert<"personal_records">, "id" | "user_id" | "created_at">;

/**
 * Personal Record Input DTO - used in training plan generation request
 * Same structure as CreatePersonalRecordDTO but semantically different context
 * Used when submitting personal records as part of plan generation
 */
export type PersonalRecordInputDTO = CreatePersonalRecordDTO;

/**
 * Generate Training Plan Command - used in POST /api/training-plans/generate
 * Combines profile data and personal records for AI-powered plan generation
 * This triggers a complex transactional operation:
 * 1. Upsert profile
 * 2. Replace personal records
 * 3. Deactivate old plan
 * 4. Generate new plan via AI
 * 5. Create 70 workout days
 */
export interface GenerateTrainingPlanCommand {
  /** User profile data from survey */
  profile: ProfileInputDTO;
  /** Array of personal records (at least 1 required per PRD) */
  personal_records: PersonalRecordInputDTO[];
}

/**
 * Update Workout Day Command - used in PATCH /api/workout-days/:id
 * Only allows updating completion status
 * Note: Cannot mark rest days as completed (enforced by database constraint)
 */
export type UpdateWorkoutDayCommand = Pick<TablesUpdate<"workout_days">, "is_completed">;

// ============================================================================
// API Error Response Types
// ============================================================================

/**
 * Validation error detail - describes a single field validation failure
 */
export interface ValidationErrorDetail {
  /** Name of the field that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
}

/**
 * API Error Response - standard error response format for all endpoints
 */
export interface ApiErrorResponse {
  error: {
    /** Human-readable error message */
    message: string;
    /** Optional error code for programmatic handling */
    code?: string;
    /** Optional validation error details (for 400 Bad Request) */
    details?: ValidationErrorDetail[];
    /** Optional flag indicating user confirmation required (for 409 Conflict) */
    requires_confirmation?: boolean;
  };
}

/**
 * API Success Response - standard success response format for all endpoints
 * T is the data type being returned (DTO or array of DTOs)
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Generic API Response - union of success and error responses
 * Use this when handling API responses that could be either success or error
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// ViewModel Types - Dashboard Components
// ============================================================================

/**
 * Props for TrainingPlanView component
 */
export interface TrainingPlanViewProps {
  /** Training plan with all workout days and completion statistics */
  trainingPlan: TrainingPlanWithWorkoutsDTO;
}

/**
 * Props for WeekAccordion component
 */
export interface WeekAccordionProps {
  /** Week number (1-10) */
  weekNumber: number;
  /** 7 workout days for this week */
  workoutDays: WorkoutDay[];
  /** Callback to toggle workout completion status */
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  /** Whether this week contains today's date (for auto-expand) */
  isCurrentWeek?: boolean;
}

/**
 * Props for WorkoutDayCard component
 */
export interface WorkoutDayCardProps {
  /** Workout day data to display */
  workoutDay: WorkoutDay;
  /** Callback to toggle workout completion status */
  onToggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  /** Whether this is today's workout (for ref and auto-scroll) */
  isToday?: boolean;
}

/**
 * Props for PlanHeader component
 */
export interface PlanHeaderProps {
  /** Training plan data */
  trainingPlan: TrainingPlan;
  /** Calculated completion statistics */
  completionStats: CompletionStatsDTO;
}

/**
 * Props for ScrollToTodayFAB component
 */
export interface ScrollToTodayFABProps {
  /** Ref to today's workout card for scrolling */
  todayCardRef: React.RefObject<HTMLDivElement>;
}
