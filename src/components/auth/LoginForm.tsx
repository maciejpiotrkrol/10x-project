import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Zod schema dla formularza logowania
 */
const loginSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Podaj prawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Komponent formularza logowania użytkownika.
 * Po pomyślnym logowaniu przekierowuje na /dashboard.
 */
export function LoginForm() {
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setGeneralError(null);

      // Call login API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (response.status === 401) {
          setGeneralError(responseData.error?.message || "Nieprawidłowy email lub hasło");
        } else if (response.status === 400) {
          setGeneralError(responseData.error?.message || "Błąd walidacji danych");
        } else {
          setGeneralError("Wystąpił błąd podczas logowania. Spróbuj ponownie.");
        }
        return;
      }

      // Success - redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      setGeneralError("Wystąpił błąd podczas logowania. Spróbuj ponownie.");
      console.error("Login error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>Zaloguj się do swojego konta Athletica</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              aria-invalid={!!errors.email}
              disabled={isSubmitting}
              data-testid="login-email-input"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Hasło */}
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="Twoje hasło"
              aria-invalid={!!errors.password}
              disabled={isSubmitting}
              data-testid="login-password-input"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          {/* Link do resetowania hasła */}
          <div className="text-right">
            <a href="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Zapomniałem hasła
            </a>
          </div>

          {/* Błąd ogólny */}
          {generalError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20" data-testid="login-error-message">
              <p className="text-sm text-destructive">{generalError}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="login-submit-button">
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Nie masz konta?{" "}
            <a href="/auth/signup" className="text-primary hover:underline font-medium">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
