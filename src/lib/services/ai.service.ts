/**
 * AI Service - OpenRouter Integration
 *
 * Handles AI-powered training plan generation using OpenRouter API.
 * Uses native fetch API to call OpenRouter's chat completion endpoint.
 */

interface WorkoutDay {
  day_number: number;
  workout_description: string;
  is_rest_day: boolean;
}

interface GenerateTrainingPlanParams {
  goal_distance: string;
  weekly_km: number;
  training_days_per_week: number;
  age: number;
  weight: number;
  height: number;
  gender: string;
  personal_records: { distance: string; time_seconds: number }[];
}

/**
 * Generate a 10-week (70-day) training plan using OpenRouter AI
 *
 * @param params User profile and personal records
 * @returns Array of 70 workout days with descriptions
 * @throws Error if API key is missing, AI service is unavailable, or generation fails
 */
export async function generateTrainingPlan(params: GenerateTrainingPlanParams): Promise<WorkoutDay[]> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const prompt = buildPrompt(params);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://athletica.app",
      "X-Title": "Athletica Training Plans",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3.5-haiku",
      messages: [
        {
          role: "system",
          content:
            "You are an expert running coach creating personalized training plans. You MUST respond ONLY with valid JSON in the exact format requested. Do not ask questions, do not provide explanations, do not use markdown formatting. Output ONLY the JSON object.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    console.error(`OpenRouter API error: ${status}`, await response.text());

    if (status === 503 || status === 429) {
      throw new Error("AI service unavailable");
    }
    throw new Error(`AI service error: ${status}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid AI response format");
  }

  const content = data.choices[0].message.content;

  try {
    const parsedWorkouts = JSON.parse(content);

    if (!parsedWorkouts.workout_days || !Array.isArray(parsedWorkouts.workout_days)) {
      throw new Error("AI response missing workout_days array");
    }

    if (parsedWorkouts.workout_days.length !== 70) {
      throw new Error(`Expected 70 workout days, got ${parsedWorkouts.workout_days.length}`);
    }

    return parsedWorkouts.workout_days;
  } catch {
    console.error("Failed to parse AI response:", content);
    throw new Error("Failed to parse AI-generated training plan");
  }
}

/**
 * Build the prompt for AI training plan generation
 *
 * @param params User profile and personal records
 * @returns Formatted prompt string
 */
function buildPrompt(params: GenerateTrainingPlanParams): string {
  const restDaysPerWeek = 7 - params.training_days_per_week;

  // Convert personal records times to human-readable format for context
  const formattedPRs = params.personal_records
    .map((pr) => {
      const minutes = Math.floor(pr.time_seconds / 60);
      const seconds = pr.time_seconds % 60;
      return `${pr.distance}: ${minutes}:${seconds.toString().padStart(2, "0")}`;
    })
    .join(", ");

  return `Generate a 10-week (70-day) progressive running training plan in JSON format for a runner.

USER PROFILE:
- Goal: ${params.goal_distance}
- Current weekly volume: ${params.weekly_km} km
- Training days per week: ${params.training_days_per_week}
- Rest days per week: ${restDaysPerWeek}
- Age: ${params.age}, Weight: ${params.weight}kg, Height: ${params.height}cm, Gender: ${params.gender}
- Personal Records: ${formattedPRs}

REQUIREMENTS:
1. Create exactly 70 days (10 weeks = 70 days total)
2. Include ${restDaysPerWeek} rest days per week, distributed evenly throughout the week
3. Progressive training: start at or slightly below current volume, build gradually
4. Include variety: easy runs, intervals, tempo runs, long runs, recovery runs
5. Peak training volume in weeks 8-9, then taper in week 10
6. For rest days: use workout_description = "Odpoczynek" and is_rest_day = true
7. For training days: provide detailed workout description in Polish language and is_rest_day = false
8. Workout descriptions should include: duration or distance, pace/intensity, any specific workout structure
9. Consider the user's goal race distance when designing workouts
10. Consider the user's personal records to set appropriate training paces

EXAMPLE WORKOUT DESCRIPTIONS (in Polish):
- "Rozgrzewka 10 min, 5x1000m tempo 10K z 2 min odpoczynku, wychłodzenie 10 min"
- "Bieg długi 18 km w tempie rozmowy (5:30-6:00/km)"
- "Bieg regeneracyjny 8 km w bardzo łagodnym tempie"
- "Rozgrzewka 15 min, 3x3000m tempo maratońskie z 3 min przerwy, wychłodzenie 10 min"

CRITICAL INSTRUCTIONS:
1. You MUST output ONLY JSON - no markdown, no explanations, no questions
2. Start your response with { and end with }
3. Generate ALL 70 days immediately
4. Use this exact structure:

{
  "workout_days": [
    {"day_number": 1, "workout_description": "Bieg regeneracyjny 8 km w łagodnym tempie", "is_rest_day": false},
    {"day_number": 2, "workout_description": "Odpoczynek", "is_rest_day": true},
    ... (ALL 70 days)
  ]
}

Start generating the JSON NOW (no preamble, no questions):
`;
}
