/**
 * Formats time from seconds to human-readable format
 *
 * @param seconds - Time in seconds
 * @returns Formatted time string
 *
 * @example
 * formatTime(1230) // "20:30" (MM:SS)
 * formatTime(6135) // "1:42:15" (HH:MM:SS)
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
