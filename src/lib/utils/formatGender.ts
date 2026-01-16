import type { GenderType } from "@/types";

/**
 * Formats gender enum to human-readable Polish label
 *
 * @param gender - Gender type ("M" | "F")
 * @returns Human-readable gender label
 *
 * @example
 * formatGender("M") // "Mężczyzna"
 * formatGender("F") // "Kobieta"
 */
export function formatGender(gender: GenderType): string {
  return gender === "M" ? "Mężczyzna" : "Kobieta";
}
