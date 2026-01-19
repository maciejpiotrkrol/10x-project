import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import type { LoadingModalState } from "./types";

interface LoadingModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Current state of the modal */
  state: LoadingModalState;
  /** Error message to display in error state */
  errorMessage?: string;
  /** Callback when user clicks retry button */
  onRetry?: () => void;
  /** Callback when user clicks close button */
  onClose?: () => void;
}

const PROGRESS_MESSAGES = [
  "Analizujemy Twoje dane...",
  "Tworzenie spersonalizowanego planu...",
  "Generowanie treningów...",
  "To może potrwać 20-30 sekund",
];

/**
 * Modal wyświetlany podczas generowania planu przez AI. Niedomykalny (użytkownik nie może go zamknąć),
 * pokazuje spinner, progress messages i opcjonalnie progress bar. Obsługuje stany: loading, error, timeout.
 */
export function LoadingModal({ isOpen, state, errorMessage, onRetry, onClose }: LoadingModalProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate progress messages every 5 seconds
  useEffect(() => {
    if (state !== "loading") return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [state]);

  // Animate progress bar
  useEffect(() => {
    if (state !== "loading") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Stop at 90% until complete
        return prev + 1;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [state]);

  // Reset progress when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentMessageIndex(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[500px]"
        showCloseButton={state !== "loading"}
        onPointerDownOutside={(e) => state === "loading" && e.preventDefault()}
        onEscapeKeyDown={(e) => state === "loading" && e.preventDefault()}
        data-testid="loading-modal"
      >
        {/* Loading State */}
        {state === "loading" && (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="loading-spinner" />
                <DialogTitle className="text-center">Generowanie planu treningowego</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <DialogDescription className="text-center text-base">
                {PROGRESS_MESSAGES[currentMessageIndex]}
              </DialogDescription>

              <Progress value={progress} className="w-full" />

              <DialogDescription className="text-center text-sm text-muted-foreground">
                Proszę czekać, nie zamykaj okna
              </DialogDescription>
            </div>
          </>
        )}

        {/* Error State */}
        {state === "error" && (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-center">Wystąpił błąd</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <DialogDescription className="text-center text-base">
                {errorMessage || "Wystąpił nieoczekiwany błąd podczas generowania planu. Spróbuj ponownie."}
              </DialogDescription>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                {onRetry && (
                  <Button onClick={onRetry} className="w-full sm:w-auto" data-testid="loading-error-retry">
                    Spróbuj ponownie
                  </Button>
                )}
                {onClose && (
                  <Button onClick={onClose} variant="outline" className="w-full sm:w-auto" data-testid="loading-error-close">
                    Zamknij
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Timeout State */}
        {state === "timeout" && (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <DialogTitle className="text-center">Przekroczono limit czasu</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <DialogDescription className="text-center text-base">
                Generowanie planu trwało zbyt długo. Spróbuj ponownie lub skontaktuj się z pomocą techniczną, jeśli
                problem się powtarza.
              </DialogDescription>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                {onRetry && (
                  <Button onClick={onRetry} className="w-full sm:w-auto" data-testid="loading-error-retry">
                    Spróbuj ponownie
                  </Button>
                )}
                {onClose && (
                  <Button onClick={onClose} variant="outline" className="w-full sm:w-auto" data-testid="loading-error-close">
                    Zamknij
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
