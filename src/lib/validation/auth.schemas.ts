import { z } from "zod";

/**
 * Zod validation schemas for authentication endpoints
 * Provides server-side validation with Polish error messages
 */

/**
 * Schema for user signup
 * Validates email format and password length
 */
export const signupSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

/**
 * Schema for user login
 * Validates email format and requires password
 */
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Schema for forgot password request
 * Validates email format only
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
});

/**
 * Schema for password reset
 * Validates token presence and new password length
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token jest wymagany"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

/**
 * TypeScript types inferred from schemas
 */
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
