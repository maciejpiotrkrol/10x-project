import { describe, it, expect } from 'vitest';
import {
  groupWorkoutsByWeeks,
  calculateWeekStats,
} from '@/lib/utils/workout-helpers';
import type { WorkoutDayDTO } from '@/types';

describe('Workout Helpers', () => {
  describe('calculateWeekStats', () => {
    it('should calculate stats for week with no rest days', () => {
      const workouts: WorkoutDayDTO[] = [
        {
          id: '1',
          day_number: 1,
          date: '2025-01-20',
          workout_description: 'Easy run 5km',
          is_rest_day: false,
          is_completed: true,
          completed_at: '2025-01-20T10:00:00Z',
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '2',
          day_number: 2,
          date: '2025-01-21',
          workout_description: 'Interval training',
          is_rest_day: false,
          is_completed: true,
          completed_at: '2025-01-21T10:00:00Z',
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '3',
          day_number: 3,
          date: '2025-01-22',
          workout_description: 'Long run 10km',
          is_rest_day: false,
          is_completed: false,
          completed_at: null,
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
      ];

      const stats = calculateWeekStats(workouts);

      expect(stats.total).toBe(3); // All 3 are workouts
      expect(stats.completed).toBe(2); // 2 completed
    });

    it('should exclude rest days from total count', () => {
      const workouts: WorkoutDayDTO[] = [
        {
          id: '1',
          day_number: 1,
          date: '2025-01-20',
          workout_description: 'Easy run 5km',
          is_rest_day: false,
          is_completed: true,
          completed_at: '2025-01-20T10:00:00Z',
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '2',
          day_number: 2,
          date: '2025-01-21',
          workout_description: 'Odpoczynek',
          is_rest_day: true,
          is_completed: false,
          completed_at: null,
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '3',
          day_number: 3,
          date: '2025-01-22',
          workout_description: 'Long run 10km',
          is_rest_day: false,
          is_completed: false,
          completed_at: null,
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
      ];

      const stats = calculateWeekStats(workouts);

      expect(stats.total).toBe(2); // Excludes rest day
      expect(stats.completed).toBe(1); // Only first workout
    });

    it('should return zero stats for empty array', () => {
      const stats = calculateWeekStats([]);

      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
    });

    it('should return zero completed when no workouts are done', () => {
      const workouts: WorkoutDayDTO[] = [
        {
          id: '1',
          day_number: 1,
          date: '2025-01-20',
          workout_description: 'Easy run 5km',
          is_rest_day: false,
          is_completed: false,
          completed_at: null,
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '2',
          day_number: 2,
          date: '2025-01-21',
          workout_description: 'Interval training',
          is_rest_day: false,
          is_completed: false,
          completed_at: null,
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
      ];

      const stats = calculateWeekStats(workouts);

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(0);
    });

    it('should handle week with only rest days', () => {
      const workouts: WorkoutDayDTO[] = [
        {
          id: '1',
          day_number: 1,
          date: '2025-01-20',
          workout_description: 'Odpoczynek',
          is_rest_day: true,
          is_completed: false,
          completed_at: null,
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '2',
          day_number: 2,
          date: '2025-01-21',
          workout_description: 'Odpoczynek',
          is_rest_day: true,
          is_completed: false,
          completed_at: null,
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
      ];

      const stats = calculateWeekStats(workouts);

      expect(stats.total).toBe(0); // No workouts, only rest
      expect(stats.completed).toBe(0);
    });

    it('should return 100% completed when all workouts are done', () => {
      const workouts: WorkoutDayDTO[] = [
        {
          id: '1',
          day_number: 1,
          date: '2025-01-20',
          workout_description: 'Easy run 5km',
          is_rest_day: false,
          is_completed: true,
          completed_at: '2025-01-20T10:00:00Z',
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '2',
          day_number: 2,
          date: '2025-01-21',
          workout_description: 'Odpoczynek',
          is_rest_day: true,
          is_completed: false,
          completed_at: null,
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
        {
          id: '3',
          day_number: 3,
          date: '2025-01-22',
          workout_description: 'Long run',
          is_rest_day: false,
          is_completed: true,
          completed_at: '2025-01-22T10:00:00Z',
          training_plan_id: 'plan-1',
          created_at: '2025-01-15T00:00:00Z',
        },
      ];

      const stats = calculateWeekStats(workouts);

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(2);
      // 100% completion: completed === total
    });
  });

  describe('groupWorkoutsByWeeks', () => {
    // Helper to create mock workout days
    const createWorkoutDay = (dayNumber: number, isRestDay = false): WorkoutDayDTO => ({
      id: `workout-${dayNumber}`,
      day_number: dayNumber,
      date: `2025-01-${String(dayNumber).padStart(2, '0')}`,
      workout_description: isRestDay ? 'Odpoczynek' : `Workout day ${dayNumber}`,
      is_rest_day: isRestDay,
      is_completed: false,
      completed_at: null,
      training_plan_id: 'plan-1',
      created_at: '2025-01-15T00:00:00Z',
    });

    it('should group 70 workout days into 10 weeks', () => {
      // Create 70 workout days
      const workoutDays: WorkoutDayDTO[] = Array.from({ length: 70 }, (_, i) =>
        createWorkoutDay(i + 1)
      );

      const weeks = groupWorkoutsByWeeks(workoutDays);

      expect(weeks).toHaveLength(10);
    });

    it('should assign correct week numbers (1-10)', () => {
      const workoutDays: WorkoutDayDTO[] = Array.from({ length: 70 }, (_, i) =>
        createWorkoutDay(i + 1)
      );

      const weeks = groupWorkoutsByWeeks(workoutDays);

      weeks.forEach((week, index) => {
        expect(week.weekNumber).toBe(index + 1);
      });
    });

    it('should group days 1-7 in week 1', () => {
      const workoutDays: WorkoutDayDTO[] = Array.from({ length: 70 }, (_, i) =>
        createWorkoutDay(i + 1)
      );

      const weeks = groupWorkoutsByWeeks(workoutDays);
      const week1 = weeks[0];

      expect(week1.weekNumber).toBe(1);
      expect(week1.workoutDays).toHaveLength(7);
      expect(week1.workoutDays[0].day_number).toBe(1);
      expect(week1.workoutDays[6].day_number).toBe(7);
    });

    it('should group days 8-14 in week 2', () => {
      const workoutDays: WorkoutDayDTO[] = Array.from({ length: 70 }, (_, i) =>
        createWorkoutDay(i + 1)
      );

      const weeks = groupWorkoutsByWeeks(workoutDays);
      const week2 = weeks[1];

      expect(week2.weekNumber).toBe(2);
      expect(week2.workoutDays).toHaveLength(7);
      expect(week2.workoutDays[0].day_number).toBe(8);
      expect(week2.workoutDays[6].day_number).toBe(14);
    });

    it('should group days 64-70 in week 10', () => {
      const workoutDays: WorkoutDayDTO[] = Array.from({ length: 70 }, (_, i) =>
        createWorkoutDay(i + 1)
      );

      const weeks = groupWorkoutsByWeeks(workoutDays);
      const week10 = weeks[9];

      expect(week10.weekNumber).toBe(10);
      expect(week10.workoutDays).toHaveLength(7);
      expect(week10.workoutDays[0].day_number).toBe(64);
      expect(week10.workoutDays[6].day_number).toBe(70);
    });

    it('should calculate stats for each week', () => {
      // Create 70 days with some completed and some rest days
      const workoutDays: WorkoutDayDTO[] = Array.from({ length: 70 }, (_, i) => {
        const dayNumber = i + 1;
        const isRestDay = dayNumber % 7 === 0; // Every 7th day is rest
        const isCompleted = dayNumber <= 10 && !isRestDay; // First 10 non-rest days completed

        return {
          ...createWorkoutDay(dayNumber, isRestDay),
          is_completed: isCompleted,
          completed_at: isCompleted ? `2025-01-${String(dayNumber).padStart(2, '0')}T10:00:00Z` : null,
        };
      });

      const weeks = groupWorkoutsByWeeks(workoutDays);

      // Week 1: Days 1-7 (day 7 is rest, days 1-6 are completed)
      expect(weeks[0].totalWorkouts).toBe(6); // 7 days - 1 rest
      expect(weeks[0].completedCount).toBe(6); // All 6 workouts completed

      // Week 2: Days 8-14 (day 14 is rest, days 8-10 are completed)
      expect(weeks[1].totalWorkouts).toBe(6); // 7 days - 1 rest
      expect(weeks[1].completedCount).toBe(3); // Days 8, 9, 10

      // Week 3: Days 15-21 (day 21 is rest, none completed)
      expect(weeks[2].totalWorkouts).toBe(6); // 7 days - 1 rest
      expect(weeks[2].completedCount).toBe(0); // None completed
    });

    it('should handle empty workout days array', () => {
      const weeks = groupWorkoutsByWeeks([]);

      expect(weeks).toHaveLength(10);
      weeks.forEach((week) => {
        expect(week.workoutDays).toHaveLength(0);
        expect(week.totalWorkouts).toBe(0);
        expect(week.completedCount).toBe(0);
      });
    });

    it('should maintain workout day order within each week', () => {
      const workoutDays: WorkoutDayDTO[] = Array.from({ length: 70 }, (_, i) =>
        createWorkoutDay(i + 1)
      );

      const weeks = groupWorkoutsByWeeks(workoutDays);

      weeks.forEach((week) => {
        // Verify days are in ascending order
        for (let i = 1; i < week.workoutDays.length; i++) {
          expect(week.workoutDays[i].day_number).toBeGreaterThan(
            week.workoutDays[i - 1].day_number
          );
        }
      });
    });
  });
});
