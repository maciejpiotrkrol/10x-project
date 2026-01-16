/**
 * Format ISO date string to DD.MM.YYYY format
 * @param isoDate - ISO date string (YYYY-MM-DD or full ISO timestamp)
 * @returns Formatted date string (DD.MM.YYYY)
 * @example formatDate("2024-01-15") => "15.01.2024"
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Check if the given ISO date is today
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns True if the date is today
 */
export function isToday(isoDate: string): boolean {
  const today = getTodayDateString();
  return isoDate === today;
}

/**
 * Get today's date as YYYY-MM-DD string
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if the given ISO date is in the past
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns True if the date is before today
 */
export function isPast(isoDate: string): boolean {
  const date = new Date(isoDate);
  const today = new Date(getTodayDateString());
  return date < today;
}

/**
 * Check if the given ISO date is in the future
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns True if the date is after today
 */
export function isFuture(isoDate: string): boolean {
  const date = new Date(isoDate);
  const today = new Date(getTodayDateString());
  return date > today;
}
