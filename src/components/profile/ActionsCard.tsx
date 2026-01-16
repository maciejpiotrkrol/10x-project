import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Profile, PersonalRecord } from "@/types";

interface ActionsCardProps {
  profile: Profile;
  personalRecords: PersonalRecord[];
}

/**
 * Card component with actions available to the user
 * Primary action: "Wygeneruj nowy plan" - prefills survey data and redirects
 * Stores profile and personal records in sessionStorage for survey prefill
 */
export function ActionsCard({ profile, personalRecords }: ActionsCardProps) {
  const handleGenerateNewPlan = () => {
    // Pre-fill survey data in sessionStorage
    const surveyData = {
      goalDistance: profile.goal_distance,
      weeklyKm: profile.weekly_km,
      trainingDaysPerWeek: profile.training_days_per_week,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      gender: profile.gender,
      personalRecords: personalRecords,
    };

    sessionStorage.setItem("surveyData", JSON.stringify(surveyData));
    window.location.href = "/survey";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akcje</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleGenerateNewPlan} className="w-full">
          Wygeneruj nowy plan
        </Button>
      </CardContent>
    </Card>
  );
}
