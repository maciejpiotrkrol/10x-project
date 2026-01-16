import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/types/component-props";

// Default content for each variant
const DEFAULTS = {
  "no-plan": {
    title: "Nie masz aktywnego planu treningowego",
    message: "Wygeneruj swój pierwszy plan treningowy, aby rozpocząć.",
    ctaText: "Wygeneruj plan",
    ctaLink: "/survey",
  },
  "no-profile": {
    title: "Brak profilu użytkownika",
    message: "Uzupełnij ankietę, aby rozpocząć.",
    ctaText: "Wypełnij ankietę",
    ctaLink: "/survey",
  },
};

/**
 * EmptyState component - displayed when user has no data
 * Supports multiple variants: no-plan, no-profile
 * Shows a message and CTA button with customizable text and links
 */
export default function EmptyState({ variant, message, ctaText, ctaLink }: EmptyStateProps) {
  const defaults = DEFAULTS[variant];
  const finalMessage = message ?? defaults.message;
  const finalCtaText = ctaText ?? defaults.ctaText;
  const finalCtaLink = ctaLink ?? defaults.ctaLink;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-lg sm:text-xl">{defaults.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">{finalMessage}</p>
          <Button asChild className="min-h-[44px] w-full sm:w-auto">
            <a href={finalCtaLink}>{finalCtaText}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
