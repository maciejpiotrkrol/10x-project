import { useEffect } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type { SurveyFormData } from "@/components/survey/types";

/**
 * Hook do persystencji danych formularza w sessionStorage.
 * Automatycznie zapisuje dane formularza przy każdej zmianie (z debounce)
 * i przywraca je przy ponownym montowaniu komponentu.
 *
 * @param key - Klucz używany do przechowywania danych w sessionStorage
 * @param formData - Aktualne dane formularza do zapisania
 * @param setValue - Funkcja React Hook Form do ustawiania wartości pól
 * @returns Obiekt z funkcją clearSaved do czyszczenia zapisanych danych
 */
export function useFormPersistence(key: string, formData: SurveyFormData, setValue: UseFormSetValue<SurveyFormData>) {
  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Partial<SurveyFormData>;

      // Restore each field value
      Object.entries(parsed).forEach(([fieldKey, fieldValue]) => {
        if (fieldValue !== undefined) {
          setValue(fieldKey as keyof SurveyFormData, fieldValue as any, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      });
    } catch (error) {
      console.error("Failed to parse saved form data:", error);
      // Clear corrupted data
      sessionStorage.removeItem(key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Save to sessionStorage on change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(formData));
      } catch (error) {
        console.error("Failed to save form data:", error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeout);
  }, [formData, key]);

  // Function to clear saved data
  const clearSaved = () => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to clear saved form data:", error);
    }
  };

  return { clearSaved };
}
