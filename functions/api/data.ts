interface Env {
  FEMFIT_KV: KVNamespace;
}

const KV_KEY = 'femfit:data';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const value = await env.FEMFIT_KV.get(KV_KEY);
  if (!value) {
    return Response.json({
      generatedRoutines: [],
      sessions: [],
      measurements: [],
      lastUpdated: new Date().toISOString(),
    });
  }
  return new Response(value, {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  await env.FEMFIT_KV.put(KV_KEY, body);
  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ env }) => {
  await env.FEMFIT_KV.delete(KV_KEY);
  return Response.json({ ok: true });
};
