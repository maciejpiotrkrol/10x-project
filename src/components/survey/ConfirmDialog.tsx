import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when user confirms the action */
  onConfirm: () => void;
  /** Callback when user cancels or closes the dialog */
  onCancel: () => void;
}

/**
 * Dialog potwierdzenia wyświetlany gdy użytkownik ma już aktywny plan treningowy
 * i próbuje wygenerować nowy. Informuje że nowy plan nadpisze obecny i wymaga
 * potwierdzenia akcji.
 */
export function ConfirmDialog({ isOpen, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Nadpisanie planu treningowego</DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base leading-relaxed pt-2">
          Masz już aktywny plan treningowy. Wygenerowanie nowego planu spowoduje nadpisanie obecnego.{" "}
          <strong>Wszystkie dane dotyczące postępów w obecnym planie zostaną utracone.</strong>
        </DialogDescription>

        <DialogDescription className="text-base pt-2">Czy na pewno chcesz kontynuować?</DialogDescription>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Tak, wygeneruj nowy plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
