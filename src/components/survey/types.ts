import { z } from "zod";
import type { DistanceType } from "@/types";

/**
 * ViewModel dla pojedynczego rekordu życiowego w formularzu
 */
export interface PersonalRecordFormData {
  /** Temporary UUID dla React key */
  id: string;
  distance: DistanceType | "";
  time_seconds: string;
}

/**
 * ViewModel dla całego formularza ankiety
 * Wszystkie numeric fields są string w formularzu (parsowane przy submit)
 */
export interface SurveyFormData {
  // Training Goals
  goal_distance: DistanceType | "";
  weekly_km: string;
  training_days_per_week: string;

  // Personal Data
  age: string;
  weight: string;
  height: string;
  gender: "M" | "F" | "";

  // Personal Records (dynamic array)
  personal_records: PersonalRecordFormData[];

  // Disclaimer
  disclaimer_accepted: boolean;
}

/**
 * Zod schema dla walidacji formularza Survey
 * Musi być zgodny z API validation (generate.ts)
 */
export const surveyFormSchema = z.object({
  goal_distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"], {
    errorMap: () => ({ message: "Wybierz dystans docelowy" }),
  }),
  weekly_km: z
    .string()
    .min(1, "Pole wymagane")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Kilometraż musi być większy od 0"),
  training_days_per_week: z
    .string()
    .min(1, "Pole wymagane")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && Number.isInteger(num) && num >= 2 && num <= 7;
    }, "Liczba dni treningowych musi być liczbą całkowitą od 2 do 7"),
  age: z
    .string()
    .min(1, "Pole wymagane")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 119;
    }, "Wiek musi być liczbą całkowitą od 1 do 119"),
  weight: z
    .string()
    .min(1, "Pole wymagane")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 300;
    }, "Waga musi być liczbą od 0 do 300 kg"),
  height: z
    .string()
    .min(1, "Pole wymagane")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && Number.isInteger(num) && num > 0 && num <= 300;
    }, "Wzrost musi być liczbą całkowitą od 0 do 300 cm"),
  gender: z.enum(["M", "F"], {
    errorMap: () => ({ message: "Wybierz płeć" }),
  }),
  personal_records: z
    .array(
      z.object({
        id: z.string(),
        distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"], {
          errorMap: () => ({ message: "Wybierz dystans" }),
        }),
        time_seconds: z
          .string()
          .min(1, "Pole wymagane")
          .refine((val) => {
            const num = Number(val);
            return !isNaN(num) && Number.isInteger(num) && num > 0;
          }, "Czas musi być liczbą całkowitą większą od 0"),
      })
    )
    .min(1, "Wymagany jest co najmniej jeden rekord życiowy"),
  disclaimer_accepted: z.boolean().refine((val) => val === true, "Musisz zaakceptować warunki aby kontynuować"),
});

/**
 * Type inferred from Zod schema
 */
export type SurveyFormDataInferred = z.infer<typeof surveyFormSchema>;

/**
 * Loading Modal State
 */
export type LoadingModalState = "loading" | "error" | "timeout";
