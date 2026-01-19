import { useFormContext } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyFormData } from "./types";

/**
 * Sekcja formularza zbierająca dane osobowe użytkownika: wiek, wagę, wzrost i płeć.
 * Dane te są wykorzystywane przez AI do personalizacji planu treningowego.
 */
export function PersonalDataSection() {
  const form = useFormContext<SurveyFormData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dane osobowe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Field */}
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wiek</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type="number" placeholder="0" min="1" max="119" step="1" {...field} className="pr-12" data-testid="age-input" />
                </FormControl>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">lat</span>
              </div>
              <FormDescription>Twój aktualny wiek</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Weight Field */}
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Waga</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type="number" placeholder="0" min="0" max="300" step="0.1" {...field} className="pr-12" data-testid="weight-input" />
                </FormControl>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
              </div>
              <FormDescription>Twoja aktualna waga</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Height Field */}
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wzrost</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type="number" placeholder="0" min="0" max="300" step="1" {...field} className="pr-12" data-testid="height-input" />
                </FormControl>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
              </div>
              <FormDescription>Twój wzrost</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender Field */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Płeć</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="M" data-testid="gender-male-radio" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Mężczyzna</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="F" data-testid="gender-female-radio" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Kobieta</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
