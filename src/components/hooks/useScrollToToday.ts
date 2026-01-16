import { useEffect, useRef } from "react";
import { isToday } from "@/lib/utils/date";
import type { WorkoutDay } from "@/types";

interface UseScrollToTodayReturn {
  todayCardRef: React.RefObject<HTMLDivElement>;
  todayWorkout: WorkoutDay | undefined;
}

/**
 * Custom hook for auto-scrolling to today's workout card on mount
 *
 * Finds today's workout using isToday helper and creates a ref for the card.
 * After component mount, smoothly scrolls to today's card with a 500ms delay
 * for better UX (allows accordion animation to complete).
 *
 * @param workoutDays - Array of all workout days
 * @returns Object with todayCardRef (for passing to WorkoutDayCard) and todayWorkout
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

  // Find today's workout using helper function
  const todayWorkout = workoutDays.find((w) => isToday(w.date));

  return { todayCardRef, todayWorkout };
}
