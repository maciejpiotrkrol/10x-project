import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  isToday,
  getTodayDateString,
  isPast,
  isFuture,
} from '@/lib/utils/date-helpers';

describe('Date Helpers', () => {
  // Mock the current date for consistent testing
  beforeEach(() => {
    // Set a fixed date: 2025-01-20
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('should format ISO date to DD.MM.YYYY', () => {
      expect(formatDate('2024-01-15')).toBe('15.01.2024');
    });

    it('should handle full ISO timestamp', () => {
      // Note: Timezone conversion may affect the result
      // Using date without time component for predictable results
      expect(formatDate('2024-12-31T00:00:00Z')).toMatch(/31.12.2024|01.01.2025/);
    });

    it('should pad single-digit day and month with zeros', () => {
      expect(formatDate('2024-03-05')).toBe('05.03.2024');
    });

    it('should handle leap year dates', () => {
      expect(formatDate('2024-02-29')).toBe('29.02.2024');
    });

    it('should handle year boundaries', () => {
      expect(formatDate('2024-01-01')).toBe('01.01.2024');
      expect(formatDate('2024-12-31')).toBe('31.12.2024');
    });
  });

  describe('getTodayDateString', () => {
    it('should return today as YYYY-MM-DD', () => {
      // System time is mocked to 2025-01-20
      expect(getTodayDateString()).toBe('2025-01-20');
    });

    it('should pad single-digit month and day with zeros', () => {
      // Set to January 5, 2025
      vi.setSystemTime(new Date('2025-01-05T12:00:00Z'));
      expect(getTodayDateString()).toBe('2025-01-05');
    });

    it('should handle year boundaries', () => {
      // New Year's Day - use noon to avoid timezone issues
      vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
      expect(getTodayDateString()).toBe('2025-01-01');

      // New Year's Eve - use noon to avoid timezone issues
      vi.setSystemTime(new Date('2024-12-31T12:00:00Z'));
      expect(getTodayDateString()).toBe('2024-12-31');
    });
  });

  describe('isToday', () => {
    it('should return true when date is today', () => {
      // System time is 2025-01-20
      expect(isToday('2025-01-20')).toBe(true);
    });

    it('should return false when date is yesterday', () => {
      expect(isToday('2025-01-19')).toBe(false);
    });

    it('should return false when date is tomorrow', () => {
      expect(isToday('2025-01-21')).toBe(false);
    });

    it('should return false when date is far in the past', () => {
      expect(isToday('2024-01-20')).toBe(false);
    });

    it('should return false when date is far in the future', () => {
      expect(isToday('2026-01-20')).toBe(false);
    });
  });

  describe('isPast', () => {
    it('should return true for yesterday', () => {
      expect(isPast('2025-01-19')).toBe(true);
    });

    it('should return true for dates far in the past', () => {
      expect(isPast('2024-01-20')).toBe(true);
      expect(isPast('2020-06-15')).toBe(true);
    });

    it('should return false for today', () => {
      expect(isPast('2025-01-20')).toBe(false);
    });

    it('should return false for tomorrow', () => {
      expect(isPast('2025-01-21')).toBe(false);
    });

    it('should return false for dates in the future', () => {
      expect(isPast('2026-01-20')).toBe(false);
    });

    it('should handle month boundaries', () => {
      // Set to February 1st
      vi.setSystemTime(new Date('2025-02-01T12:00:00Z'));

      expect(isPast('2025-01-31')).toBe(true); // Yesterday
      expect(isPast('2025-02-01')).toBe(false); // Today
      expect(isPast('2025-02-02')).toBe(false); // Tomorrow
    });

    it('should handle year boundaries', () => {
      // Set to January 1st
      vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));

      expect(isPast('2024-12-31')).toBe(true); // Last year
      expect(isPast('2025-01-01')).toBe(false); // Today
      expect(isPast('2025-01-02')).toBe(false); // Tomorrow
    });
  });

  describe('isFuture', () => {
    it('should return true for tomorrow', () => {
      expect(isFuture('2025-01-21')).toBe(true);
    });

    it('should return true for dates far in the future', () => {
      expect(isFuture('2026-01-20')).toBe(true);
      expect(isFuture('2030-12-31')).toBe(true);
    });

    it('should return false for today', () => {
      expect(isFuture('2025-01-20')).toBe(false);
    });

    it('should return false for yesterday', () => {
      expect(isFuture('2025-01-19')).toBe(false);
    });

    it('should return false for dates in the past', () => {
      expect(isFuture('2024-01-20')).toBe(false);
    });

    it('should handle month boundaries', () => {
      // Set to January 31st
      vi.setSystemTime(new Date('2025-01-31T12:00:00Z'));

      expect(isFuture('2025-01-30')).toBe(false); // Yesterday
      expect(isFuture('2025-01-31')).toBe(false); // Today
      expect(isFuture('2025-02-01')).toBe(true); // Tomorrow (next month)
    });

    it('should handle year boundaries', () => {
      // Set to December 31st
      vi.setSystemTime(new Date('2024-12-31T12:00:00Z'));

      expect(isFuture('2024-12-30')).toBe(false); // Yesterday
      expect(isFuture('2024-12-31')).toBe(false); // Today
      expect(isFuture('2025-01-01')).toBe(true); // Tomorrow (next year)
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year correctly in isPast/isFuture', () => {
      // Set to leap day 2024
      vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));

      expect(isPast('2024-02-28')).toBe(true);
      expect(isPast('2024-02-29')).toBe(false);
      expect(isFuture('2024-03-01')).toBe(true);
    });

    it('should handle timezone-independent comparisons', () => {
      // All functions should work with UTC date strings
      // regardless of system timezone
      const today = '2025-01-20';

      expect(isToday(today)).toBe(true);
      expect(isPast(today)).toBe(false);
      expect(isFuture(today)).toBe(false);
    });
  });
});
