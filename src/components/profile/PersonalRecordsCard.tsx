import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import type { PersonalRecord } from "@/types";
import { formatTime } from "@/lib/utils/formatTime";

interface PersonalRecordsCardProps {
  personalRecords: PersonalRecord[];
}

/**
 * Card component displaying user's personal running records
 * Shows list of records with distance and formatted time
 * Displays empty state message if no records exist
 */
export function PersonalRecordsCard({ personalRecords }: PersonalRecordsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rekordy życiowe</CardTitle>
      </CardHeader>
      <CardContent>
        {personalRecords.length === 0 ? (
          <p className="text-muted-foreground">Brak rekordów życiowych</p>
        ) : (
          <ul className="space-y-2">
            {personalRecords.map((record) => (
              <li key={record.id} className="flex justify-between">
                <span className="font-medium">{record.distance}:</span>
                <span>{formatTime(record.time_seconds)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
