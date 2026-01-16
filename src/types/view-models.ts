import type { WorkoutDayDTO } from "@/types";

/**
 * Week View Model - represents one week of training with calculated statistics
 * Used in WeekAccordion component to display week summary
 */
export interface WeekViewModel {
  /** Week number (1-10) */
  weekNumber: number;
  /** Array of 7 workout days for this week */
  workoutDays: WorkoutDayDTO[];
  /** Number of completed workouts in this week (excluding rest days) */
  completedCount: number;
  /** Total number of workouts in this week (excluding rest days) */
  totalWorkouts: number;
}

/**
 * Workout Day View Model - extends WorkoutDayDTO with additional UI helper fields
 * Used in WorkoutDayCard for enhanced display logic
 */
export interface WorkoutDayViewModel extends WorkoutDayDTO {
  /** Whether this is today's date */
  isToday: boolean;
  /** Week number (1-10) this day belongs to */
  weekNumber: number;
  /** Formatted date string for display (DD.MM.YYYY) */
  displayDate: string;
  /** Whether the date is in the past */
  isPast: boolean;
  /** Whether the date is in the future */
  isFuture: boolean;
}
