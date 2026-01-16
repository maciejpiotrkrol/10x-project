import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";
import { loginSchema } from "@/lib/validation/auth.schemas.ts";
import { ZodError } from "zod";

/**
 * Disable prerendering for SSR
 */
export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates user with email and password
 * Creates session in HTTP-only cookies via Supabase Auth
 *
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response (200 OK):
 * {
 *   data: {
 *     user: {
 *       id: string,
 *       email: string
 *     }
 *   }
 * }
 *
 * Response (401 Unauthorized):
 * {
 *   error: {
 *     message: "Nieprawidłowy email lub hasło",
 *     code: "INVALID_CREDENTIALS"
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
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Create Supabase client with cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    // Handle authentication errors
    if (error) {
      console.error("Login error:", error);

      // Map Supabase errors to user-friendly messages
      if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid")) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Nieprawidłowy email lub hasło",
              code: "INVALID_CREDENTIALS",
            },
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Generic error for other cases
      return new Response(
        JSON.stringify({
          error: {
            message: "Wystąpił błąd podczas logowania",
            code: "LOGIN_ERROR",
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

    // Success - return user data
    return new Response(
      JSON.stringify({
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
          },
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
    console.error("Unexpected login error:", error);
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
