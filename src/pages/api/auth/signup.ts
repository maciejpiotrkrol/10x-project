import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";
import { signupSchema } from "@/lib/validation/auth.schemas.ts";
import { ZodError } from "zod";

/**
 * Disable prerendering for SSR
 */
export const prerender = false;

/**
 * POST /api/auth/signup
 *
 * Registers new user with email and password
 * Automatically logs in user (creates session in HTTP-only cookies)
 *
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Response (201 Created):
 * {
 *   data: {
 *     user: {
 *       id: string,
 *       email: string,
 *       created_at: string
 *     }
 *   }
 * }
 *
 * Response (409 Conflict):
 * {
 *   error: {
 *     message: "Użytkownik o podanym adresie email już istnieje",
 *     code: "USER_ALREADY_EXISTS"
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
    const validatedData = signupSchema.parse(body);

    // Create Supabase client with cookie handling
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up new user
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    // Handle signup errors
    if (error) {
      console.error("Signup error:", error);

      // Map Supabase errors to user-friendly messages
      if (error.message.includes("User already registered") || error.message.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Użytkownik o podanym adresie email już istnieje",
              code: "USER_ALREADY_EXISTS",
            },
          }),
          {
            status: 409,
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
            message: "Wystąpił błąd podczas rejestracji",
            code: "SIGNUP_ERROR",
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
            id: data.user?.id,
            email: data.user?.email,
            created_at: data.user?.created_at,
          },
        },
      }),
      {
        status: 201,
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
    console.error("Unexpected signup error:", error);
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
