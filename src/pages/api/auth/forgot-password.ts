import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";
import { forgotPasswordSchema } from "@/lib/validation/auth.schemas.ts";
import { ZodError } from "zod";

/**
 * Disable prerendering for SSR
 */
export const prerender = false;

/**
 * POST /api/auth/forgot-password
 *
 * Sends password reset email to user
 * ALWAYS returns 200 even if email doesn't exist (security best practice)
 *
 * Request body:
 * {
 *   email: string
 * }
 *
 * Response (200 OK):
 * {
 *   data: {
 *     message: "Jeśli podany adres email istnieje w systemie, wysłaliśmy na niego link do resetowania hasła"
 *   }
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: {
 *     message: "Błąd walidacji",
 *     details: [...]
 *   }
 * }
 */
export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Create Supabase client with cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Construct redirect URL for reset password page
    const redirectTo = `${url.origin}/auth/reset-password`;

    // Request password reset (sends email with token)
    const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo,
    });

    // IMPORTANT: For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    if (error) {
      console.error("Forgot password error:", error);
      // Still return 200 to not reveal if email exists
    }

    return new Response(
      JSON.stringify({
        data: {
          message: "Jeśli podany adres email istnieje w systemie, wysłaliśmy na niego link do resetowania hasła",
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
    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Błąd walidacji",
            details: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected forgot password error:", error);
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
