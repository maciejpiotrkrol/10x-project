import type { APIContext } from "astro";

/**
 * Verifies authentication for API endpoints
 *
 * @param context - Astro API context containing Supabase client
 * @returns Object with user (if authenticated) and error flag
 *
 * @example
 * const { user, error } = await verifyAuth(context);
 * if (error || !user) {
 *   return errorResponse("Unauthorized", 401);
 * }
 */
export async function verifyAuth(context: APIContext) {
  const {
    data: { user },
    error,
  } = await context.locals.supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: true };
  }

  return { user, error: false };
}
