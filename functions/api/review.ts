import { TRAINING_PRINCIPLES, validateRoutine } from '../_shared/feminization';

interface Env {
  AI: Ai;
}

const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

interface ReviewRequest {
  routine: {
    name?: string;
    description?: string;
    daysPerWeek?: number;
    experienceLevel?: string;
    equipment?: string[];
    days?: Array<{
      name?: string;
      focus?: string;
      exercises?: Array<{ name: string; muscleGroup?: string; sets?: number; reps?: string }>;
    }>;
    cardio?: { sessionsPerWeek?: number; totalMinutes?: string };
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { routine } = await request.json() as ReviewRequest;

  if (!routine?.days?.length) {
    return Response.json({ error: 'No routine provided to review' }, { status: 400 });
  }

  // Build a compact text summary of the routine for the reviewer
  const daySummaries = routine.days.map((day, i) => {
    const exercises = (day.exercises || [])
      .map((ex) => `  - ${ex.name} (${ex.muscleGroup || '?'}): ${ex.sets ?? '?'}x${ex.reps ?? '?'}`)
      .join('\n');
    return `Day ${i + 1}: ${day.name || 'Untitled'} — focus: ${day.focus || '?'}\n${exercises}`;
  }).join('\n\n');

  const cardioSummary = routine.cardio
    ? `Cardio: ${routine.cardio.sessionsPerWeek ?? '?'} sessions/week, ${routine.cardio.totalMinutes ?? '?'}`
    : 'Cardio: none specified';

  // Deterministic checks run first so the reviewer cannot miss them.
  const findings = validateRoutine(routine);
  const findingsText = findings.length
    ? findings.map((w) => `- [${w.severity.toUpperCase()}] ${w.message}`).join('\n')
    : '- None detected by automated checks.';

  const prompt = `You are a critical strength coach reviewing a workout program built for a trans feminine client seeking a more feminine physique. Your job is to REVIEW this routine, not rewrite it.

${TRAINING_PRINCIPLES}

## Automated checks already flagged these issues:
${findingsText}

Incorporate any of the above that are real into your review rather than repeating them verbatim, and add anything they missed.

## Routine Under Review:
Name: ${routine.name || 'Untitled'}
Description: ${routine.description || 'n/a'}
Days per week: ${routine.daysPerWeek ?? '?'} | Experience: ${routine.experienceLevel || '?'}
Equipment: ${(routine.equipment || []).join(', ') || 'n/a'}

${daySummaries}

${cardioSummary}

## Your Review — respond in this exact markdown structure:

## Overall Score
Give a score out of 10 for how well this routine serves the goal, with a one-sentence justification.

## Muscle Balance
Estimate the lower body vs upper body vs core split, and state the weekly set count for hip abduction specifically (target 6-9) and glutes (target 10-16).

## What Works
2-4 bullet points on the strongest aspects of this routine.

## Issues & Risks
2-4 bullet points on anything working against the goal, safety gaps, or imbalances. Be specific and reference actual exercises. Call out any loaded oblique work, any missing pulling work, and any exercise justified by "light weight to avoid bulk" reasoning.

## Suggested Changes
2-4 concrete, actionable adjustments (specific exercises to add, swap, or reduce), ordered by impact. Do NOT rewrite the whole plan.

Be direct and specific. Reference the actual exercises by name. A program the client actually runs for twelve weeks beats an optimized one they abandon in three — do not demand a full rebuild when two swaps would do.`;

  const aiStream = await env.AI.run(MODEL, {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1536,
    stream: true,
  }) as ReadableStream;

  // Transform Workers AI SSE stream → plain text stream
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const textStream = aiStream.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk);
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;
        try {
          const json = JSON.parse(trimmed.slice(6)) as { response?: string };
          if (json.response) controller.enqueue(encoder.encode(json.response));
        } catch { /* skip */ }
      }
    },
  }));

  return new Response(textStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
