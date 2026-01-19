import type { APIContext } from "astro";
import { z } from "zod";
import { verifyAuth } from "@/lib/api/auth";
import { successResponse, errorResponse } from "@/lib/api/responses";
import type { WorkoutDayDTO } from "@/types";

// Disable prerendering to enable SSR for this API endpoint
export const prerender = false;

/**
 * Zod schema for validating PATCH request body
 * Only allows updating the is_completed field
 */
const UpdateWorkoutDaySchema = z.object({
  is_completed: z.boolean({
    required_error: "is_completed is required",
    invalid_type_error: "is_completed must be a boolean",
  }),
});

/**
 * PATCH /api/workout-days/:id
 *
 * Update a workout day's completion status. This endpoint is primarily used for
 * toggling whether a workout has been completed or not. When marking a workout
 * as completed, the completed_at timestamp is automatically set to NOW(). When
 * unmarking, completed_at is set to NULL.
 *
 * Security is enforced via Row Level Security (RLS) at the database level.
 * The RLS policy "Users can update own workout days" ensures that users can only
 * update workout days that belong to their training plans via a JOIN check:
 *
 * EXISTS (
 *   SELECT 1 FROM training_plans
 *   WHERE training_plans.id = workout_days.training_plan_id
 *   AND training_plans.user_id = auth.uid()
 * )
 *
 * Important constraints:
 * - Rest days (is_rest_day = true) cannot be marked as completed
 * - This is enforced by database CHECK constraint: no_completed_rest_days
 * - Attempting to mark a rest day as completed will result in 400 Bad Request
 *
 * @param context - Astro API context containing Supabase client and request params
 * @returns Response with updated workout day data or error
 *
 * Success Response (200 OK):
 * {
 *   "data": {
 *     "id": "uuid",
 *     "training_plan_id": "uuid",
 *     "day_number": 5,
 *     "date": "2025-01-12",
 *     "workout_description": "Easy run 8km, conversational pace",
 *     "is_rest_day": false,
 *     "is_completed": true,
 *     "completed_at": "2025-01-12T19:15:00Z"
 *   }
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid input or attempting to mark rest day as completed
 *   Response: {
 *     "error": {
 *       "message": "Validation failed",
 *       "details": [{ "field": "is_completed", "message": "..." }]
 *     }
 *   }
 *   OR
 *   Response: {
 *     "error": {
 *       "message": "Rest days cannot be marked as completed",
 *       "code": "REST_DAY_COMPLETION_NOT_ALLOWED"
 *     }
 *   }
 *
 * - 401 Unauthorized: Missing or invalid authentication token
 *   Response: { "error": { "message": "Unauthorized" } }
 *
 * - 404 Not Found: Workout day does not exist or belongs to another user (RLS blocks)
 *   Response: {
 *     "error": {
 *       "message": "Workout day not found",
 *       "code": "WORKOUT_DAY_NOT_FOUND"
 *     }
 *   }
 *
 * - 500 Internal Server Error: Database error or unexpected exception
 *   Response: { "error": { "message": "Internal server error" } }
 *
 * Path Parameters:
 * @param id - UUID of the workout day to update
 *
 * Request Body:
 * {
 *   "is_completed": true | false
 * }
 *
 * Examples:
 * ```bash
 * curl -X PATCH http://localhost:3000/api/workout-days/550e8400-e29b-41d4-a716-446655440000 \
 *   -H "Authorization: Bearer <jwt-token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"is_completed": true}'
 * ```
 */
export async function PATCH(context: APIContext): Promise<Response> {
  try {
    // Step 1: Verify authentication
    const { user, error: authError } = await verifyAuth(context);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Step 2: Parse request body
    // Extract JSON body from the request
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    // Step 3: Validate input with Zod
    // Ensure is_completed is a boolean value
    const result = UpdateWorkoutDaySchema.safeParse(requestBody);

    if (!result.success) {
      // Map Zod validation errors to our standard error format
      const validationErrors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return errorResponse("Validation failed", 400, undefined, validationErrors);
    }

    const validatedData = result.data;

    // Step 4: Extract path parameter (workout day ID)
    // Astro automatically parses [id] from the file name and makes it
    // available in context.params
    const { id } = context.params;

    // Validate that ID was provided (should always be true with Astro routing)
    if (!id) {
      return errorResponse("Workout day not found", 404, "WORKOUT_DAY_NOT_FOUND");
    }

    // Step 5: Prepare update payload
    // When marking as completed, set completed_at to current timestamp
    // When marking as incomplete, set completed_at to NULL
    const updatePayload = {
      is_completed: validatedData.is_completed,
      completed_at: validatedData.is_completed ? new Date().toISOString() : null,
    };

    // Step 6: Execute database UPDATE
    // The RLS policy "Users can update own workout days" automatically
    // adds a filter to verify ownership via JOIN to training_plans:
    //
    // USING (
    //   EXISTS (
    //     SELECT 1 FROM training_plans
    //     WHERE training_plans.id = workout_days.training_plan_id
    //     AND training_plans.user_id = auth.uid()
    //   )
    // )
    //
    // This means:
    // - If workout day exists and belongs to this user's plan: updated
    // - If workout day exists but belongs to another user's plan: not updated (RLS blocks)
    // - If workout day doesn't exist: not found
    //
    // We use .select().single() to return the updated record and ensure
    // exactly one record was affected.
    const { data, error: dbError } = await context.locals.supabase
      .from("workout_days")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    // Step 7: Handle database errors
    if (dbError) {
      // Log error details for debugging and monitoring
      console.error("Database error updating workout day:", dbError);

      // Handle "no rows returned" error (PGRST116)
      // This occurs when .single() is called but no records match the query
      // This can happen if:
      // 1. The workout day doesn't exist, OR
      // 2. The workout day exists but belongs to another user (RLS blocked it)
      // We treat both cases as 404 for security reasons
      if (dbError.code === "PGRST116") {
        return errorResponse("Workout day not found", 404, "WORKOUT_DAY_NOT_FOUND");
      }

      // Handle CHECK constraint violation (attempting to mark rest day as completed)
      // PostgreSQL error code 23514 indicates a CHECK constraint violation
      if (dbError.code === "23514") {
        return errorResponse("Rest days cannot be marked as completed", 400, "REST_DAY_COMPLETION_NOT_ALLOWED");
      }

      // Handle other database errors
      return errorResponse("Internal server error", 500);
    }

    // Step 8: Check if workout day exists
    // If data is null, it means either:
    // 1. The workout day doesn't exist, OR
    // 2. The workout day exists but belongs to another user (RLS blocked it)
    //
    // We treat both cases as 404 for security reasons (don't leak information
    // about whether a resource exists if the user doesn't have access to it)
    if (!data) {
      return errorResponse("Workout day not found", 404, "WORKOUT_DAY_NOT_FOUND");
    }

    // Step 9: Return success response with updated workout day
    // The response includes all fields from the workout_days table,
    // including the newly updated is_completed and completed_at values
    return successResponse<WorkoutDayDTO>(data, 200);
  } catch (error) {
    // Step 10: Handle unexpected errors
    // Catch any unexpected errors that weren't handled above
    // (runtime exceptions, unexpected Supabase errors, etc.)
    console.error("Unexpected error in PATCH /api/workout-days/:id:", error);
    return errorResponse("Internal server error", 500);
  }
}
