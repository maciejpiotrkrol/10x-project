import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TrainingGoalsSection } from "./TrainingGoalsSection";
import { PersonalDataSection } from "./PersonalDataSection";
import { PersonalRecordsSection } from "./PersonalRecordsSection";
import { DisclaimerSection } from "./DisclaimerSection";
import { ConfirmDialog } from "./ConfirmDialog";
import { LoadingModal } from "./LoadingModal";
import { surveyFormSchema } from "./types";
import type { SurveyFormData, LoadingModalState } from "./types";
import type { ProfileDTO, PersonalRecordDTO } from "@/types";
import { useFormPersistence } from "@/lib/hooks/useFormPersistence.tsx";
import { useTrainingPlanGeneration } from "@/lib/hooks/useTrainingPlanGeneration.tsx";

interface SurveyFormProps {
  /** Opcjonalne dane profilu do pre-fill formularza */
  initialProfile?: ProfileDTO | null;
  /** Opcjonalne rekordy życiowe do pre-fill */
  initialPersonalRecords?: PersonalRecordDTO[];
}

/**
 * Główny kontener formularza ankiety. Zarządza całym stanem formularza za pomocą
 * React Hook Form i Zod validation. Odpowiada za orkiestrację wszystkich sekcji,
 * obsługę submitu, wywołania API, wyświetlanie dialogów i obsługę błędów.
 */
export function SurveyForm({ initialProfile, initialPersonalRecords = [] }: SurveyFormProps) {
  // Setup React Hook Form with Zod validation
  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveyFormSchema),
    mode: "onBlur", // Validation on blur
    defaultValues: {
      // Training Goals
      goal_distance: initialProfile?.goal_distance || "",
      weekly_km: initialProfile?.weekly_km?.toString() || "",
      training_days_per_week: initialProfile?.training_days_per_week?.toString() || "",

      // Personal Data
      age: initialProfile?.age?.toString() || "",
      weight: initialProfile?.weight?.toString() || "",
      height: initialProfile?.height?.toString() || "",
      gender: initialProfile?.gender || "",

      // Personal Records
      personal_records:
        initialPersonalRecords.length > 0
          ? initialPersonalRecords.map((record) => ({
              id: crypto.randomUUID(),
              distance: record.distance,
              time_seconds: record.time_seconds.toString(),
            }))
          : [
              {
                id: crypto.randomUUID(),
                distance: "",
                time_seconds: "",
              },
            ],

      // Disclaimer
      disclaimer_accepted: false,
    },
  });

  // Local state for dialogs
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingModalState, setLoadingModalState] = useState<LoadingModalState>("loading");
  const [apiError, setApiError] = useState<string | null>(null);

  // Custom hooks
  const { checkActivePlan, generatePlan } = useTrainingPlanGeneration();
  const { clearSaved } = useFormPersistence("survey-form-data", form.watch(), form.setValue);

  // Timeout logic for LoadingModal (60 seconds)
  useEffect(() => {
    if (showLoadingModal && loadingModalState === "loading") {
      const timeoutId = setTimeout(() => {
        setLoadingModalState("timeout");
        setApiError("Generowanie planu trwało zbyt długo. Spróbuj ponownie.");
      }, 60000);

      return () => clearTimeout(timeoutId);
    }
  }, [showLoadingModal, loadingModalState]);

  // Handle form submission
  const onSubmit = async (data: SurveyFormData) => {
    try {
      // Check if user has active plan
      const hasActive = await checkActivePlan();

      if (hasActive) {
        // Show confirmation dialog
        setShowConfirmDialog(true);
        return;
      }

      // No active plan, proceed with generation
      await handleGenerate(data);
    } catch (error) {
      console.error("Error during form submission:", error);
    }
  };

  // Handle plan generation
  const handleGenerate = async (data: SurveyFormData) => {
    // Show loading modal
    setShowLoadingModal(true);
    setLoadingModalState("loading");
    setApiError(null);

    // Generate plan
    const result = await generatePlan(data);

    if (result.success) {
      // Success - clear sessionStorage and redirect
      clearSaved();
      window.location.href = "/dashboard";
    } else {
      // Error - show error state in modal
      setLoadingModalState("error");
      setApiError(result.error || "Wystąpił nieoczekiwany błąd");
    }
  };

  // Handle confirmation dialog actions
  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    await handleGenerate(form.getValues());
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  // Handle loading modal retry
  const handleRetry = async () => {
    setLoadingModalState("loading");
    setApiError(null);
    await handleGenerate(form.getValues());
  };

  // Handle loading modal close
  const handleCloseLoadingModal = () => {
    setShowLoadingModal(false);
    setLoadingModalState("loading");
    setApiError(null);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" data-testid="survey-form">
          {/* Training Goals Section */}
          <TrainingGoalsSection />

          {/* Personal Data Section */}
          <PersonalDataSection />

          {/* Personal Records Section */}
          <PersonalRecordsSection />

          {/* Disclaimer Section */}
          <DisclaimerSection />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="min-w-[200px]" data-testid="survey-submit-button">
              {form.formState.isSubmitting ? "Generowanie..." : "Wygeneruj plan"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Confirm Dialog */}
      <ConfirmDialog isOpen={showConfirmDialog} onConfirm={handleConfirm} onCancel={handleCancel} />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        state={loadingModalState}
        errorMessage={apiError || undefined}
        onRetry={handleRetry}
        onClose={handleCloseLoadingModal}
      />
    </>
  );
}
