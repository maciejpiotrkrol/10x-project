import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyFormData } from "./types";

/**
 * Sekcja formularza odpowiedzialna za zbieranie informacji o celach treningowych użytkownika.
 * Zawiera pola: cel-dystans (select), średni tygodniowy kilometraż (input number)
 * oraz liczba dni treningowych w tygodniu (input number).
 */
export function TrainingGoalsSection() {
  const form = useFormContext<SurveyFormData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cele treningowe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Distance Field */}
        <FormField
          control={form.control}
          name="goal_distance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dystans docelowy</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz dystans" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="5K">5K</SelectItem>
                  <SelectItem value="10K">10K</SelectItem>
                  <SelectItem value="Half Marathon">Półmaraton</SelectItem>
                  <SelectItem value="Marathon">Maraton</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Wybierz dystans, do którego chcesz się przygotować
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Weekly KM Field */}
        <FormField
          control={form.control}
          name="weekly_km"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Średni tygodniowy kilometraż</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    step="0.1"
                    min="0"
                    {...field}
                    className="pr-12"
                  />
                </FormControl>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  km
                </span>
              </div>
              <FormDescription>
                Ile kilometrów przeciętnie biegasz tygodniowo?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Training Days Per Week Field */}
        <FormField
          control={form.control}
          name="training_days_per_week"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Liczba dni treningowych w tygodniu</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    min="2"
                    max="7"
                    step="1"
                    {...field}
                    className="pr-28"
                  />
                </FormControl>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  dni/tydzień
                </span>
              </div>
              <FormDescription>
                Ile dni w tygodniu możesz trenować? (2-7 dni)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
