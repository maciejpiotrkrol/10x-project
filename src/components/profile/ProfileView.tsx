import type { Profile, PersonalRecord } from "@/types";
import { TrainingGoalsCard } from "./TrainingGoalsCard";
import { PersonalDataCard } from "./PersonalDataCard";
import { PersonalRecordsCard } from "./PersonalRecordsCard";
import { ActionsCard } from "./ActionsCard";

interface ProfileViewProps {
  profile: Profile;
  personalRecords: PersonalRecord[];
}

/**
 * Main profile view container component
 * Displays user profile data in organized card layout
 * Stateless component - all data passed via props from SSR
 */
export function ProfileView({ profile, personalRecords }: ProfileViewProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profil użytkownika</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <TrainingGoalsCard
          goalDistance={profile.goal_distance}
          weeklyKm={profile.weekly_km}
          trainingDaysPerWeek={profile.training_days_per_week}
        />

        <PersonalDataCard age={profile.age} weight={profile.weight} height={profile.height} gender={profile.gender} />

        <PersonalRecordsCard personalRecords={personalRecords} />

        <ActionsCard profile={profile} personalRecords={personalRecords} />
      </div>
    </div>
  );
}
