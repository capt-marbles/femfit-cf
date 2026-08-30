import { POLICY_SUMMARY } from '../_shared/feminization';

interface Env {
  AI: Ai;
  FEMFIT_KV: KVNamespace;
}

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { workouts, muscleData } = await request.json() as {
    workouts: Array<{ date: string; exercise: string; sets: number; reps: number; weight: number }>;
    muscleData: Array<{ label: string; volume: number; count: number }>;
  };

  if (!workouts?.length) {
    return Response.json({ error: 'No workout data provided' }, { status: 400 });
  }

  const workoutSummary = workouts
    .slice(-50)
    .map((w) => `${w.date.split('T')[0]}: ${w.exercise} - ${w.sets}x${w.reps} @ ${w.weight}lbs`)
    .join('\n');

  const muscleDistribution = muscleData
    .map((m) => `${m.label}: ${m.volume} total volume (${m.count} exercises)`)
    .join('\n');

  const uniqueDates = [...new Set(workouts.map((w) => w.date.split('T')[0]))];
  const totalDays = uniqueDates.length > 1
    ? Math.ceil((new Date(uniqueDates[uniqueDates.length - 1]).getTime() - new Date(uniqueDates[0]).getTime()) / 86400000) + 1
    : 1;
  const workoutsPerWeek = uniqueDates.length > 0 ? ((uniqueDates.length / totalDays) * 7).toFixed(1) : '0';
  const totalVolume = workouts.reduce((s, w) => s + w.sets * w.reps * w.weight, 0);

  const prompt = `You are a fitness coach specializing in workout programming for trans feminine individuals who want to develop a more feminine physique. Analyze the following workout data and provide specific, actionable recommendations.

## Goals for a Feminizing Physique:
Muscle size is controlled by weekly set volume and proximity to failure — NOT by how heavy the weight is. "Light weight, high reps to tone" is false. To keep a muscle small, give it fewer sets; never recommend lighter weight as a way to avoid size.

${POLICY_SUMMARY}

Cardio is for cardiovascular health and body composition. Do not describe it as a way to reduce muscle mass — lower body muscle is the goal.

## Current Workout History (Recent):
${workoutSummary}

## Current Muscle Group Distribution:
${muscleDistribution}

## Training Load Stats:
- Workout sessions: ${uniqueDates.length} sessions over ~${totalDays} days
- Frequency: ~${workoutsPerWeek} workouts/week
- Total volume: ${totalVolume.toLocaleString()} lbs

## Instructions:
Analyze this workout routine and provide:

1. **Summary Assessment** (2-3 sentences): Overall assessment of current routine alignment with feminization goals.
2. **Muscle Distribution Analysis**: Approximate percentages for upper body vs lower body vs core.
3. **Specific Recommendations** (3-5 bullet points): Changes to better align with feminization goals.
4. **Exercises to Add** (3-5 suggestions): Specific exercises for a more feminine physique.
5. **Exercises to Reduce or Eliminate** (3-5 suggestions): Exercises that may work against feminization goals.
6. **Posture Recommendations** (2-3 suggestions): Exercises or stretches to improve feminine posture.
7. **Recovery & Deload Recommendations**: Based on training frequency and volume.

Be specific, supportive, and practical. Reference the actual exercises in the data.`;

  const aiStream = await env.AI.run(MODEL, {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    stream: true,
  }) as unknown as ReadableStream;

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
