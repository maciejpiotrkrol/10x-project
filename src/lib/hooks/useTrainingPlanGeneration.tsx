import { useState } from "react";
import type { SurveyFormData } from "@/components/survey/types";
import type { GenerateTrainingPlanCommand, ApiErrorResponse, DistanceType } from "@/types";

interface GeneratePlanResult {
  success: boolean;
  error?: string;
}

/**
 * Hook do zarządzania generowaniem planu treningowego.
 * Obsługuje sprawdzanie aktywnego planu oraz wywołanie API do generowania nowego planu.
 */
export function useTrainingPlanGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);

  /**
   * Sprawdza czy użytkownik ma aktywny plan treningowy
   */
  const checkActivePlan = async () => {
    try {
      const response = await fetch("/api/training-plans/active");

      if (!response.ok) {
        // 404 means no active plan - that's expected
        if (response.status === 404) {
          setHasActivePlan(false);
          return false;
        }

        // Other errors (401, 500, etc.)
        throw new Error("Failed to check active plan");
      }

      const data = await response.json();
      const hasActive = data.data !== null;
      setHasActivePlan(hasActive);
      return hasActive;
    } catch (err) {
      console.error("Failed to check active plan:", err);
      // On error, assume no active plan to allow proceeding
      setHasActivePlan(false);
      return false;
    }
  };

  /**
   * Generuje nowy plan treningowy na podstawie danych z formularza
   */
  const generatePlan = async (data: SurveyFormData) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Transform form data to API request format
      const requestBody: GenerateTrainingPlanCommand = {
        profile: {
          goal_distance: data.goal_distance as DistanceType,
          weekly_km: Number(data.weekly_km),
          training_days_per_week: Number(data.training_days_per_week),
          age: Number(data.age),
          weight: Number(data.weight),
          height: Number(data.height),
          gender: data.gender as "M" | "F",
        },
        personal_records: data.personal_records.map((record) => ({
          distance: record.distance as DistanceType,
          time_seconds: Number(record.time_seconds),
        })),
      };

      // Call API
      const response = await fetch("/api/training-plans/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle different response statuses
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();

        // Handle specific error cases
        switch (response.status) {
          case 400:
            // Validation error
            throw new Error(errorData.error.message || "Błąd walidacji danych");
          case 401:
            // Unauthorized - redirect to login
            window.location.href = "/auth/login";
            throw new Error("Sesja wygasła. Zaloguj się ponownie.");
          case 409:
            // Conflict - active plan exists (shouldn't happen as we check before)
            throw new Error("Masz już aktywny plan treningowy. Odśwież stronę i spróbuj ponownie.");
          case 500:
            // Server error
            throw new Error("Wystąpił błąd serwera. Spróbuj ponownie za chwilę.");
          case 503:
            // AI service unavailable
            throw new Error("Usługa AI jest tymczasowo niedostępna. Spróbuj za chwilę.");
          default:
            throw new Error(errorData.error.message || "Wystąpił nieoczekiwany błąd");
        }
      }

      // Success - plan generated
      const result: GeneratePlanResult = { success: true };
      return result;
    } catch (err) {
      // Handle network errors and other exceptions
      let errorMessage = "Wystąpił nieznany błąd";

      if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "Sprawdź połączenie internetowe i spróbuj ponownie.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      const result: GeneratePlanResult = { success: false, error: errorMessage };
      return result;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    error,
    hasActivePlan,
    checkActivePlan,
    generatePlan,
  };
}
