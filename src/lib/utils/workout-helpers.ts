import type { WorkoutDayDTO } from "@/types";
import type { WeekViewModel } from "@/types/view-models";

/**
 * Group workout days into weeks with calculated statistics
 * @param workoutDays - Array of all workout days (should be 70 items)
 * @returns Array of 10 weeks with workout days and stats
 */
export function groupWorkoutsByWeeks(workoutDays: WorkoutDayDTO[]): WeekViewModel[] {
  const weeks: WeekViewModel[] = [];

  for (let weekNum = 1; weekNum <= 10; weekNum++) {
    const startDay = (weekNum - 1) * 7 + 1;
    const endDay = weekNum * 7;

    const weekDays = workoutDays.filter((day) => day.day_number >= startDay && day.day_number <= endDay);

    const stats = calculateWeekStats(weekDays);

    weeks.push({
      weekNumber: weekNum,
      workoutDays: weekDays,
      completedCount: stats.completed,
      totalWorkouts: stats.total,
    });
  }

  return weeks;
}

/**
 * Calculate completion statistics for a week
 * @param workouts - Array of workout days for the week
 * @returns Object with completed count and total workouts (excluding rest days)
 */
export function calculateWeekStats(workouts: WorkoutDayDTO[]): {
  completed: number;
  total: number;
} {
  const totalWorkouts = workouts.filter((day) => !day.is_rest_day).length;
  const completedCount = workouts.filter((day) => !day.is_rest_day && day.is_completed).length;

  return {
    completed: completedCount,
    total: totalWorkouts,
  };
}
