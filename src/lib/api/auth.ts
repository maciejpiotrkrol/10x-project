import type { APIContext } from "astro";

/**
 * Verifies authentication for API endpoints
 *
 * Returns user from Astro.locals which is set by middleware.
 * Middleware already verified the session, so this is just a convenience function
 * to check if user is authenticated in API routes.
 *
 * @param context - Astro API context containing locals.user
 * @returns Object with user (if authenticated) and error flag
 *
 * @example
 * ```typescript
 * export const GET: APIRoute = async (context) => {
 *   const { user, error } = verifyAuth(context);
 *   if (error || !user) {
 *     return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
 *   }
 *   // User is authenticated, proceed...
 * };
 * ```
 */
export function verifyAuth(context: APIContext) {
  const user = context.locals.user;

  if (!user) {
    return { user: null, error: true };
  }

  return { user, error: false };
}
