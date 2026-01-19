import { Page, Locator, expect } from "@playwright/test";
import type { TrainingGoalsData, PersonalData, PersonalRecord } from "./types";

/**
 * Page Object Model dla strony ankiety
 * Enkapsuluje interakcje ze stroną /survey i wszystkimi jej sekcjami
 */
export class SurveyPage {
  readonly page: Page;

  // Lokatory - Training Goals Section
  readonly goalDistanceSelect: Locator;
  readonly weeklyKmInput: Locator;
  readonly trainingDaysInput: Locator;

  // Lokatory - Personal Data Section
  readonly ageInput: Locator;
  readonly weightInput: Locator;
  readonly heightInput: Locator;
  readonly genderMaleRadio: Locator;
  readonly genderFemaleRadio: Locator;

  // Lokatory - Personal Records Section
  readonly addRecordButton: Locator;

  // Lokatory - Disclaimer Section
  readonly disclaimerCheckbox: Locator;
  readonly disclaimerText: Locator;

  // Lokatory - Survey Form
  readonly surveyForm: Locator;
  readonly submitButton: Locator;

  // Lokatory - Dialogi
  readonly confirmDialog: Locator;
  readonly confirmDialogCancel: Locator;
  readonly confirmDialogConfirm: Locator;
  readonly loadingModal: Locator;
  readonly loadingSpinner: Locator;
  readonly loadingErrorRetry: Locator;
  readonly loadingErrorClose: Locator;

  constructor(page: Page) {
    this.page = page;

    // Training Goals Section
    this.goalDistanceSelect = page.getByTestId("goal-distance-select");
    this.weeklyKmInput = page.getByTestId("weekly-km-input");
    this.trainingDaysInput = page.getByTestId("training-days-input");

    // Personal Data Section
    this.ageInput = page.getByTestId("age-input");
    this.weightInput = page.getByTestId("weight-input");
    this.heightInput = page.getByTestId("height-input");
    this.genderMaleRadio = page.getByTestId("gender-male-radio");
    this.genderFemaleRadio = page.getByTestId("gender-female-radio");

    // Personal Records Section
    this.addRecordButton = page.getByTestId("add-record-button");

    // Disclaimer Section
    this.disclaimerCheckbox = page.getByTestId("disclaimer-checkbox");
    this.disclaimerText = page.getByTestId("disclaimer-text");

    // Survey Form
    this.surveyForm = page.getByTestId("survey-form");
    this.submitButton = page.getByTestId("survey-submit-button");

    // Dialogi
    this.confirmDialog = page.getByTestId("confirm-dialog");
    this.confirmDialogCancel = page.getByTestId("confirm-dialog-cancel");
    this.confirmDialogConfirm = page.getByTestId("confirm-dialog-confirm");
    this.loadingModal = page.getByTestId("loading-modal");
    this.loadingSpinner = page.getByTestId("loading-spinner");
    this.loadingErrorRetry = page.getByTestId("loading-error-retry");
    this.loadingErrorClose = page.getByTestId("loading-error-close");
  }

  /**
   * Nawiguje do strony ankiety
   */
  async goto() {
    await this.page.goto("/survey");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Wypełnia sekcję "Cele treningowe"
   */
  async fillTrainingGoals(data: TrainingGoalsData) {
    // Mapowanie angielskich wartości na polskie nazwy wyświetlane
    const distanceLabels: Record<string, string> = {
      "5K": "5K",
      "10K": "10K",
      "Half Marathon": "Półmaraton",
      Marathon: "Maraton",
    };

    // Kliknij select i wybierz dystans
    await this.goalDistanceSelect.click();
    const polishLabel = distanceLabels[data.goalDistance] || data.goalDistance;
    await this.page.getByRole("option", { name: polishLabel, exact: true }).click();

    // Wypełnij tygodniowy kilometraż
    await this.weeklyKmInput.fill(data.weeklyKm.toString());

    // Wypełnij liczbę dni treningowych
    await this.trainingDaysInput.fill(data.trainingDays.toString());
  }

  /**
   * Wypełnia sekcję "Dane osobowe"
   */
  async fillPersonalData(data: PersonalData) {
    await this.ageInput.fill(data.age.toString());
    await this.weightInput.fill(data.weight.toString());
    await this.heightInput.fill(data.height.toString());

    // Wybierz płeć
    if (data.gender === "M") {
      await this.genderMaleRadio.click();
    } else {
      await this.genderFemaleRadio.click();
    }
  }

  /**
   * Zwraca lokator dla pola dystansu rekordu o danym indeksie
   */
  getRecordDistanceSelect(index: number): Locator {
    return this.page.getByTestId(`record-distance-select-${index}`);
  }

  /**
   * Zwraca lokator dla pola czasu rekordu o danym indeksie
   */
  getRecordTimeInput(index: number): Locator {
    return this.page.getByTestId(`record-time-input-${index}`);
  }

  /**
   * Zwraca lokator dla przycisku usuwania rekordu o danym indeksie
   */
  getRemoveRecordButton(index: number): Locator {
    return this.page.getByTestId(`remove-record-button-${index}`);
  }

  /**
   * Wypełnia sekcję "Rekordy życiowe"
   * Uwaga: Formularz zawsze startuje z 1 pustym rekordem
   */
  async fillPersonalRecords(records: PersonalRecord[]) {
    // Mapowanie angielskich wartości na polskie nazwy wyświetlane
    const distanceLabels: Record<string, string> = {
      "5K": "5K",
      "10K": "10K",
      "Half Marathon": "Półmaraton",
      Marathon: "Maraton",
    };

    // Jeśli jest więcej niż 1 rekord, dodaj brakujące
    for (let i = 1; i < records.length; i++) {
      await this.addRecordButton.click();
      // Krótkie oczekiwanie na dodanie nowego pola
      await this.page.waitForTimeout(200);
    }

    // Wypełnij wszystkie rekordy
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      // Kliknij select dystansu
      const distanceSelect = this.getRecordDistanceSelect(i);
      await distanceSelect.click();
      const polishLabel = distanceLabels[record.distance] || record.distance;
      await this.page.getByRole("option", { name: polishLabel, exact: true }).click();

      // Wypełnij czas w sekundach
      const timeInput = this.getRecordTimeInput(i);
      await timeInput.fill(record.timeSeconds.toString());
    }
  }

  /**
   * Zaznacza checkbox akceptacji disclaimer
   */
  async acceptDisclaimer() {
    await this.disclaimerCheckbox.click();
  }

  /**
   * Klika przycisk "Wygeneruj plan"
   */
  async submitSurvey() {
    await this.submitButton.click();
  }

  /**
   * Potwierdza nadpisanie istniejącego planu w dialogu potwierdzenia
   */
  async confirmOverwrite() {
    await expect(this.confirmDialog).toBeVisible({ timeout: 3000 });
    await this.confirmDialogConfirm.click();
  }

  /**
   * Anuluje nadpisanie planu w dialogu potwierdzenia
   */
  async cancelOverwrite() {
    await expect(this.confirmDialog).toBeVisible({ timeout: 3000 });
    await this.confirmDialogCancel.click();
  }

  /**
   * Czeka na pojawienie się loading modal
   */
  async expectLoadingModal() {
    await expect(this.loadingModal).toBeVisible({ timeout: 3000 });
    await expect(this.loadingSpinner).toBeVisible();
  }

  /**
   * Czeka na zakończenie generowania planu (zniknięcie loading modal lub redirect)
   * @param timeout - Maksymalny czas oczekiwania w ms (domyślnie 60s)
   */
  async waitForPlanGeneration(timeout = 60000) {
    // Czekaj na redirect do dashboard lub na zniknięcie loading modal
    await Promise.race([
      this.page.waitForURL(/\/dashboard/, { timeout }),
      this.loadingModal.waitFor({ state: "hidden", timeout }),
    ]);
  }

  /**
   * Weryfikuje pomyślne wygenerowanie planu (redirect do dashboard)
   */
  async expectGenerationSuccess() {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 60000 });
  }

  /**
   * Weryfikuje czy wyświetlany jest dialog potwierdzenia nadpisania
   */
  async expectConfirmDialog() {
    await expect(this.confirmDialog).toBeVisible({ timeout: 3000 });
  }

  /**
   * Weryfikuje czy wyświetlany jest błąd w loading modal
   */
  async expectLoadingError() {
    await expect(this.loadingErrorRetry).toBeVisible({ timeout: 3000 });
    await expect(this.loadingErrorClose).toBeVisible();
  }

  /**
   * Klika przycisk "Spróbuj ponownie" w przypadku błędu
   */
  async retryGeneration() {
    await this.loadingErrorRetry.click();
  }

  /**
   * Zamyka loading modal w przypadku błędu
   */
  async closeLoadingModal() {
    await this.loadingErrorClose.click();
  }

  /**
   * Wypełnia całą ankietę (helper method)
   * @param trainingGoals - Dane celów treningowych
   * @param personalData - Dane osobowe
   * @param personalRecords - Rekordy życiowe
   */
  async fillCompleteSurvey(
    trainingGoals: TrainingGoalsData,
    personalData: PersonalData,
    personalRecords: PersonalRecord[]
  ) {
    await this.fillTrainingGoals(trainingGoals);
    await this.fillPersonalData(personalData);
    await this.fillPersonalRecords(personalRecords);
    await this.acceptDisclaimer();
  }
}
