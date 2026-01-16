import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WorkoutDayCard } from "./WorkoutDayCard";
import type { WeekAccordionProps } from "@/types";

/**
 * WeekAccordion Component
 *
 * Accordion for a single training week containing 7 workout day cards.
 * Displays week number and completion stats (X/Y completed).
 * Auto-expands if it's the current week.
 */
export function WeekAccordion({
  weekNumber,
  workoutDays,
  onToggleCompleted,
  isCurrentWeek = false,
  todayCardRef,
  todayWorkoutId,
}: WeekAccordionProps & {
  todayCardRef?: React.RefObject<HTMLDivElement>;
  todayWorkoutId?: string;
}) {
  // Calculate week statistics
  const totalWorkouts = workoutDays.filter((w) => !w.is_rest_day).length;
  const completedWorkouts = workoutDays.filter((w) => w.is_completed).length;

  return (
    <Accordion type="single" collapsible defaultValue={isCurrentWeek ? `week-${weekNumber}` : undefined}>
      <AccordionItem value={`week-${weekNumber}`}>
        <AccordionTrigger
          aria-label={`Tydzień ${weekNumber}, wykonano ${completedWorkouts} z ${totalWorkouts} treningów`}
        >
          <span className="font-semibold">
            Tydzień {weekNumber}: {completedWorkouts}/{totalWorkouts} wykonanych
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3" role="list" aria-label={`Treningi w tygodniu ${weekNumber}`}>
            {workoutDays.map((workout) => (
              <WorkoutDayCard
                key={workout.id}
                ref={workout.id === todayWorkoutId ? todayCardRef : undefined}
                workoutDay={workout}
                onToggleCompleted={onToggleCompleted}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
