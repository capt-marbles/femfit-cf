/**
 * Proves a failed read cannot be mistaken for empty storage — the bug that let
 * one offline request wipe eleven days of intake.
 */
import { StorageUnavailableError, recordDeletion } from '../src/lib/storage';
import { mergeByDay, mergeTombstones, TOMBSTONE_RETENTION_DAYS } from '../src/lib/sync';

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

  // ---- tombstones -------------------------------------------------------
  const DAY = '2026-09-30';
  const at = (iso: string) => `${DAY}T${iso}.000Z`;
  const deleted = { [DAY]: at('15:00:00') };

  // The scenario from the review: phone deletes a day, desktop still holds it.
  const legacyStale = [{ date: at('12:00:00'), calories: 2130 }];
  check('stale legacy copy cannot resurrect a deleted day',
    mergeByDay([], legacyStale, deleted).length === 0);

  const editedBeforeDelete = [{ date: at('12:00:00'), calories: 2130, updatedAt: at('14:00:00') }];
  check('copy edited before the deletion cannot resurrect it',
    mergeByDay([], editedBeforeDelete, deleted).length === 0);

  const reLogged = [{ date: at('12:00:00'), calories: 2000, updatedAt: at('16:00:00') }];
  check('re-logging the day after deleting it survives',
    mergeByDay([], reLogged, deleted).length === 1);

  // A stale device must not revert an edit another device made.
  const remoteNewer = [{ date: at('12:00:00'), calories: 2200, updatedAt: at('10:00:00') }];
  const localOlder = [{ date: at('12:00:00'), calories: 2130, updatedAt: at('09:00:00') }];
  check('newer remote edit beats a stale local copy',
    (mergeByDay(remoteNewer, localOlder)[0] as any).calories === 2200);

  const tieRemote = [{ date: at('12:00:00'), calories: 1 }];
  const tieLocal = [{ date: at('12:00:00'), calories: 2 }];
  check('legacy tie still goes to local', (mergeByDay(tieRemote, tieLocal)[0] as any).calories === 2);

  const now = Date.parse('2026-10-03T00:00:00.000Z');
  const merged = mergeTombstones(
    { a: '2026-10-01T00:00:00.000Z', old: '2026-01-01T00:00:00.000Z' },
    { a: '2026-10-02T00:00:00.000Z' },
    now
  );
  check('tombstone merge keeps the later deletion', merged.a === '2026-10-02T00:00:00.000Z');
  check(`tombstones older than ${TOMBSTONE_RETENTION_DAYS} days are pruned`, !('old' in merged));

  // A client on a pre-tombstone build can still write a deleted day back into
  // the blob; reads must keep it hidden.
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({
      generatedRoutines: [], sessions: [], nutrition: [],
      measurements: [{ id: 'x', date: at('12:00:00'), weight: 205 }],
      tombstones: { measurements: deleted },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
  {
    const { loadWorkoutData } = await import('../src/lib/storage');
    const d = await loadWorkoutData();
    check('load hides a deleted day an old client wrote back', d.measurements.length === 0);
  }

  // recordDeletion must persist the tombstone and the removal in one write.
  let posted: any = null;
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    if (init?.method === 'POST') { posted = JSON.parse(String(init.body)); return new Response('{"ok":true}'); }
    return new Response(JSON.stringify({
      generatedRoutines: [], sessions: [],
      measurements: [{ id: 'x', date: at('12:00:00'), weight: 205 }],
      nutrition: [{ id: 'y', date: at('12:00:00'), calories: 2000 }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  await recordDeletion('measurements', DAY, at('15:00:00'));
  check('recordDeletion writes the tombstone', posted?.tombstones?.measurements?.[DAY] === at('15:00:00'));
  check('recordDeletion drops the day in the same write', posted?.measurements?.length === 0);
  check('recordDeletion leaves other collections alone', posted?.nutrition?.length === 1);
  globalThis.fetch = origFetch;

  console.log(failures ? `\n${failures} FAILED` : '\nall storage guards hold');
  process.exit(failures ? 1 : 0);
})();
