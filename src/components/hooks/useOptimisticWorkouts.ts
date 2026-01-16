import { useState } from "react";
import { toast } from "sonner";
import type { WorkoutDay } from "@/types";

interface UseOptimisticWorkoutsReturn {
  workouts: WorkoutDay[];
  toggleCompleted: (id: string, currentStatus: boolean) => Promise<void>;
  isUpdating: (id: string) => boolean;
}

/**
 * Custom hook for managing workout days with optimistic UI updates
 *
 * Implements optimistic UI pattern:
 * 1. Immediately update local state
 * 2. Make API call
 * 3. If error, rollback to previous state
 *
 * @param initialWorkouts - Initial array of workout days
 * @returns Object with workouts state, toggleCompleted function, and isUpdating checker
 */
export function useOptimisticWorkouts(initialWorkouts: WorkoutDay[]): UseOptimisticWorkoutsReturn {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>(initialWorkouts);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const toggleCompleted = async (id: string, currentStatus: boolean) => {
    // Prevent concurrent updates to the same workout
    if (updatingIds.has(id)) {
      return;
    }

    const newStatus = !currentStatus;

    // Find workout
    const workout = workouts.find((w) => w.id === id);
    if (!workout) return;

    // Validate: cannot mark rest days as completed
    if (workout.is_rest_day) {
      toast.error("Dni odpoczynku nie mogą być oznaczone jako wykonane");
      return;
    }

    // Mark as updating
    setUpdatingIds((prev) => new Set(prev).add(id));

    // Optimistic update
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              is_completed: newStatus,
              completed_at: newStatus ? new Date().toISOString() : null,
            }
          : w
      )
    );

    try {
      // API call
      const response = await fetch(`/api/workout-days/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_completed: newStatus }),
      });

      // Handle HTTP errors
      if (!response.ok) {
        // Session expired - redirect to login
        if (response.status === 401) {
          toast.error("Sesja wygasła. Zaloguj się ponownie.");
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 1500);
          throw new Error("Unauthorized");
        }

        // Workout not found or access denied
        if (response.status === 404 || response.status === 403) {
          throw new Error("Nie znaleziono treningu lub brak dostępu");
        }

        // Server error
        if (response.status >= 500) {
          throw new Error("Błąd serwera. Spróbuj ponownie za chwilę");
        }

        // Other errors - try to get message from response
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || "Nie udało się zaktualizować treningu");
      }

      // Success toast
      toast.success(newStatus ? "Trening oznaczony jako wykonany" : "Oznaczenie cofnięte");
    } catch (error) {
      // Rollback optimistic update
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                is_completed: currentStatus,
                completed_at: currentStatus ? workout.completed_at : null,
              }
            : w
        )
      );

      // Network error (no response)
      if (error instanceof TypeError) {
        toast.error("Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.");
        return;
      }

      // Show error toast (skip for 401 as we're redirecting)
      if (error instanceof Error && error.message !== "Unauthorized") {
        toast.error(error.message);
      }
    } finally {
      // Remove from updating
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const isUpdating = (id: string) => updatingIds.has(id);

  return { workouts, toggleCompleted, isUpdating };
}
