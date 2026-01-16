import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFABVisibility } from "@/components/hooks/useFABVisibility";
import type { ScrollToTodayFABProps } from "@/types";

/**
 * ScrollToTodayFAB Component
 *
 * Floating Action Button for scrolling to today's workout.
 * Automatically hides when today's card is in viewport (IntersectionObserver).
 */
export function ScrollToTodayFAB({ todayCardRef }: ScrollToTodayFABProps) {
  const isVisible = useFABVisibility(todayCardRef);

  const scrollToToday = () => {
    todayCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      className="fixed bottom-20 right-6 rounded-full shadow-lg z-50 transition-all hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      size="lg"
      onClick={scrollToToday}
      aria-label="Przewiń do dzisiejszego treningu"
      title="Przewiń do dzisiejszego treningu"
    >
      <ArrowDown className="mr-2 h-5 w-5" aria-hidden="true" />
      Dzisiaj
    </Button>
  );
}
