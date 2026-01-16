import { useState, forwardRef } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import type { WorkoutDayCardProps } from "@/types";

/**
 * WorkoutDayCard Component
 *
 * Displays a single workout day with:
 * - Date and day number
 * - Workout description (expandable)
 * - Completion checkbox (if not rest day)
 * - Visual states: rest day, pending, completed
 *
 * US-010 Implementation:
 * - Rest days display "🛌 Odpoczynek" badge
 * - Rest days show "Dzień wolny od treningów" message
 * - Rest days DO NOT have completion checkbox
 * - Validation prevents marking rest days as completed
 */
export const WorkoutDayCard = forwardRef<HTMLDivElement, WorkoutDayCardProps>(function WorkoutDayCard(
  { workoutDay, onToggleCompleted },
  ref
) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCheckboxChange = async () => {
    if (workoutDay.is_rest_day) return;

    setIsUpdating(true);
    await onToggleCompleted(workoutDay.id, workoutDay.is_completed);
    setIsUpdating(false);
  };

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // Format date using helper function
  const formattedDate = formatDate(workoutDay.date);

  // Determine card styling based on state
  const cardClassName = cn(
    "cursor-pointer transition-all duration-200",
    "hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    workoutDay.is_rest_day && "bg-muted hover:bg-muted/80",
    workoutDay.is_completed && !workoutDay.is_rest_day && "border-green-500 border-2 hover:border-green-600",
    !workoutDay.is_completed && !workoutDay.is_rest_day && "border-gray-300 hover:border-gray-400"
  );

  return (
    <Card
      ref={ref}
      className={cardClassName}
      onClick={toggleExpand}
      role="article"
      aria-label={`Trening dzień ${workoutDay.day_number}: ${workoutDay.is_rest_day ? "Odpoczynek" : workoutDay.is_completed ? "Wykonano" : "Do wykonania"}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpand();
        }
      }}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <p className="text-xs text-muted-foreground">Dzień {workoutDay.day_number}/70</p>
          </div>
          {workoutDay.is_completed && (
            <Badge variant="default" className="bg-green-500">
              <Check className="w-4 h-4 mr-1" />
              Wykonano
            </Badge>
          )}
          {workoutDay.is_rest_day && <Badge variant="secondary">🛌 Odpoczynek</Badge>}
        </div>
      </CardHeader>

      <CardContent>
        {workoutDay.is_rest_day ? (
          <p className="text-muted-foreground">Dzień wolny od treningów</p>
        ) : (
          <div className={cn("prose prose-sm", !isExpanded && "line-clamp-2")}>{workoutDay.workout_description}</div>
        )}
      </CardContent>

      {!workoutDay.is_rest_day && (
        <CardFooter>
          <div className="flex items-center space-x-2 min-h-[44px]">
            <Checkbox
              id={`workout-${workoutDay.id}`}
              checked={workoutDay.is_completed}
              onCheckedChange={handleCheckboxChange}
              disabled={isUpdating}
              onClick={(e) => e.stopPropagation()}
              aria-label={
                workoutDay.is_completed ? "Cofnij oznaczenie treningu jako wykonany" : "Oznacz trening jako wykonany"
              }
              aria-describedby={`workout-label-${workoutDay.id}`}
            />
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
            <label
              id={`workout-label-${workoutDay.id}`}
              htmlFor={`workout-${workoutDay.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {workoutDay.is_completed ? "Oznaczono jako wykonane" : "Oznacz jako wykonane"}
            </label>
          </div>
        </CardFooter>
      )}
    </Card>
  );
});
