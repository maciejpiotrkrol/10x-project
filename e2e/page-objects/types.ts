/**
 * Typy danych testowych dla Page Object Models
 */

export interface TrainingGoalsData {
  goalDistance: '5K' | '10K' | 'Half Marathon' | 'Marathon';
  weeklyKm: number;
  trainingDays: number;
}

export interface PersonalData {
  age: number;
  weight: number;
  height: number;
  gender: 'M' | 'F';
}

export interface PersonalRecord {
  distance: '5K' | '10K' | 'Half Marathon' | 'Marathon';
  timeSeconds: number;
}

export interface SurveyData {
  trainingGoals: TrainingGoalsData;
  personalData: PersonalData;
  personalRecords: PersonalRecord[];
}
