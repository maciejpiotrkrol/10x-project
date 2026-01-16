import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils/date-helpers";
import type { PlanHeaderProps } from "@/types/component-props";

/**
 * PlanHeader component - displays training plan summary header
 * Shows plan title, date range, completion statistics, and progress bar
 */
export default function PlanHeader({ startDate, endDate, completionStats }: PlanHeaderProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl sm:text-2xl">Twój plan treningowy</CardTitle>
        <p className="text-sm sm:text-base text-muted-foreground">
          {formatDate(startDate)} - {formatDate(endDate)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm sm:text-base font-medium">
              Wykonane treningi: {completionStats.completed_workouts}/{completionStats.total_workouts}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Procent ukończenia: {completionStats.completion_percentage}%
            </p>
          </div>
          <Progress value={completionStats.completion_percentage} className="h-2 sm:h-3" />
        </div>
      </CardContent>
    </Card>
  );
}
