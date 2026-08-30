import {
  TRAINING_PRINCIPLES,
  PROGRESSION_RULE,
  applyProgramDefaults,
  validateRoutine,
} from '../_shared/feminization';

interface Env {
  AI: Ai;
}

const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

interface GenerationOptions {
  daysPerWeek: number;
  equipment: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  focusAreas?: string[];
  limitations?: string;
}

/** Beginners need fewer movements per session than the model tends to prescribe. */
function exercisesPerDay(level: GenerationOptions['experienceLevel']): string {
  if (level === 'beginner') return '4-5';
  if (level === 'intermediate') return '5-6';
  return '5-7';
}

/**
 * Splits the week so lower body dominates and the upper day is built around
 * pulling rather than arms.
 */
function daySplitGuidance(days: number): string {
  if (days <= 3) {
    return '2 lower body days (one glute/hamstring emphasis, one quad/glute emphasis) and 1 upper body day built around pulling.';
  }
  if (days === 4) {
    return '3 lower body days (glute/hamstring emphasis, quad emphasis, and one hip-abduction + posterior chain day) and 1 upper body day built around pulling. Fold core work into the lower body days.';
  }
  if (days === 5) {
    return '4 lower body days with rotating emphasis (glute/hamstring, quad, hip abduction, posterior chain) and 1 upper body day built around pulling.';
  }
  return '4-5 lower body days with rotating emphasis and 1-2 upper body days built around pulling. Keep total weekly sets per muscle within recoverable limits.';
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const options = await request.json() as GenerationOptions;

  const equipmentList = options.equipment.length > 0 ? options.equipment.join(', ') : 'bodyweight only';
  const focusAreasText = options.focusAreas?.length ? `Focus areas: ${options.focusAreas.join(', ')}` : '';
  const limitationsText = options.limitations ? `Physical limitations: ${options.limitations}` : '';

  const prompt = `You are an expert strength coach programming for a trans feminine client seeking a more feminine physique. Create a complete ${options.daysPerWeek}-day program.

Client Profile:
- Experience level: ${options.experienceLevel}
- Available equipment: ${equipmentList}
${focusAreasText}
${limitationsText}

${TRAINING_PRINCIPLES}

## Program structure
- Split: ${daySplitGuidance(options.daysPerWeek)}
- ${exercisesPerDay(options.experienceLevel)} main exercises per day.
- Every day gets a warmup (3-5 dynamic movements) and a cooldown (3-5 static stretches, hip-focused).
- Include a weekly cardio plan of 2-4 steady-state sessions.
- The upper body day must contain a row, a face pull or rear delt movement, and one horizontal press for shoulder balance. At most one arm exercise, and only after those.
- Hip abduction must appear on at least 2 different days.
- Core work must appear on at least 2 different days.
- Before finalising, check the whole week for redundancy: only one heavy hinge, never both a hip thrust and a glute bridge, no more than 2 bilateral quad movements in a day.

## Writing the feminizationNote field
Explain the actual mechanism — which muscle this specific movement develops and why that serves the goal. Never write "lighter weights to avoid bulk" or "toning"; that reasoning is false. If an exercise is included for posture or joint health rather than shape, say so plainly.
Every note must be different from every other note in the program. Repeating the same sentence across exercises means you are padding instead of reasoning — if two exercises genuinely share a rationale, one of them is redundant and should be replaced.

Respond ONLY with valid JSON matching this exact schema:
{
  "name": "string",
  "description": "string",
  "days": [
    {
      "name": "string",
      "focus": "string",
      "warmup": {
        "duration": "string",
        "description": "string",
        "exercises": [{ "name": "string", "duration": "string", "targetArea": "string", "instructions": "string" }]
      },
      "exercises": [
        { "name": "string", "muscleGroup": "string", "sets": 3, "reps": "6-10", "rest": "60-90 sec", "notes": "string", "feminizationNote": "string" }
      ],
      "cooldown": {
        "duration": "string",
        "description": "string",
        "stretches": [{ "name": "string", "duration": "string", "targetArea": "string", "instructions": "string" }]
      }
    }
  ],
  "cardio": {
    "sessionsPerWeek": 3,
    "totalMinutes": "string",
    "sessions": [{ "name": "string", "duration": "string", "intensity": "string", "notes": "string", "feminizationNote": "string" }],
    "notes": ["string"]
  },
  "generalNotes": ["string"]
}

One of the generalNotes must state this progression rule verbatim: "${PROGRESSION_RULE}"

Use only equipment: ${equipmentList}. Output JSON only, no markdown, no explanation.`;

  const response = await env.AI.run(MODEL, {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    stream: false,
  }) as { response: string };

  const content = response.response || '';

  const parse = (text: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  };

  const parsed = parse(content);
  if (!parsed) {
    return Response.json({ error: 'Failed to parse routine JSON', raw: content }, { status: 500 });
  }

  // The model does not reliably follow the full instruction list, so the
  // progression rule is injected and the result is checked independently.
  const routine = applyProgramDefaults(parsed as { generalNotes?: string[] });
  const warnings = validateRoutine(routine as Parameters<typeof validateRoutine>[0]);

  return Response.json({ routine, warnings });
};
