import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import WorkoutDayCard from "./WorkoutDayCard";
import type { WeekAccordionProps } from "@/types/component-props";

/**
 * WeekAccordion component - represents one week of training with 7 workout days
 * Displays week header with completion stats and expandable content with workout cards
 */
export default function WeekAccordion({ week, todayDate, todayCardRef, onWorkoutToggle }: WeekAccordionProps) {
  return (
    <AccordionItem value={`week-${week.weekNumber}`}>
      <AccordionTrigger className="text-sm sm:text-base py-4 hover:no-underline">
        <span className="font-medium">
          Tydzień {week.weekNumber}: {week.completedCount}/{week.totalWorkouts} wykonanych
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 mt-2 sm:mt-3">
          {week.workoutDays.map((workout) => {
            const isToday = workout.date === todayDate;
            return (
              <WorkoutDayCard
                key={workout.id}
                workout={workout}
                isToday={isToday}
                ref={isToday ? todayCardRef : null}
                onToggle={() => onWorkoutToggle(workout.id)}
              />
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
