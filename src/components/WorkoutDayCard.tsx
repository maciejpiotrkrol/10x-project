import React, { forwardRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils/date-helpers";
import { cn } from "@/lib/utils";
import type { WorkoutDayCardProps } from "@/types/component-props";

/**
 * WorkoutDayCard component - displays a single workout day with its details
 * Supports three visual states: rest day (muted), pending (neutral), completed (green)
 * Uses forwardRef to allow parent components to scroll to this card
 */
const WorkoutDayCard = forwardRef<HTMLDivElement, WorkoutDayCardProps>(({ workout, isToday, onToggle }, ref) => {
  const cardClasses = cn(
    "transition-colors duration-200",
    workout.is_rest_day && "bg-muted",
    workout.is_completed && "border-green-500 border-2",
    isToday && "ring-2 ring-blue-500 ring-offset-2"
  );

  return (
    <Card ref={ref} className={cardClasses}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium sm:text-base">{formatDate(workout.date)}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">Dzień {workout.day_number}/70</p>
          </div>
          {workout.is_rest_day ? (
            <span className="text-2xl sm:text-3xl flex-shrink-0">🛌</span>
          ) : workout.is_completed ? (
            <span className="text-2xl sm:text-3xl text-green-500 flex-shrink-0">✓</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {workout.is_rest_day ? (
          <p className="text-muted-foreground text-sm sm:text-base">Odpoczynek</p>
        ) : (
          <>
            <p className="text-sm sm:text-base leading-relaxed">{workout.workout_description}</p>
            <div className="mt-4 flex items-center space-x-3 min-h-[44px]">
              <Checkbox
                id={`workout-${workout.id}`}
                checked={workout.is_completed}
                onCheckedChange={onToggle}
                className="h-5 w-5 sm:h-4 sm:w-4"
              />
              <label
                htmlFor={`workout-${workout.id}`}
                className="text-sm sm:text-base font-medium leading-none cursor-pointer select-none flex-1 py-2"
              >
                Oznacz jako wykonany
              </label>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

WorkoutDayCard.displayName = "WorkoutDayCard";

export default WorkoutDayCard;
