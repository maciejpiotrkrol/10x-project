import type { APIContext } from "astro";
import { verifyAuth } from "@/lib/api/auth";
import { errorResponse } from "@/lib/api/responses";

// Disable prerendering to enable SSR for this API endpoint
export const prerender = false;

/**
 * DELETE /api/personal-records/:id
 *
 * Delete a specific personal record belonging to the authenticated user.
 *
 * This endpoint implements idempotent DELETE behavior - multiple DELETE requests
 * for the same record ID will all return success (204 No Content). This is
 * intentional and follows REST best practices for DELETE operations.
 *
 * Security is enforced via Row Level Security (RLS) at the database level.
 * The RLS policy "Users can delete own personal records" ensures that users
 * can only delete records where user_id = auth.uid(). If a record doesn't
 * exist or belongs to another user, RLS makes it invisible and the delete
 * operation succeeds without deleting anything (idempotent behavior).
 *
 * @param context - Astro API context containing Supabase client and request params
 * @returns Empty response with status code
 *
 * Success Response (204 No Content):
 * - Status: 204
 * - Body: (empty)
 * - Note: Returns 204 even if record doesn't exist (idempotent)
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid authentication token
 *   Response: { "error": { "message": "Unauthorized" } }
 *
 * - 500 Internal Server Error: Database error or unexpected exception
 *   Response: { "error": { "message": "Internal server error" } }
 *
 * Path Parameters:
 * @param id - UUID of the personal record to delete
 *
 * Examples:
 * ```bash
 * curl -X DELETE http://localhost:3000/api/personal-records/550e8400-e29b-41d4-a716-446655440000 \
 *   -H "Authorization: Bearer <jwt-token>"
 * ```
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    // Step 1: Verify authentication
    const { user, error: authError } = await verifyAuth(context);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Step 2: Extract record ID from path parameters
    // Astro automatically parses [id] from the file name and makes it
    // available in context.params
    const { id } = context.params;

    // Validate that ID was provided (should always be true with Astro routing)
    if (!id) {
      return errorResponse("Personal record not found", 404, "RECORD_NOT_FOUND");
    }

    // Step 3: Delete the personal record from database
    // The RLS policy "Users can delete own personal records" automatically
    // adds a WHERE user_id = auth.uid() filter to this query. This means:
    // - If record exists and belongs to this user: deleted
    // - If record exists but belongs to another user: not deleted (RLS blocks)
    // - If record doesn't exist: no error (idempotent DELETE)
    //
    // We don't use .select() here because we want idempotent behavior.
    // Multiple DELETE calls should all succeed, regardless of whether the
    // record still exists.
    const { error: dbError } = await context.locals.supabase.from("personal_records").delete().eq("id", id);

    // Step 4: Handle database errors
    // Only log and return error if there's an actual database problem
    // (connection issues, invalid UUID format, etc.)
    if (dbError) {
      // Log error details for debugging and monitoring
      console.error("Database error deleting personal record:", dbError);
      return errorResponse("Internal server error", 500);
    }

    // Step 5: Return success response (204 No Content)
    // HTTP 204 indicates successful DELETE with no content to return
    // This is the standard response for successful DELETE operations
    //
    // Important: We return 204 even if no record was actually deleted
    // (because it didn't exist or belonged to another user). This is
    // intentional - DELETE operations should be idempotent.
    return new Response(null, { status: 204 });
  } catch (error) {
    // Catch any unexpected errors that weren't handled above
    // (runtime exceptions, unexpected Supabase errors, etc.)
    console.error("Unexpected error in DELETE /api/personal-records/:id:", error);
    return errorResponse("Internal server error", 500);
  }
}
