import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Zod schema dla formularza zmiany hasła
 */
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Komponent formularza ustawiania nowego hasła.
 * Pobiera token z URL i po pomyślnej zmianie przekierowuje do logowania.
 */
export function ResetPasswordForm() {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  // Pobierz token z URL przy montowaniu komponentu
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlHash = new URLSearchParams(window.location.hash.substring(1));

      // Supabase może przekazać token w query param lub hash
      const tokenFromQuery = urlParams.get("token") || urlParams.get("token_hash");
      const tokenFromHash = urlHash.get("token") || urlHash.get("token_hash");

      const extractedToken = tokenFromQuery || tokenFromHash;
      setToken(extractedToken);

      if (!extractedToken) {
        setGeneralError("Link resetujący jest nieprawidłowy lub wygasł. Poproś o nowy link.");
      }
    }
  }, []);

  // Countdown i redirect po sukcesie
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      // Redirect do logowania
      window.location.href = "/auth/login";
    }
  }, [isSuccess, countdown]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setGeneralError("Token resetowania nie został znaleziony.");
      return;
    }

    try {
      setGeneralError(null);

      // TODO: Wywołanie API /api/auth/reset-password
      console.log("Reset password data:", { token, password: data.password });

      // Symulacja opóźnienia API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Po sukcesie - wyświetl komunikat i rozpocznij countdown
      setIsSuccess(true);
    } catch (error) {
      setGeneralError("Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.");
      console.error("Reset password error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło do swojego konta</CardDescription>
      </CardHeader>

      {isSuccess ? (
        // Komunikat sukcesu
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <p className="text-sm text-green-800 dark:text-green-300 mb-2">Hasło zostało zmienione pomyślnie!</p>
            <p className="text-sm text-green-700 dark:text-green-400">
              Przekierowanie do logowania za {countdown} {countdown === 1 ? "sekundę" : "sekundy"}...
            </p>
          </div>

          <div className="text-center">
            <a href="/auth/login" className="text-sm text-primary hover:underline">
              Przejdź do logowania teraz
            </a>
          </div>
        </CardContent>
      ) : (
        // Formularz
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Hasło */}
            <div className="space-y-2">
              <Label htmlFor="password">Nowe hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 znaków"
                aria-invalid={!!errors.password}
                disabled={isSubmitting || !token}
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {/* Potwierdzenie hasła */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Wpisz hasło ponownie"
                aria-invalid={!!errors.confirmPassword}
                disabled={isSubmitting || !token}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {/* Błąd ogólny */}
            {generalError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{generalError}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
              {isSubmitting ? "Zmiana hasła..." : "Zmień hasło"}
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
