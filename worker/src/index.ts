interface Env {
  FEMFIT_KV: KVNamespace;
  /** Full EC P-256 private JWK as a JSON string (wrangler secret). */
  VAPID_JWK: string;
  /** Raw uncompressed public key, base64url — the same one the frontend ships. */
  VAPID_PUBLIC_KEY: string;
  /** mailto: address, required by the VAPID spec. */
  VAPID_SUBJECT: string;
  /** Shared secret guarding the manual /test trigger. */
  TEST_TOKEN: string;
}

const SUBS_KEY = 'femfit:push-subs';
const DATA_KEY = 'femfit:data';

interface StoredSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  hour: number;
  tzOffset: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// VAPID
// ---------------------------------------------------------------------------

function b64url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeVapidJwt(audience: string, env: Env): Promise<string> {
  const enc = new TextEncoder();
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.VAPID_SUBJECT,
  };

  const unsigned =
    b64url(enc.encode(JSON.stringify(header))) +
    '.' +
    b64url(enc.encode(JSON.stringify(payload)));

  const key = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(env.VAPID_JWK),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Web Crypto returns the raw r||s pair, which is exactly what JWS ES256 wants.
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(unsigned)
  );

  return `${unsigned}.${b64url(sig)}`;
}

/**
 * Sends a payload-less push. The notification copy lives in the service
 * worker, which sidesteps the aes128gcm payload encryption entirely.
 */
async function sendPush(sub: StoredSub, env: Env): Promise<number> {
  const audience = new URL(sub.endpoint).origin;
  const jwt = await makeVapidJwt(audience, env);

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      TTL: '86400',
      Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
      'Content-Length': '0',
    },
  });
  return res.status;
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

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

/** YYYY-MM-DD for "now" shifted into the subscriber's local timezone. */
function localDateKey(tzOffsetMinutes: number, now = Date.now()): string {
  const shifted = new Date(now - tzOffsetMinutes * 60_000);
  return shifted.toISOString().slice(0, 10);
}

function localHour(tzOffsetMinutes: number, now = Date.now()): number {
  return new Date(now - tzOffsetMinutes * 60_000).getUTCHours();
}

/** Measurements are written at UTC midnight of the user's local date. */
async function hasWeightOn(dateKey: string, env: Env): Promise<boolean> {
  const raw = await env.FEMFIT_KV.get(DATA_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as {
      measurements?: Array<{ date?: string; weight?: number }>;
    };
    return (data.measurements || []).some(
      (m) => m.weight !== undefined && typeof m.date === 'string' && m.date.slice(0, 10) === dateKey
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

async function runReminders(env: Env, force = false): Promise<string> {
  const subs = await readSubs(env);
  if (subs.length === 0) return 'no subscriptions';

  const log: string[] = [];
  const dead = new Set<string>();

  for (const sub of subs) {
    const hourNow = localHour(sub.tzOffset);
    if (!force && hourNow !== sub.hour) continue;

    const dateKey = localDateKey(sub.tzOffset);
    if (!force && (await hasWeightOn(dateKey, env))) {
      log.push(`skip (already logged ${dateKey})`);
      continue;
    }

    try {
      const status = await sendPush(sub, env);
      log.push(`sent → ${status}`);
      // 404/410 mean the browser dropped the subscription for good.
      if (status === 404 || status === 410) dead.add(sub.endpoint);
    } catch (e) {
      log.push(`error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (dead.size > 0) {
    const alive = subs.filter((s) => !dead.has(s.endpoint));
    await env.FEMFIT_KV.put(SUBS_KEY, JSON.stringify(alive));
    log.push(`pruned ${dead.size} dead subscription(s)`);
  }

  return log.length ? log.join('; ') : 'nothing due this hour';
}

// ---------------------------------------------------------------------------
// Backups
// ---------------------------------------------------------------------------

const BACKUP_CRON = '30 4 * * *';
const BACKUP_PREFIX = 'femfit:backup:';
// One extra hour past 14 days so the 14th-oldest snapshot is still present
// when the next one lands.
const BACKUP_TTL_SECONDS = 14 * 86_400 + 3_600;

interface BackupMeta {
  bytes: number;
  measurements: number;
  nutrition: number;
  sessions: number;
  routines: number;
  takenAt: string;
}

/**
 * Snapshots the whole record under a dated key. Each day is a separate key
 * expiring on its own, so a snapshot of already-wiped data can never replace
 * an earlier good one — the failure that made the intake loss hard to undo.
 * Counts ride in KV metadata so listing shows them without fetching values.
 */
async function runBackup(env: Env): Promise<string> {
  const raw = await env.FEMFIT_KV.get(DATA_KEY);
  if (!raw) return 'no data to back up';

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Still worth keeping: an unparseable blob is exactly what you would want
    // a copy of. Stored under a distinct key so it never shadows a good one.
    const key = `${BACKUP_PREFIX}${new Date().toISOString().slice(0, 10)}-unparseable`;
    await env.FEMFIT_KV.put(key, raw, { expirationTtl: BACKUP_TTL_SECONDS });
    return `stored unparseable blob as ${key}`;
  }

  const count = (k: string) => (Array.isArray(parsed[k]) ? (parsed[k] as unknown[]).length : 0);
  const metadata: BackupMeta = {
    bytes: new TextEncoder().encode(raw).length,
    measurements: count('measurements'),
    nutrition: count('nutrition'),
    sessions: count('sessions'),
    routines: count('generatedRoutines'),
    takenAt: new Date().toISOString(),
  };

  const key = `${BACKUP_PREFIX}${new Date().toISOString().slice(0, 10)}`;
  await env.FEMFIT_KV.put(key, raw, { expirationTtl: BACKUP_TTL_SECONDS, metadata });
  return `${key}: ${metadata.measurements} measurements, ${metadata.nutrition} nutrition, ${metadata.sessions} sessions (${metadata.bytes} bytes)`;
}

async function listBackups(env: Env): Promise<string> {
  const { keys } = await env.FEMFIT_KV.list<BackupMeta>({ prefix: BACKUP_PREFIX });
  if (keys.length === 0) return 'no backups yet';
  return keys
    .sort((a, b) => b.name.localeCompare(a.name))
    .map((k) => {
      const m = k.metadata;
      const counts = m ? `m=${m.measurements} n=${m.nutrition} s=${m.sessions} ${m.bytes}B` : '(no metadata)';
      const expires = k.expiration ? new Date(k.expiration * 1000).toISOString().slice(0, 10) : '?';
      return `${k.name}  ${counts}  expires ${expires}`;
    })
    .join('\n');
}

export default {
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (event.cron === BACKUP_CRON) {
      ctx.waitUntil(runBackup(env).then((r) => console.log('[backup]', r)));
      return;
    }
    ctx.waitUntil(
      runReminders(env).then((r) => console.log('[reminders]', r))
    );
  },

  // Token-guarded manual triggers:
  //   /test?token=…&force=1   send reminders now
  //   /backup?token=…         take a snapshot now
  //   /backups?token=…        list snapshots
  // Restore is deliberately not exposed here — it is a destructive write and
  // stays a wrangler CLI operation.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const routes = ['/test', '/backup', '/backups'];
    if (!routes.includes(url.pathname)) return new Response('not found', { status: 404 });
    if (!env.TEST_TOKEN || url.searchParams.get('token') !== env.TEST_TOKEN) {
      return new Response('unauthorized', { status: 401 });
    }
    const text =
      url.pathname === '/backup'
        ? await runBackup(env)
        : url.pathname === '/backups'
          ? await listBackups(env)
          : await runReminders(env, url.searchParams.get('force') === '1');
    return new Response(text, { headers: { 'Content-Type': 'text/plain' } });
  },
};
