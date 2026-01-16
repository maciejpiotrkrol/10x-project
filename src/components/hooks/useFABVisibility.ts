import { useState, useEffect } from "react";

/**
 * Custom hook for controlling FAB visibility based on today's card viewport intersection
 * @param todayCardRef - React ref to today's workout card element
 * @returns Boolean indicating if FAB should be visible (true when today card NOT in viewport)
 */
export function useFABVisibility(todayCardRef: React.RefObject<HTMLDivElement>): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!todayCardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // FAB visible when today card NOT in viewport
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(todayCardRef.current);

    return () => observer.disconnect();
  }, [todayCardRef]);

  return isVisible;
}
