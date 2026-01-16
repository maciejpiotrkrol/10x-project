import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/types/component-props";

/**
 * EmptyState component - displayed when user has no active training plan
 * Shows a message and CTA button to generate a new plan
 */
export default function EmptyState({ variant: _variant }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-lg sm:text-xl">
            Nie masz aktywnego planu treningowego
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Wygeneruj swój pierwszy plan treningowy, aby rozpocząć.
          </p>
          <Button asChild className="min-h-[44px] w-full sm:w-auto">
            <a href="/survey">Wygeneruj plan</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
