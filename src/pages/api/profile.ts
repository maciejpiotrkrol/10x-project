import type { APIContext } from "astro";
import { verifyAuth } from "@/lib/api/auth";
import { successResponse, errorResponse } from "@/lib/api/responses";
import type { ProfileDTO } from "@/types";

// Disable prerendering to enable SSR for this API endpoint
export const prerender = false;

/**
 * GET /api/profile
 *
 * Retrieve the authenticated user's profile data from the survey.
 *
 * @param context - Astro API context with Supabase client
 * @returns JSON response with profile data or error
 *
 * Success Response (200 OK):
 * {
 *   "data": {
 *     "user_id": "uuid",
 *     "goal_distance": "Marathon",
 *     "weekly_km": 45.50,
 *     "training_days_per_week": 5,
 *     "age": 32,
 *     "weight": 72.5,
 *     "height": 175,
 *     "gender": "M",
 *     "created_at": "2025-01-08T10:00:00Z",
 *     "updated_at": "2025-01-08T10:00:00Z"
 *   }
 * }
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Profile not yet created (user hasn't completed survey)
 * - 500 Internal Server Error: Database error
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Step 1: Verify authentication
    const { user, error: authError } = await verifyAuth(context);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Step 2: Query user's profile from database
    // RLS policy automatically enforces user_id = auth.uid()
    const { data: profile, error: dbError } = await context.locals.supabase.from("profiles").select("*").single();

    // Step 3: Handle database errors
    if (dbError) {
      // PostgreSQL error code PGRST116 = no rows returned
      if (dbError.code === "PGRST116") {
        return errorResponse("Profile not found", 404, "PROFILE_NOT_FOUND");
      }

      // Log error for debugging (in production, use proper logging)
      console.error("Database error fetching profile:", dbError);
      return errorResponse("Internal server error", 500);
    }

    // Step 4: Handle case where profile doesn't exist
    if (!profile) {
      return errorResponse("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    // Step 5: Return success response
    return successResponse<ProfileDTO>(profile, 200);
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error in GET /api/profile:", error);
    return errorResponse("Internal server error", 500);
  }
}
