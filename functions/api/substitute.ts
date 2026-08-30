import { POLICY_SUMMARY } from '../_shared/feminization';

interface Env {
  AI: Ai;
}

const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { exerciseName, muscleGroup, equipment } = await request.json() as {
    exerciseName: string;
    muscleGroup: string;
    equipment?: string;
  };

  const prompt = `You are a strength coach programming for a trans feminine client seeking a more feminine physique. They want alternatives to "${exerciseName}" (targets: ${muscleGroup}).

${equipment ? `The user has access to: ${equipment}` : 'Consider all equipment options.'}

## Rules for the alternatives you suggest
${POLICY_SUMMARY}

Never suggest an exercise from the "avoid entirely" list. In feminizationNote, explain the actual mechanism — which muscle it develops and why that serves the goal. Never write "lighter weights to avoid bulk" or "toning"; that reasoning is false.

Provide 4-5 alternatives in JSON:
{"alternatives":[{"name":"Exercise Name","muscleGroup":"${muscleGroup}","equipment":["equipment"],"description":"Brief description","feminizationNote":"How this helps (optional)"}]}

Only respond with valid JSON. No markdown, no explanation.`;

  const response = await env.AI.run(MODEL, {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    stream: false,
  }) as { response: string };

  const content = response.response || '';

  try {
    const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return Response.json(JSON.parse(cleaned));
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return Response.json(JSON.parse(match[0]));
      } catch { /* fall through */ }
    }
    return Response.json({ error: 'Failed to parse response', raw: content }, { status: 500 });
  }
};
