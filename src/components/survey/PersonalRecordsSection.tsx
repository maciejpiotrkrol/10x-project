import { useFormContext, useFieldArray } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { SurveyFormData } from "./types";

/**
 * Sekcja formularza umożliwiająca użytkownikowi dodanie jednego lub więcej rekordów życiowych.
 * Każdy rekord składa się z dystansu i czasu w sekundach.
 * Minimum 1 rekord jest wymagany.
 */
export function PersonalRecordsSection() {
  const form = useFormContext<SurveyFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "personal_records",
  });

  const handleAddRecord = () => {
    append({
      id: crypto.randomUUID(),
      distance: "",
      time_seconds: "",
    });
  };

  const handleRemoveRecord = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rekordy życiowe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormDescription>
          Dodaj co najmniej jeden rekord życiowy. Pomoże to AI lepiej dostosować plan treningowy.
        </FormDescription>

        {/* Dynamic list of personal records */}
        <div className="space-y-6">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-4 p-4 border rounded-lg relative"
            >
              {/* Distance Field */}
              <FormField
                control={form.control}
                name={`personal_records.${index}.distance`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dystans</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Seconds Field */}
              <FormField
                control={form.control}
                name={`personal_records.${index}.time_seconds`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Czas</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="1"
                          {...field}
                          className="pr-20"
                        />
                      </FormControl>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        sekund
                      </span>
                    </div>
                    <FormDescription>
                      Najlepszy czas na tym dystansie w sekundach
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remove Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemoveRecord(index)}
                disabled={fields.length === 1}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń rekord
              </Button>
            </div>
          ))}
        </div>

        {/* Add Record Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddRecord}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj kolejny rekord
        </Button>

        {/* Array-level error message */}
        {form.formState.errors.personal_records?.root && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.personal_records.root.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
