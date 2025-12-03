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
  // DEV MODE: Skip authentication if SKIP_AUTH environment variable is set to "true"
  // WARNING: This should ONLY be used in local development, never in production!
  if (import.meta.env.SKIP_AUTH === "true") {
    // Return a mock user for testing
    const mockUser = {
      id: "00000000-0000-0000-0000-000000000000",
      email: "dev@test.com",
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
    };

    console.warn("⚠️  SKIP_AUTH is enabled - using mock user for development. Never use this in production!");

    return { user: mockUser as any, error: false };
  }

  // Normal authentication flow
  const {
    data: { user },
    error,
  } = await context.locals.supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: true };
  }

  return { user, error: false };
}
