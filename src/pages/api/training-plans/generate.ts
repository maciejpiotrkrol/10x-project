/**
 * POST /api/training-plans/generate
 *
 * Generate a new 10-week training plan using AI. This endpoint:
 * 1. Updates user profile with new survey data
 * 2. Updates/creates personal records
 * 3. Deactivates current active plan (if exists)
 * 4. Generates new training plan via AI (OpenRouter)
 * 5. Creates 70 workout days
 * 6. Marks new plan as active
 *
 * Authentication: Required (JWT token)
 * Development Mode: Supports SKIP_AUTH=true for testing
 */

import type { APIContext } from "astro";
import { z } from "zod";
import { verifyAuth } from "@/lib/api/auth";
import { successResponse, errorResponse } from "@/lib/api/responses";
import { generateTrainingPlan } from "@/lib/services/ai.service";
import { createTrainingPlan } from "@/lib/services/training-plan.service";
import type { GenerateTrainingPlanCommand, TrainingPlanWithWorkoutsDTO } from "@/types";

// Disable static pre-rendering for this endpoint
export const prerender = false;

/**
 * Validation schema for training plan generation request
 */
const generateTrainingPlanSchema = z.object({
  profile: z.object({
    goal_distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"], {
      errorMap: () => ({ message: "Invalid goal distance. Must be one of: 5K, 10K, Half Marathon, Marathon" }),
    }),
    weekly_km: z
      .number({
        required_error: "weekly_km is required",
        invalid_type_error: "weekly_km must be a number",
      })
      .positive({ message: "Weekly km must be greater than 0" }),
    training_days_per_week: z
      .number({
        required_error: "training_days_per_week is required",
        invalid_type_error: "training_days_per_week must be a number",
      })
      .int({ message: "training_days_per_week must be an integer" })
      .min(2, { message: "Minimum 2 training days per week" })
      .max(7, { message: "Maximum 7 training days per week" }),
    age: z
      .number({
        required_error: "age is required",
        invalid_type_error: "age must be a number",
      })
      .int({ message: "age must be an integer" })
      .min(1, { message: "Age must be at least 1" })
      .max(119, { message: "Age must be less than 120" }),
    weight: z
      .number({
        required_error: "weight is required",
        invalid_type_error: "weight must be a number",
      })
      .positive({ message: "Weight must be greater than 0" })
      .max(300, { message: "Weight must be less than 300kg" }),
    height: z
      .number({
        required_error: "height is required",
        invalid_type_error: "height must be a number",
      })
      .int({ message: "height must be an integer" })
      .positive({ message: "Height must be greater than 0" })
      .max(300, { message: "Height must be less than 300cm" }),
    gender: z.enum(["M", "F"], {
      errorMap: () => ({ message: "Gender must be M or F" }),
    }),
  }),
  personal_records: z
    .array(
      z.object({
        distance: z.enum(["5K", "10K", "Half Marathon", "Marathon"], {
          errorMap: () => ({ message: "Invalid distance. Must be one of: 5K, 10K, Half Marathon, Marathon" }),
        }),
        time_seconds: z
          .number({
            required_error: "time_seconds is required",
            invalid_type_error: "time_seconds must be a number",
          })
          .int({ message: "time_seconds must be an integer" })
          .positive({ message: "time_seconds must be greater than 0" }),
      })
    )
    .min(1, { message: "At least one personal record is required" }),
});

/**
 * POST handler for training plan generation
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Step 1: Verify authentication
    const { user, error: authError } = await verifyAuth(context);
    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validationResult = generateTrainingPlanSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const details = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return errorResponse("Validation failed", 400, undefined, details);
    }

    const command: GenerateTrainingPlanCommand = validationResult.data;

    console.log(`[Training Plan Generation] Starting for user: ${user.id}`);
    console.log(
      `[Training Plan Generation] Goal: ${command.profile.goal_distance}, Days/week: ${command.profile.training_days_per_week}`
    );

    // Step 3: Generate training plan via AI
    let workoutDays;
    try {
      console.log("[Training Plan Generation] Calling AI service...");
      workoutDays = await generateTrainingPlan({
        ...command.profile,
        personal_records: command.personal_records,
      });
      console.log(`[Training Plan Generation] AI generated ${workoutDays.length} workout days`);
    } catch (aiError) {
      console.error("[Training Plan Generation] AI generation error:", aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError);
      if (errorMessage.includes("unavailable")) {
        return errorResponse("AI service temporarily unavailable. Please try again later.", 503);
      }
      if (errorMessage.includes("not configured")) {
        return errorResponse("AI service is not configured", 500);
      }
      return errorResponse("Failed to generate training plan", 500);
    }

    // Step 4: Create training plan in database
    let trainingPlan;
    try {
      console.log("[Training Plan Generation] Saving to database...");
      trainingPlan = await createTrainingPlan(context.locals.supabase, user.id, command, workoutDays);
      console.log(`[Training Plan Generation] Successfully created plan: ${trainingPlan.id}`);
    } catch (dbError) {
      console.error("[Training Plan Generation] Database error:", dbError);
      return errorResponse("Failed to save training plan to database", 500);
    }

    // Step 5: Return success response
    console.log(`[Training Plan Generation] Completed successfully for user: ${user.id}`);
    return successResponse<TrainingPlanWithWorkoutsDTO>(trainingPlan, 201);
  } catch (error) {
    console.error("[Training Plan Generation] Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
}
