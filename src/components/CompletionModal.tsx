import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CompletionModalProps } from "@/types/component-props";

/**
 * CompletionModal component - displayed when user completes their training plan
 * Shows congratulations message and option to generate a new plan
 */
export default function CompletionModal({ isOpen, onClose, onGenerateNewPlan }: CompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl sm:text-2xl">🎉 Gratulacje!</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base">
            Ukończyłeś swój 10-tygodniowy plan treningowy!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center">
          <Button variant="outline" onClick={onClose} className="min-h-[44px] w-full sm:w-auto">
            Zamknij
          </Button>
          <Button onClick={onGenerateNewPlan} className="min-h-[44px] w-full sm:w-auto">
            Wygeneruj nowy plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
