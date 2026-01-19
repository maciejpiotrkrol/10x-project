/**
 * Fixtures z danymi testowymi dla testów E2E
 * Centralne miejsce przechowywania danych testowych
 */

import type { SurveyData } from "../page-objects";

/**
 * Dane użytkownika testowego
 * W produkcji te dane powinny być pobierane z .env.test lub tworzone dynamicznie
 */
export const testUser = {
  email: process.env.E2E_USERNAME || "test@example.com",
  password: process.env.E2E_PASSWORD || "Test1234!",
};

/**
 * Dane ankiety dla pierwszego użycia (nowy użytkownik bez planu)
 * Scenariusz: Półmaraton, średnio zaawansowany biegacz
 */
export const firstTimeSurveyData: SurveyData = {
  trainingGoals: {
    goalDistance: "Half Marathon",
    weeklyKm: 30,
    trainingDays: 4,
  },
  personalData: {
    age: 30,
    weight: 70,
    height: 175,
    gender: "M",
  },
  personalRecords: [
    {
      distance: "5K",
      timeSeconds: 1350, // 22:30 (22 min 30 sek)
    },
    {
      distance: "10K",
      timeSeconds: 2880, // 48:00 (48 min)
    },
  ],
};

/**
 * Dane ankiety dla zaawansowanego biegacza
 * Scenariusz: Maraton, zaawansowany
 */
export const advancedRunnerSurveyData: SurveyData = {
  trainingGoals: {
    goalDistance: "Marathon",
    weeklyKm: 60,
    trainingDays: 6,
  },
  personalData: {
    age: 35,
    weight: 68,
    height: 178,
    gender: "M",
  },
  personalRecords: [
    {
      distance: "10K",
      timeSeconds: 2400, // 40:00
    },
    {
      distance: "Half Marathon",
      timeSeconds: 5400, // 1:30:00
    },
    {
      distance: "Marathon",
      timeSeconds: 12600, // 3:30:00
    },
  ],
};

/**
 * Dane ankiety dla początkującego biegacza
 * Scenariusz: 5K, początkujący
 */
export const beginnerSurveyData: SurveyData = {
  trainingGoals: {
    goalDistance: "5K",
    weeklyKm: 15,
    trainingDays: 3,
  },
  personalData: {
    age: 28,
    weight: 65,
    height: 168,
    gender: "F",
  },
  personalRecords: [
    {
      distance: "5K",
      timeSeconds: 1800, // 30:00
    },
  ],
};
