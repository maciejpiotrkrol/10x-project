import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Zod schema dla formularza resetowania hasła
 */
const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Podaj prawidłowy adres email"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Komponent formularza żądania resetowania hasła.
 * Po pomyślnym wysłaniu wyświetla komunikat sukcesu.
 */
export function ForgotPasswordForm() {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setGeneralError(null);

      // Call forgot password API endpoint
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle error responses
        if (response.status === 400) {
          setGeneralError(responseData.error?.message || "Błąd walidacji danych");
        } else {
          setGeneralError("Wystąpił błąd. Spróbuj ponownie.");
        }
        return;
      }

      // Success - always show success message (security best practice)
      setIsSuccess(true);
    } catch (error) {
      setGeneralError("Wystąpił błąd. Spróbuj ponownie.");
      console.error("Forgot password error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Resetowanie hasła</CardTitle>
        <CardDescription>Podaj swój adres email, aby otrzymać link do resetowania hasła</CardDescription>
      </CardHeader>

      {isSuccess ? (
        // Komunikat sukcesu
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <p className="text-sm text-green-800 dark:text-green-300">
              Jeśli podany adres email istnieje w systemie, wysłaliśmy na niego link do resetowania hasła. Sprawdź
              swoją skrzynkę.
            </p>
          </div>

          <div className="text-center pt-4">
            <a href="/auth/login" className="text-sm text-primary hover:underline">
              Powrót do logowania
            </a>
          </div>
        </CardContent>
      ) : (
        // Formularz
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
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Błąd ogólny */}
            {generalError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{generalError}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
            </Button>

            <a href="/auth/login" className="text-sm text-muted-foreground hover:text-primary text-center">
              Powrót do logowania
            </a>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
