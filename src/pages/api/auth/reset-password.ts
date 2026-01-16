import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";
import { resetPasswordSchema } from "@/lib/validation/auth.schemas.ts";
import { ZodError } from "zod";

/**
 * Disable prerendering for SSR
 */
export const prerender = false;

/**
 * POST /api/auth/reset-password
 *
 * Resets user password using token from email
 * Verifies OTP token and updates password
 *
 * Request body:
 * {
 *   token: string,
 *   password: string
 * }
 *
 * Response (200 OK):
 * {
 *   data: {
 *     message: "Hasło zostało zmienione pomyślnie"
 *   }
 * }
 *
 * Response (400 Bad Request):
 * {
 *   error: {
 *     message: "Link resetujący wygasł lub jest nieprawidłowy",
 *     code: "INVALID_TOKEN"
 *   }
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Create Supabase client with cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Verify OTP token (recovery type for password reset)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: validatedData.token,
      type: "recovery",
    });

    if (verifyError) {
      console.error("Token verification error:", verifyError);
      return new Response(
        JSON.stringify({
          error: {
            message: "Link resetujący wygasł lub jest nieprawidłowy",
            code: "INVALID_TOKEN",
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

    // Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({
          error: {
            message: "Wystąpił błąd podczas zmiany hasła",
            code: "UPDATE_ERROR",
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
          message: "Hasło zostało zmienione pomyślnie",
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
    console.error("Unexpected reset password error:", error);
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
