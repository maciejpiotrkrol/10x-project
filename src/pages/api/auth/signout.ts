import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";

/**
 * Disable prerendering for SSR
 */
export const prerender = false;

/**
 * POST /api/auth/signout
 *
 * Logs out the current user by destroying their session
 * Clears HTTP-only cookies via Supabase Auth
 *
 * Response (200 OK):
 * {
 *   data: {
 *     message: "Wylogowano pomyślnie"
 *   }
 * }
 *
 * Response (500 Internal Server Error):
 * {
 *   error: {
 *     message: "Wystąpił błąd podczas wylogowywania"
 *   }
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client with cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out user (destroys session and clears cookies)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Signout error:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: "Wystąpił błąd podczas wylogowywania",
            code: "SIGNOUT_ERROR",
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        data: {
          message: "Wylogowano pomyślnie",
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected signout error:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: "Wystąpił nieoczekiwany błąd",
          code: "INTERNAL_ERROR",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
