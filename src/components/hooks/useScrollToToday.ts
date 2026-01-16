import { useEffect, useRef } from "react";
import type { WorkoutDay } from "@/types";

interface UseScrollToTodayReturn {
  todayCardRef: React.RefObject<HTMLDivElement>;
  todayWorkout: WorkoutDay | undefined;
}

/**
 * Custom hook for auto-scrolling to today's workout card on mount
 *
 * Finds today's workout and creates a ref for the card.
 * After component mount, smoothly scrolls to today's card with a delay.
 *
 * @param workoutDays - Array of all workout days
 * @returns Object with todayCardRef and todayWorkout
 */
export function useScrollToToday(workoutDays: WorkoutDay[]): UseScrollToTodayReturn {
  const todayCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to today's card on mount with delay for better UX
    const timer = setTimeout(() => {
      todayCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []); // Run only on mount

  // Find today's workout
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const todayWorkout = workoutDays.find((w) => w.date === today);

  return { todayCardRef, todayWorkout };
}
