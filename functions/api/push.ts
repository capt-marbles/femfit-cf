interface Env {
  FEMFIT_KV: KVNamespace;
}

const SUBS_KEY = 'femfit:push-subs';

export interface StoredSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  /** Local hour (0-23) the reminder should fire. */
  hour: number;
  /** Date.getTimezoneOffset() in minutes: UTC = local + offset. */
  tzOffset: number;
  updatedAt: string;
}

async function readSubs(env: Env): Promise<StoredSub[]> {
  const raw = await env.FEMFIT_KV.get(SUBS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSubs(env: Env, subs: StoredSub[]) {
  await env.FEMFIT_KV.put(SUBS_KEY, JSON.stringify(subs));
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const subs = await readSubs(env);
  // Never hand the raw keys back to the client; it only needs to know
  // whether a reminder is set and when.
  return Response.json({
    count: subs.length,
    reminders: subs.map((s) => ({ hour: s.hour, endpoint: s.endpoint })),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json()) as {
    subscription?: { endpoint?: string; keys?: { p256dh: string; auth: string } };
    hour?: number;
    tzOffset?: number;
  };

  const endpoint = body.subscription?.endpoint;
  const keys = body.subscription?.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: 'invalid subscription' }, { status: 400 });
  }

  const hour = Number.isInteger(body.hour) ? Math.min(23, Math.max(0, body.hour!)) : 8;
  const tzOffset = Number.isFinite(body.tzOffset) ? body.tzOffset! : 0;

  const subs = await readSubs(env);
  const next = subs.filter((s) => s.endpoint !== endpoint);
  next.push({ endpoint, keys, hour, tzOffset, updatedAt: new Date().toISOString() });
  await writeSubs(env, next);

  return Response.json({ ok: true, hour });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
  const subs = await readSubs(env);
  const next = body.endpoint ? subs.filter((s) => s.endpoint !== body.endpoint) : [];
  await writeSubs(env, next);
  return Response.json({ ok: true });
};
