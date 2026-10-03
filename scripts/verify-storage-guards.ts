/**
 * Proves a failed read cannot be mistaken for empty storage — the bug that let
 * one offline request wipe eleven days of intake.
 */
import { StorageUnavailableError, mergeByDay } from '../src/lib/storage';

const origFetch = globalThis.fetch;
let failures = 0;
const check = (name: string, pass: boolean, detail = '') => {
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

async function expectThrow(name: string, impl: typeof fetch) {
  globalThis.fetch = impl;
  const { loadWorkoutData } = await import('../src/lib/storage');
  try {
    const d = await loadWorkoutData();
    check(name, false, `returned data instead of throwing (${d.measurements.length} measurements)`);
  } catch (e) {
    check(name, e instanceof StorageUnavailableError, (e as Error).message);
  }
}

(async () => {
  // The exact shape the old service worker produced: 200 with an error body.
  await expectThrow('200 + {error:offline} throws', (async () =>
    new Response(JSON.stringify({ error: 'offline' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch);

  await expectThrow('503 throws', (async () =>
    new Response(JSON.stringify({ error: 'offline' }), { status: 503 })) as typeof fetch);

  await expectThrow('network rejection throws', (async () => {
    throw new Error('down');
  }) as typeof fetch);

  // A genuinely empty account must still load cleanly, not throw.
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ generatedRoutines: [], sessions: [], measurements: [], nutrition: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
  {
    const { loadWorkoutData } = await import('../src/lib/storage');
    try {
      const d = await loadWorkoutData();
      check('genuinely empty account loads', d.measurements.length === 0);
    } catch (e) {
      check('genuinely empty account loads', false, (e as Error).message);
    }
  }

  globalThis.fetch = origFetch;

  // Merge must not let a stale client drop a day it never saw.
  const remote = [{ date: '2026-09-30T12:00:00.000Z', calories: 2130 }];
  const local: typeof remote = [];
  check('merge keeps remote-only day', mergeByDay(remote, local).length === 1);

  const newer = [{ date: '2026-09-30T12:00:00.000Z', calories: 9999 }];
  check('merge prefers local on conflict', (mergeByDay(remote, newer)[0] as any).calories === 9999);

  console.log(failures ? `\n${failures} FAILED` : '\nall storage guards hold');
  process.exit(failures ? 1 : 0);
})();
