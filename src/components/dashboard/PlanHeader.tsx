import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PlanHeaderProps } from "@/types";

/**
 * PlanHeader Component
 *
 * Displays training plan overview:
 * - Plan title
 * - Date range
 * - Completion statistics
 * - Progress bar
 */
export function PlanHeader({ trainingPlan, completionStats }: PlanHeaderProps) {
  // Format dates
  const startDate = new Date(trainingPlan.start_date).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const endDate = new Date(trainingPlan.end_date).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const percentageText = completionStats.completion_percentage.toFixed(0);

  return (
    <Card role="region" aria-label="Podsumowanie planu treningowego">
      <CardHeader>
        <CardTitle>Twój plan treningowy</CardTitle>
        <p className="text-sm text-muted-foreground" aria-label={`Zakres dat: od ${startDate} do ${endDate}`}>
          {startDate} - {endDate}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2" role="status" aria-live="polite">
          <div className="flex justify-between text-sm">
            <span id="workout-stats-label">Wykonane treningi:</span>
            <span className="font-semibold" aria-labelledby="workout-stats-label">
              {completionStats.completed_workouts}/{completionStats.total_workouts}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span id="completion-percentage-label">Procent ukończenia:</span>
            <span className="font-semibold" aria-labelledby="completion-percentage-label">
              {percentageText}%
            </span>
          </div>
        </div>
        <Progress
          value={completionStats.completion_percentage}
          className="h-2"
          aria-label={`Postęp ukończenia planu: ${percentageText} procent`}
          aria-valuenow={completionStats.completion_percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </CardContent>
    </Card>
  );
}
