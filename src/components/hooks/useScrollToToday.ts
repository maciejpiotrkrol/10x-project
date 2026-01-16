import { useEffect } from "react";

/**
 * Custom hook for auto-scrolling to today's card on mount
 * @param todayCardRef - React ref to today's workout card element
 * @param delay - Delay in milliseconds before scrolling (default: 100ms)
 */
export function useScrollToToday(todayCardRef: React.RefObject<HTMLDivElement>, delay = 100): void {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayCardRef.current) {
        todayCardRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [todayCardRef, delay]);
}
