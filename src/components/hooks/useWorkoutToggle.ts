import { useState } from "react";
import { toast } from "sonner";
import type { WorkoutDayDTO } from "@/types";

interface UseWorkoutToggleReturn {
  workouts: WorkoutDayDTO[];
  toggleWorkout: (workoutId: string) => Promise<void>;
  isUpdating: boolean;
}

/**
 * Custom hook for managing workout completion with optimistic updates
 * @param initialWorkouts - Initial array of workout days
 * @returns Object with workouts state, toggle function, and loading state
 */
export function useWorkoutToggle(initialWorkouts: WorkoutDayDTO[]): UseWorkoutToggleReturn {
  const [workouts, setWorkouts] = useState<WorkoutDayDTO[]>(initialWorkouts);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleWorkout = async (workoutId: string) => {
    const workoutIndex = workouts.findIndex((w) => w.id === workoutId);
    if (workoutIndex === -1) return;

    const workout = workouts[workoutIndex];

    // Prevent marking rest days as completed
    if (workout.is_rest_day) {
      toast.error("Nie można oznaczyć dnia odpoczynku jako wykonany");
      return;
    }

    const newCompletedStatus = !workout.is_completed;

    // Save previous state for rollback
    const previousWorkouts = [...workouts];

    // Optimistic update
    const updatedWorkouts = [...workouts];
    updatedWorkouts[workoutIndex] = {
      ...workout,
      is_completed: newCompletedStatus,
      completed_at: newCompletedStatus ? new Date().toISOString() : null,
    };
    setWorkouts(updatedWorkouts);

    // API call
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/workout-days/${workoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: newCompletedStatus }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired - redirect to login
          window.location.href = "/auth/login";
          return;
        }
        throw new Error("Update failed");
      }

      // Optionally update with server response for confirmation
      const data = await response.json();
      if (data.data) {
        updatedWorkouts[workoutIndex] = data.data;
        setWorkouts(updatedWorkouts);
      }

      // Show success toast
      toast.success(newCompletedStatus ? "Trening oznaczony jako wykonany" : "Oznaczenie cofnięte");
    } catch (_error) {
      // Rollback on error
      setWorkouts(previousWorkouts);
      toast.error("Nie udało się zaktualizować. Spróbuj ponownie.");
    } finally {
      setIsUpdating(false);
    }
  };

  return { workouts, toggleWorkout, isUpdating };
}
