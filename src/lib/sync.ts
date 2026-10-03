import { DayTombstones } from '../types/workout';
import { localDateKey } from './dates';

/**
 * Merge rules for day-keyed records (measurements, nutrition) written by more
 * than one device into a single KV blob.
 *
 * - The newer `updatedAt` wins a day. Legacy records without one count as
 *   oldest, and an exact tie goes to the local side.
 * - A tombstone hides every version of its day written before the deletion,
 *   so a device still holding a deleted day cannot write it back. Logging the
 *   day again afterwards produces a newer record, which the tombstone leaves
 *   alone.
 */

type DayRecord = { date: Date | string; updatedAt?: string };

/**
 * Past this a tombstone is dropped. A device left closed for longer than this,
 * still holding a deleted day, could bring that day back — a trade for not
 * growing the blob forever.
 */
export const TOMBSTONE_RETENTION_DAYS = 90;

function stamp(r: DayRecord): number {
  const t = r.updatedAt ? Date.parse(r.updatedAt) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/** Union of two tombstone sets, keeping the latest deletion per day. */
export function mergeTombstones(
  a: DayTombstones = {},
  b: DayTombstones = {},
  now: number = Date.now()
): DayTombstones {
  const out: DayTombstones = {};
  for (const src of [a, b]) {
    for (const [day, at] of Object.entries(src)) {
      if (!out[day] || Date.parse(at) > Date.parse(out[day])) out[day] = at;
    }
  }
  const cutoff = now - TOMBSTONE_RETENTION_DAYS * 86_400_000;
  for (const [day, at] of Object.entries(out)) {
    if (!(Date.parse(at) >= cutoff)) delete out[day];
  }
  return out;
}

/** Drops records whose day was deleted after they were last written. */
export function applyTombstones<T extends DayRecord>(records: T[], tombs: DayTombstones = {}): T[] {
  return records.filter((r) => {
    const deletedAt = tombs[localDateKey(r.date)];
    return !deletedAt || stamp(r) > Date.parse(deletedAt);
  });
}

export function mergeByDay<T extends DayRecord>(
  remote: T[],
  local: T[],
  tombs: DayTombstones = {}
): T[] {
  const byDay = new Map<string, T>();
  for (const r of remote) byDay.set(localDateKey(r.date), r);
  for (const l of local) {
    const key = localDateKey(l.date);
    const existing = byDay.get(key);
    if (!existing || stamp(l) >= stamp(existing)) byDay.set(key, l);
  }
  return applyTombstones([...byDay.values()], tombs).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
