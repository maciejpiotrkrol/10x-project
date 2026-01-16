import type { WorkoutDay } from "@/types";

/**
 * Sprawdza czy data jest dzisiaj
 * @param dateString - Data w formacie YYYY-MM-DD
 * @returns true jeśli data jest dzisiaj
 */
export const isToday = (dateString: string): boolean => {
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
};

/**
 * Formatuje datę do polskiego formatu DD.MM.YYYY
 * @param dateString - Data w formacie YYYY-MM-DD lub ISO timestamp
 * @returns Sformatowana data w formacie DD.MM.YYYY lub "Data nieznana" w przypadku błędu
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error("Invalid date");

    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Data nieznana";
  }
};

/**
 * Grupuje workout days po tygodniach (7 dni każdy)
 * @param days - Tablica workout days (powinna zawierać 70 elementów)
 * @returns Tablica 10 tygodni, każdy zawierający 7 dni
 * @throws Error jeśli liczba dni nie wynosi 70 lub tydzień nie ma 7 dni
 */
export const groupByWeeks = (days: WorkoutDay[]): WorkoutDay[][] => {
  if (days.length !== 70) {
    throw new Error(`Expected 70 days, got ${days.length}`);
  }

  const weeks: WorkoutDay[][] = [];
  for (let i = 0; i < 10; i++) {
    const week = days.slice(i * 7, (i + 1) * 7);
    if (week.length !== 7) {
      throw new Error(`Week ${i + 1} has ${week.length} days, expected 7`);
    }
    weeks.push(week);
  }

  return weeks;
};
