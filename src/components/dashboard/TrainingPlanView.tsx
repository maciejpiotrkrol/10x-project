import { useMemo } from "react";
import { PlanHeader } from "./PlanHeader";
import { WeekAccordion } from "./WeekAccordion";
import { ScrollToTodayFAB } from "./ScrollToTodayFAB";
import { useOptimisticWorkouts } from "@/components/hooks/useOptimisticWorkouts";
import { useScrollToToday } from "@/components/hooks/useScrollToToday";
import type { TrainingPlanViewProps, WorkoutDay } from "@/types";

/**
 * TrainingPlanView Component
 *
 * Main container for the training plan dashboard.
 * Manages state for workout days with optimistic UI updates.
 * Groups workout days by weeks and renders them in accordions.
 */
export function TrainingPlanView({ trainingPlan }: TrainingPlanViewProps) {
  const { workouts, toggleCompleted } = useOptimisticWorkouts(trainingPlan.workout_days);

  const { todayCardRef, todayWorkout } = useScrollToToday(workouts);

  // Group workouts by weeks
  const weeklyWorkouts = useMemo(() => {
    const weeks = new Map<number, WorkoutDay[]>();
    workouts.forEach((workout) => {
      const weekNumber = Math.ceil(workout.day_number / 7);
      if (!weeks.has(weekNumber)) {
        weeks.set(weekNumber, []);
      }
      const weekWorkouts = weeks.get(weekNumber);
      if (weekWorkouts) {
        weekWorkouts.push(workout);
      }
    });
    return weeks;
  }, [workouts]);

  // Determine current week (week containing today)
  const currentWeek = todayWorkout ? Math.ceil(todayWorkout.day_number / 7) : undefined;

  // Recalculate completion stats based on current workout state
  const completionStats = useMemo(() => {
    const totalWorkouts = workouts.filter((w) => !w.is_rest_day).length;
    const completedWorkouts = workouts.filter((w) => w.is_completed).length;
    const totalRestDays = workouts.filter((w) => w.is_rest_day).length;
    const completionPercentage = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

    return {
      total_workouts: totalWorkouts,
      completed_workouts: completedWorkouts,
      total_rest_days: totalRestDays,
      completion_percentage: completionPercentage,
      is_plan_completed: completedWorkouts === totalWorkouts,
    };
  }, [workouts]);

  return (
    <main className="container mx-auto px-4 py-8 space-y-6" role="main" aria-label="Widok planu treningowego">
      <PlanHeader trainingPlan={trainingPlan} completionStats={completionStats} />

      <section className="space-y-4" aria-label="10 tygodni planu treningowego">
        {Array.from(weeklyWorkouts.entries()).map(([weekNumber, weekWorkouts]) => (
          <WeekAccordion
            key={weekNumber}
            weekNumber={weekNumber}
            workoutDays={weekWorkouts}
            onToggleCompleted={toggleCompleted}
            isCurrentWeek={weekNumber === currentWeek}
            todayCardRef={weekNumber === currentWeek ? todayCardRef : undefined}
            todayWorkoutId={todayWorkout?.id}
          />
        ))}
      </section>

      {todayWorkout && <ScrollToTodayFAB todayCardRef={todayCardRef} />}
    </main>
  );
}
