import { useState, useRef } from "react";
import { Accordion } from "@/components/ui/accordion";
import PlanHeader from "./PlanHeader";
import WeekAccordion from "./WeekAccordion";
import FloatingActionButton from "./FloatingActionButton";
import EmptyState from "./EmptyState";
import CompletionModal from "./CompletionModal";
import { groupWorkoutsByWeeks } from "@/lib/utils/workout-helpers";
import { getTodayDateString } from "@/lib/utils/date-helpers";
import { useWorkoutToggle } from "./hooks/useWorkoutToggle";
import { useScrollToToday } from "./hooks/useScrollToToday";
import { useFABVisibility } from "./hooks/useFABVisibility";
import type { TrainingPlanViewProps } from "@/types/component-props";
import type { TrainingPlanWithWorkoutsDTO } from "@/types";

/**
 * TrainingPlanContent - internal component that uses hooks
 * Separated to avoid conditional hook calls
 */
function TrainingPlanContent({ plan }: { plan: TrainingPlanWithWorkoutsDTO }) {
  const [showCompletionModal, setShowCompletionModal] = useState(plan.completion_stats.is_plan_completed);
  const todayCardRef = useRef<HTMLDivElement>(null);

  // Use custom hook for workout toggle with optimistic updates
  const { workouts, toggleWorkout } = useWorkoutToggle(plan.workout_days);

  // Group workouts by weeks
  const weeks = groupWorkoutsByWeeks(workouts);
  const todayDate = getTodayDateString();

  // Auto-scroll to today's card on mount
  useScrollToToday(todayCardRef);

  // Control FAB visibility based on today's card viewport intersection
  const isFABVisible = useFABVisibility(todayCardRef);

  // Find week containing today for default expanded state
  const todayWeekNumber = weeks.find((week) => week.workoutDays.some((day) => day.date === todayDate))?.weekNumber;

  const defaultExpandedWeek = todayWeekNumber ? `week-${todayWeekNumber}` : undefined;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      <PlanHeader startDate={plan.start_date} endDate={plan.end_date} completionStats={plan.completion_stats} />

      <div className="mt-6 sm:mt-8">
        <Accordion type="single" collapsible defaultValue={defaultExpandedWeek} className="space-y-3 sm:space-y-4">
          {weeks.map((week) => (
            <WeekAccordion
              key={week.weekNumber}
              week={week}
              todayDate={todayDate}
              todayCardRef={todayCardRef}
              onWorkoutToggle={toggleWorkout}
            />
          ))}
        </Accordion>
      </div>

      {isFABVisible && (
        <FloatingActionButton
          onScrollToToday={() => {
            todayCardRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }}
        />
      )}

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onGenerateNewPlan={() => (window.location.href = "/survey")}
      />
    </div>
  );
}

/**
 * TrainingPlanView component - main container for training plan dashboard
 * Manages local state for optimistic updates, handles auto-scroll to today,
 * and renders all sub-components (header, accordions, FAB, modals)
 */
export default function TrainingPlanView({ trainingPlan }: TrainingPlanViewProps) {
  if (!trainingPlan) {
    return <EmptyState variant="no-plan" />;
  }

  return <TrainingPlanContent plan={trainingPlan} />;
}
