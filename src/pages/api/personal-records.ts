import type { APIContext } from "astro";
import { z } from "zod";
import { verifyAuth } from "@/lib/api/auth";
import { successResponse, errorResponse } from "@/lib/api/responses";
import type { PersonalRecordDTO } from "@/types";

// Disable prerendering to enable SSR for this API endpoint
export const prerender = false;

// Zod schema for validating POST request body
const createPersonalRecordSchema = z.object({
  distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"], {
    errorMap: () => ({
      message: "Distance must be one of: 5K, 10K, Half Marathon, Marathon",
    }),
  }),
  time_seconds: z
    .number({
      required_error: "time_seconds is required",
      invalid_type_error: "time_seconds must be a number",
    })
    .int({ message: "time_seconds must be an integer" })
    .positive({ message: "time_seconds must be greater than 0" }),
});

/**
 * GET /api/personal-records
 *
 * Retrieve all personal records for the authenticated user.
 * Returns empty array if user has no records.
 *
 * @param context - Astro API context with Supabase client
 * @returns JSON response with array of records or error
 *
 * Success Response (200 OK):
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "user_id": "uuid",
 *       "distance": "Marathon",
 *       "time_seconds": 12600,
 *       "created_at": "2025-01-15T10:30:00Z"
 *     }
 *   ]
 * }
 *
 * Empty Response (200 OK):
 * {
 *   "data": []
 * }
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 500 Internal Server Error: Database error
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Step 1: Verify authentication
    const { user, error: authError } = await verifyAuth(context);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Step 2: Query database for personal records
    // RLS policy automatically enforces user_id = auth.uid()
    const { data, error: dbError } = await context.locals.supabase
      .from("personal_records")
      .select("*")
      .order("created_at", { ascending: false });

    // Step 3: Handle database errors
    if (dbError) {
      // Log error for debugging (in production, use proper logging)
      console.error("Database error fetching personal records:", dbError);
      return errorResponse("Internal server error", 500);
    }

    // Step 4: Return success response
    // Use data ?? [] to guarantee an array (never null/undefined)
    return successResponse<PersonalRecordDTO[]>(data ?? [], 200);
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error in GET /api/personal-records:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/personal-records
 *
 * Create a new personal record for the authenticated user.
 *
 * @param context - Astro API context with Supabase client
 * @returns JSON response with created record or error
 *
 * Success Response (201 Created):
 * {
 *   "data": {
 *     "id": "uuid",
 *     "user_id": "uuid",
 *     "distance": "5K",
 *     "time_seconds": 1200,
 *     "created_at": "2025-01-15T10:30:00Z"
 *   }
 * }
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 400 Bad Request: Invalid input data (validation failed)
 * - 500 Internal Server Error: Database error
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Step 1: Verify authentication
    const { user, error: authError } = await verifyAuth(context);

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Step 2: Parse request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    // Step 3: Validate request body with Zod
    const validationResult = createPersonalRecordSchema.safeParse(requestBody);

    if (!validationResult.success) {
      // Map Zod errors to ValidationErrorDetail[] format
      const details = validationResult.error.errors.map((err) => ({
        field: err.path.join(".") || "unknown",
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            message: "Validation failed",
            details,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Insert personal record into database
    // RLS policy automatically enforces user_id = auth.uid()
    // Database automatically generates id and sets created_at
    // NOTE: In dev mode with SKIP_AUTH, we need to manually set user_id
    const insertData: any = {
      distance: validationResult.data.distance,
      time_seconds: validationResult.data.time_seconds,
    };

    // If SKIP_AUTH is enabled, manually set user_id (RLS won't work with mock user)
    if (import.meta.env.SKIP_AUTH === "true") {
      insertData.user_id = user.id;
    }

    const { data: personalRecord, error: dbError } = await context.locals.supabase
      .from("personal_records")
      .insert(insertData)
      .select()
      .single();

    // Step 5: Handle database errors
    if (dbError) {
      // Log error for debugging (in production, use proper logging)
      console.error("Database error creating personal record:", dbError);
      return errorResponse("Internal server error", 500);
    }

    // Step 6: Handle unexpected null response (defensive programming)
    if (!personalRecord) {
      console.error("Personal record was not returned after insert");
      return errorResponse("Internal server error", 500);
    }

    // Step 7: Return success response with 201 status
    return successResponse<PersonalRecordDTO>(personalRecord, 201);
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error in POST /api/personal-records:", error);
    return errorResponse("Internal server error", 500);
  }
}
