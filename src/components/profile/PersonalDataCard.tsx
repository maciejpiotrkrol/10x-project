import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import type { GenderType } from "@/types";
import { formatGender } from "@/lib/utils/formatGender";

interface PersonalDataCardProps {
  age: number;
  weight: number;
  height: number;
  gender: GenderType;
}

/**
 * Card component displaying user's personal data
 * Shows age, weight, height, and gender in read-only format
 * Uses semantic HTML (dl, dt, dd) for accessibility
 */
export function PersonalDataCard({ age, weight, height, gender }: PersonalDataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane osobowe</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div>
            <dt className="font-medium text-muted-foreground">Wiek:</dt>
            <dd className="text-lg">{age} lat</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Waga:</dt>
            <dd className="text-lg">{weight} kg</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Wzrost:</dt>
            <dd className="text-lg">{height} cm</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Płeć:</dt>
            <dd className="text-lg">{formatGender(gender)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
