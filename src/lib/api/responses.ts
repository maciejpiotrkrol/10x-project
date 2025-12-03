import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

/**
 * Creates a standardized success response
 *
 * @param data - The data to return in the response
 * @param status - HTTP status code (default: 200)
 * @returns Response object with JSON body
 *
 * @example
 * return successResponse<ProfileDTO>(profile, 200);
 */
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ data } as ApiSuccessResponse<T>), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a standardized error response
 *
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 500)
 * @param code - Optional error code for programmatic handling
 * @returns Response object with JSON error body
 *
 * @example
 * return errorResponse("Unauthorized", 401);
 * return errorResponse("Profile not found", 404, "PROFILE_NOT_FOUND");
 */
export function errorResponse(message: string, status = 500, code?: string): Response {
  return new Response(
    JSON.stringify({
      error: { message, code },
    } as ApiErrorResponse),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
