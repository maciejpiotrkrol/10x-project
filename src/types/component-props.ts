import type { CompletionStatsDTO, TrainingPlanWithWorkoutsDTO, WorkoutDayDTO } from "@/types";
import type { WeekViewModel } from "@/types/view-models";

/**
 * Props for TrainingPlanView component
 */
export interface TrainingPlanViewProps {
  /** Training plan with workout days, or null if no active plan */
  trainingPlan: TrainingPlanWithWorkoutsDTO | null;
}

/**
 * Props for PlanHeader component
 */
export interface PlanHeaderProps {
  /** ISO date string for plan start date */
  startDate: string;
  /** ISO date string for plan end date */
  endDate: string;
  /** Completion statistics for the plan */
  completionStats: CompletionStatsDTO;
}

/**
 * Props for WeekAccordion component
 */
export interface WeekAccordionProps {
  /** Week view model with workout days and stats */
  week: WeekViewModel;
  /** Today's date in YYYY-MM-DD format */
  todayDate: string;
  /** Ref to today's card for scroll functionality */
  todayCardRef: React.RefObject<HTMLDivElement>;
  /** Callback when workout completion is toggled */
  onWorkoutToggle: (workoutId: string) => void;
}

/**
 * Props for WorkoutDayCard component
 */
export interface WorkoutDayCardProps {
  /** Workout day data */
  workout: WorkoutDayDTO;
  /** Whether this is today's workout */
  isToday: boolean;
  /** Callback when completion status is toggled */
  onToggle: () => void;
}

/**
 * Props for FloatingActionButton component
 */
export interface FloatingActionButtonProps {
  /** Callback to scroll to today's card */
  onScrollToToday: () => void;
}

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  /** Type of empty state to display */
  variant: "no-plan" | "no-profile";
  /** Custom message to display (optional - uses default based on variant) */
  message?: string;
  /** Custom CTA button text (optional - uses default based on variant) */
  ctaText?: string;
  /** Custom CTA button link (optional - uses default based on variant) */
  ctaLink?: string;
}

/**
 * Props for CompletionModal component
 */
export interface CompletionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when user wants to generate a new plan */
  onGenerateNewPlan: () => void;
}
