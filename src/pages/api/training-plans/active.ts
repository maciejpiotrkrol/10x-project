import type { APIRoute } from "astro";
import { verifyAuth } from "@/lib/api/auth";
import { successResponse, errorResponse } from "@/lib/api/responses";
import { getActivePlanWithWorkouts, calculateCompletionStats } from "@/lib/services/training-plan.service";
import type { TrainingPlanWithWorkoutsDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/training-plans/active
 *
 * Fetches the user's active training plan with all 70 workout days
 * and calculated completion statistics.
 *
 * @returns 200 OK - Active training plan with workout days and completion stats
 * @returns 401 Unauthorized - Missing or invalid authentication token
 * @returns 404 Not Found - No active training plan exists for user
 * @returns 500 Internal Server Error - Database error or incomplete plan data
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Verify authentication
    const { user, error: authError } = await verifyAuth(context);
    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Step 2: Fetch active plan with workout days
    const activePlan = await getActivePlanWithWorkouts(user.id, context.locals.supabase);

    if (!activePlan) {
      return errorResponse("No active training plan found", 404, "NO_ACTIVE_PLAN");
    }

    // Step 3: Validate data integrity
    if (!activePlan.workout_days || activePlan.workout_days.length !== 70) {
      console.error("Training plan has incomplete workout days", {
        planId: activePlan.id,
        userId: user.id,
        count: activePlan.workout_days?.length,
      });
      return errorResponse("Training plan data is incomplete", 500);
    }

    // Step 4: Calculate completion stats
    const completionStats = calculateCompletionStats(activePlan.workout_days, activePlan.end_date);

    // Step 5: Build response DTO
    const response: TrainingPlanWithWorkoutsDTO = {
      ...activePlan,
      completion_stats: completionStats,
    };

    // Step 6: Return success response
    return successResponse<TrainingPlanWithWorkoutsDTO>(response, 200);
  } catch (error) {
    console.error("Error fetching active training plan:", error);
    return errorResponse("Failed to fetch active training plan", 500);
  }
};
