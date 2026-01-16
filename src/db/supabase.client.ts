import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types.ts";

/**
 * Cookie configuration for Supabase Auth
 * Used for secure session management in SSR environment
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse Cookie header string into array of name-value pairs
 * Required by @supabase/ssr for cookie handling
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase Server Client for SSR with proper cookie handling
 *
 * This function creates a Supabase client that properly manages cookies
 * in Astro's SSR environment using @supabase/ssr package.
 *
 * @param context - Object containing Astro headers and cookies
 * @returns Configured Supabase client with Database types
 *
 * @example
 * // In API endpoint:
 * export const POST: APIRoute = async ({ request, cookies }) => {
 *   const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
 *   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
 * };
 *
 * @example
 * // In middleware:
 * const supabase = createSupabaseServerInstance({ cookies: context.cookies, headers: context.request.headers });
 * const { data: { user } } = await supabase.auth.getUser();
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
