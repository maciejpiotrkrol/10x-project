import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SurveyFormData } from "./types";

/**
 * Sekcja formularza zawierająca disclaimer prawny i checkbox akceptacji.
 * Użytkownik musi zaakceptować disclaimer przed wygenerowaniem planu.
 */
export function DisclaimerSection() {
  const form = useFormContext<SurveyFormData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje prawne</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disclaimer Text */}
        <ScrollArea className="h-[200px] w-full rounded-md border p-4" data-testid="disclaimer-text">
          <div className="text-sm text-muted-foreground space-y-3">
            <p>Przed rozpoczęciem jakiejkolwiek aktywności fizycznej zalecamy konsultację z lekarzem.</p>
            <p>
              Plany treningowe generowane przez aplikację Athletica mają charakter wyłącznie informacyjny i nie stanowią
              porady medycznej. Korzystanie z aplikacji i wykonywanie treningów odbywa się na własną odpowiedzialność
              użytkownika.
            </p>
            <p>
              Athletica nie ponosi odpowiedzialności za jakiekolwiek kontuzje, urazy lub inne problemy zdrowotne
              wynikające z użytkowania aplikacji.
            </p>
            <p>
              Jeśli podczas treningów odczuwasz ból, dyskomfort lub inne niepokojące objawy, natychmiast przerwij
              ćwiczenia i skonsultuj się z lekarzem.
            </p>
            <p>
              Plan treningowy powinien być dostosowany do Twojego aktualnego poziomu sprawności fizycznej. Jeśli masz
              jakiekolwiek wątpliwości co do swojej kondycji zdrowotnej, przed rozpoczęciem treningów skonsultuj się z
              lekarzem lub specjalistą medycyny sportowej.
            </p>
          </div>
        </ScrollArea>

        {/* Acceptance Checkbox */}
        <FormField
          control={form.control}
          name="disclaimer_accepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="disclaimer-checkbox" />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  Akceptuję powyższe warunki i oświadczam, że jestem świadomy/a ryzyka związanego z aktywnością fizyczną
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
