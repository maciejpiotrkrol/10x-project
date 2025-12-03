/**
 * Training Plan Service
 *
 * Handles database operations for training plan generation.
 * Performs transactional-like operations: profile upsert, personal records update,
 * plan deactivation, and new plan + workout days creation.
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { GenerateTrainingPlanCommand } from "@/types";

interface WorkoutDay {
  day_number: number;
  workout_description: string;
  is_rest_day: boolean;
}

/**
 * Create a complete training plan with all database operations
 *
 * This function performs the following operations sequentially:
 * 1. Upsert user profile
 * 2. Delete existing personal records
 * 3. Insert new personal records
 * 4. Deactivate any existing active training plan
 * 5. Create new training plan
 * 6. Create 70 workout days
 * 7. Fetch and return complete plan with workout days
 *
 * @param supabase Supabase client from context.locals
 * @param userId Authenticated user ID
 * @param command Training plan generation command with profile and personal records
 * @param workoutDays Array of 70 workout days from AI service
 * @returns Complete training plan with workout days
 * @throws Error if any database operation fails
 */
export async function createTrainingPlan(
  supabase: SupabaseClient,
  userId: string,
  command: GenerateTrainingPlanCommand,
  workoutDays: WorkoutDay[]
) {
  // Step 1: Upsert profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: userId,
    ...command.profile,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error("Profile upsert error:", profileError);
    throw new Error(`Failed to update profile: ${profileError.message}`);
  }

  // Step 2: Replace personal records (delete + insert)
  const { error: deleteError } = await supabase.from("personal_records").delete().eq("user_id", userId);

  if (deleteError) {
    console.error("Personal records delete error:", deleteError);
    throw new Error(`Failed to delete old personal records: ${deleteError.message}`);
  }

  const recordsToInsert = command.personal_records.map((pr) => ({
    user_id: userId,
    distance: pr.distance,
    time_seconds: pr.time_seconds,
  }));

  const { error: recordsError } = await supabase.from("personal_records").insert(recordsToInsert);

  if (recordsError) {
    console.error("Personal records insert error:", recordsError);
    throw new Error(`Failed to insert personal records: ${recordsError.message}`);
  }

  // Step 3: Deactivate old active plan
  const { error: deactivateError } = await supabase
    .from("training_plans")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (deactivateError) {
    console.error("Plan deactivation error:", deactivateError);
    throw new Error(`Failed to deactivate old plan: ${deactivateError.message}`);
  }

  // Step 4: Create new training plan
  const startDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const endDate = new Date(Date.now() + 69 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: newPlan, error: planError } = await supabase
    .from("training_plans")
    .insert({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    })
    .select()
    .single();

  if (planError || !newPlan) {
    console.error("Training plan creation error:", planError);
    throw new Error(`Failed to create training plan: ${planError?.message || "Unknown error"}`);
  }

  // Step 5: Create 70 workout days
  const workoutDaysToInsert = workoutDays.map((day, index) => {
    const dayDate = new Date(Date.now() + index * 24 * 60 * 60 * 1000);
    return {
      training_plan_id: newPlan.id,
      day_number: day.day_number,
      date: dayDate.toISOString().split("T")[0],
      workout_description: day.workout_description,
      is_rest_day: day.is_rest_day,
    };
  });

  const { error: workoutsError } = await supabase.from("workout_days").insert(workoutDaysToInsert);

  if (workoutsError) {
    console.error("Workout days creation error:", workoutsError);
    throw new Error(`Failed to create workout days: ${workoutsError.message}`);
  }

  // Step 6: Fetch complete plan with workout days
  const { data: completePlan, error: fetchError } = await supabase
    .from("training_plans")
    .select("*, workout_days(*)")
    .eq("id", newPlan.id)
    .order("day_number", { referencedTable: "workout_days", ascending: true })
    .single();

  if (fetchError || !completePlan) {
    console.error("Fetch complete plan error:", fetchError);
    throw new Error(`Failed to fetch complete plan: ${fetchError?.message || "Unknown error"}`);
  }

  return completePlan;
}

/**
 * Fetch active training plan with all workout days
 *
 * Retrieves the user's active training plan with all 70 workout days
 * sorted by day_number. Returns null if no active plan exists.
 *
 * @param userId Authenticated user ID
 * @param supabase Supabase client from context.locals
 * @returns Active training plan with workout days or null if not found
 * @throws Error if database query fails
 */
export async function getActivePlanWithWorkouts(userId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("training_plans")
    .select(
      `
      *,
      workout_days (*)
    `
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("day_number", { foreignTable: "workout_days" })
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - this is not an error, just no active plan
      return null;
    }
    // Actual database error
    throw error;
  }

  return data;
}

/**
 * Calculate completion statistics for workout days
 *
 * Computes real-time statistics based on workout days array:
 * - Total number of workout days (excluding rest days)
 * - Number of completed workouts
 * - Total rest days
 * - Completion percentage (0-100)
 * - Whether the plan is completed (all workouts done OR end date passed)
 *
 * @param workoutDays Array of all workout days in the plan
 * @param endDate Plan end date in ISO format (YYYY-MM-DD)
 * @returns Completion statistics object
 */
export function calculateCompletionStats(
  workoutDays: { is_rest_day: boolean; is_completed: boolean }[],
  endDate: string
) {
  const totalWorkouts = workoutDays.filter((day) => !day.is_rest_day).length;
  const completedWorkouts = workoutDays.filter((day) => !day.is_rest_day && day.is_completed).length;
  const totalRestDays = workoutDays.filter((day) => day.is_rest_day).length;

  const completionPercentage = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  const planEndDate = new Date(endDate + "T00:00:00"); // Parse as local date
  const isPlanCompleted = planEndDate < today || completedWorkouts === totalWorkouts;

  return {
    total_workouts: totalWorkouts,
    completed_workouts: completedWorkouts,
    total_rest_days: totalRestDays,
    completion_percentage: completionPercentage,
    is_plan_completed: isPlanCompleted,
  };
}
