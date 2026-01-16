import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import type { FloatingActionButtonProps } from "@/types/component-props";

/**
 * FloatingActionButton component - displays a fixed button in bottom-right corner
 * Visible only when today's card is not in viewport, scrolls to today when clicked
 */
export default function FloatingActionButton({ onScrollToToday }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onScrollToToday}
      className="fixed bottom-20 right-4 rounded-full shadow-lg md:bottom-6 md:right-6 z-50 min-h-[44px] px-4 sm:px-6"
      size="lg"
      aria-label="Przeskocz do dzisiejszego treningu"
    >
      <ArrowDown className="mr-2 h-4 w-4" />
      <span className="text-sm sm:text-base">Dzisiaj</span>
    </Button>
  );
}
