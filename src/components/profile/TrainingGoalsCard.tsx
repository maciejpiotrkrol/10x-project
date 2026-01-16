import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import type { DistanceType } from "@/types";

interface TrainingGoalsCardProps {
  goalDistance: DistanceType;
  weeklyKm: number;
  trainingDaysPerWeek: number;
}

/**
 * Card component displaying user's training goals
 * Shows goal distance, weekly kilometers, and training days per week
 * Read-only display using semantic HTML (dl, dt, dd)
 */
export function TrainingGoalsCard({ goalDistance, weeklyKm, trainingDaysPerWeek }: TrainingGoalsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cele treningowe</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div>
            <dt className="font-medium text-muted-foreground">Cel-dystans:</dt>
            <dd className="text-lg">{goalDistance}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Średni tygodniowy kilometraż:</dt>
            <dd className="text-lg">{weeklyKm} km</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Liczba dni treningowych:</dt>
            <dd className="text-lg">{trainingDaysPerWeek} dni/tydzień</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
