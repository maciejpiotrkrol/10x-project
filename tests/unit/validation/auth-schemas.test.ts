import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth.schemas";

describe("Auth Validation Schemas", () => {
  describe("signupSchema", () => {
    describe("Valid inputs", () => {
      it("should accept valid email and password", () => {
        const validData = {
          email: "test@example.com",
          password: "ValidPass123!",
        };

        const result = signupSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe("test@example.com");
          expect(result.data.password).toBe("ValidPass123!");
        }
      });

      it("should accept password with exactly 8 characters", () => {
        const result = signupSchema.safeParse({
          email: "test@example.com",
          password: "12345678", // Exactly 8 chars
        });

        expect(result.success).toBe(true);
      });

      it("should accept various email formats", () => {
        const validEmails = [
          "user@example.com",
          "user.name@example.com",
          "user+tag@example.co.uk",
          "user_123@sub.example.com",
        ];

        validEmails.forEach((email) => {
          const result = signupSchema.safeParse({
            email,
            password: "ValidPass123",
          });

          expect(result.success).toBe(true);
        });
      });
    });

    describe("Invalid inputs", () => {
      it("should reject invalid email format", () => {
        const result = signupSchema.safeParse({
          email: "invalid-email",
          password: "ValidPass123",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Nieprawidłowy format email");
        }
      });

      it("should reject password shorter than 8 characters", () => {
        const result = signupSchema.safeParse({
          email: "test@example.com",
          password: "Short1", // 6 chars
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Hasło musi mieć co najmniej 8 znaków");
        }
      });

      it("should reject empty password", () => {
        const result = signupSchema.safeParse({
          email: "test@example.com",
          password: "",
        });

        expect(result.success).toBe(false);
      });

      it("should reject missing email", () => {
        const result = signupSchema.safeParse({
          password: "ValidPass123",
        });

        expect(result.success).toBe(false);
      });

      it("should reject missing password", () => {
        const result = signupSchema.safeParse({
          email: "test@example.com",
        });

        expect(result.success).toBe(false);
      });

      it("should reject empty email", () => {
        const result = signupSchema.safeParse({
          email: "",
          password: "ValidPass123",
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe("loginSchema", () => {
    describe("Valid inputs", () => {
      it("should accept valid email and password", () => {
        const result = loginSchema.safeParse({
          email: "test@example.com",
          password: "anypassword",
        });

        expect(result.success).toBe(true);
      });

      it("should accept password with any length >= 1", () => {
        const result = loginSchema.safeParse({
          email: "test@example.com",
          password: "1", // Single character
        });

        expect(result.success).toBe(true);
      });
    });

    describe("Invalid inputs", () => {
      it("should reject invalid email format", () => {
        const result = loginSchema.safeParse({
          email: "not-an-email",
          password: "password",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Nieprawidłowy format email");
        }
      });

      it("should reject empty password", () => {
        const result = loginSchema.safeParse({
          email: "test@example.com",
          password: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Hasło jest wymagane");
        }
      });

      it("should reject missing email or password", () => {
        const missingEmail = loginSchema.safeParse({
          password: "password",
        });
        expect(missingEmail.success).toBe(false);

        const missingPassword = loginSchema.safeParse({
          email: "test@example.com",
        });
        expect(missingPassword.success).toBe(false);
      });
    });
  });

  describe("forgotPasswordSchema", () => {
    describe("Valid inputs", () => {
      it("should accept valid email", () => {
        const result = forgotPasswordSchema.safeParse({
          email: "test@example.com",
        });

        expect(result.success).toBe(true);
      });

      it("should accept various email formats", () => {
        const validEmails = ["user@example.com", "user.name@example.com", "user+tag@example.co.uk"];

        validEmails.forEach((email) => {
          const result = forgotPasswordSchema.safeParse({ email });
          expect(result.success).toBe(true);
        });
      });
    });

    describe("Invalid inputs", () => {
      it("should reject invalid email format", () => {
        const result = forgotPasswordSchema.safeParse({
          email: "invalid-email",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Nieprawidłowy format email");
        }
      });

      it("should reject empty email", () => {
        const result = forgotPasswordSchema.safeParse({
          email: "",
        });

        expect(result.success).toBe(false);
      });

      it("should reject missing email", () => {
        const result = forgotPasswordSchema.safeParse({});

        expect(result.success).toBe(false);
      });
    });
  });

  describe("resetPasswordSchema", () => {
    describe("Valid inputs", () => {
      it("should accept valid token and password", () => {
        const result = resetPasswordSchema.safeParse({
          token: "valid-token-string",
          password: "NewPass123!",
        });

        expect(result.success).toBe(true);
      });

      it("should accept password with exactly 8 characters", () => {
        const result = resetPasswordSchema.safeParse({
          token: "token",
          password: "12345678",
        });

        expect(result.success).toBe(true);
      });

      it("should accept long token strings", () => {
        const longToken = "a".repeat(100);
        const result = resetPasswordSchema.safeParse({
          token: longToken,
          password: "ValidPass123",
        });

        expect(result.success).toBe(true);
      });
    });

    describe("Invalid inputs", () => {
      it("should reject empty token", () => {
        const result = resetPasswordSchema.safeParse({
          token: "",
          password: "ValidPass123",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Token jest wymagany");
        }
      });

      it("should reject password shorter than 8 characters", () => {
        const result = resetPasswordSchema.safeParse({
          token: "valid-token",
          password: "Short1", // 6 chars
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Hasło musi mieć co najmniej 8 znaków");
        }
      });

      it("should reject missing token", () => {
        const result = resetPasswordSchema.safeParse({
          password: "ValidPass123",
        });

        expect(result.success).toBe(false);
      });

      it("should reject missing password", () => {
        const result = resetPasswordSchema.safeParse({
          token: "valid-token",
        });

        expect(result.success).toBe(false);
      });

      it("should reject empty password", () => {
        const result = resetPasswordSchema.safeParse({
          token: "valid-token",
          password: "",
        });

        expect(result.success).toBe(false);
      });
    });

    describe("Multiple validation errors", () => {
      it("should return all validation errors when both fields are invalid", () => {
        const result = resetPasswordSchema.safeParse({
          token: "", // Empty token
          password: "short", // Too short (5 chars)
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(2);
          expect(result.error.issues[0].message).toBe("Token jest wymagany");
          expect(result.error.issues[1].message).toBe("Hasło musi mieć co najmniej 8 znaków");
        }
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in email", () => {
      const result = signupSchema.safeParse({
        email: "user+test@example.com",
        password: "ValidPass123",
      });

      expect(result.success).toBe(true);
    });

    it("should handle unicode characters in password", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "Пароль123", // Cyrillic characters
      });

      expect(result.success).toBe(true);
    });

    it("should reject emails without @ symbol", () => {
      const result = signupSchema.safeParse({
        email: "testexample.com",
        password: "ValidPass123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject emails without domain", () => {
      const result = signupSchema.safeParse({
        email: "test@",
        password: "ValidPass123",
      });

      expect(result.success).toBe(false);
    });
  });
});
