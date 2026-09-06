import {
  GeneratedRoutine,
  WorkoutSession,
  BodyMeasurement,
} from '../types/workout';
import { workingWeight } from './progression';
// The same patterns the generator's validator uses, so "what you logged" is
// scored against the same definitions as "what was programmed".
import {
  GLUTE_PATTERNS,
  ABDUCTION_PATTERNS,
  HAMSTRING_PATTERNS,
  PULL_PATTERNS,
  CORE_PATTERNS,
  THRUST_PATTERNS,
  HINGE_PATTERNS,
} from '../../functions/_shared/feminization';

// ---------------------------------------------------------------------------
// Routine + next session
// ---------------------------------------------------------------------------

function byDateDesc(a: { date: Date }, b: { date: Date }) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

/**
 * The routine the user is actually following: whichever one their most
 * recent session was logged against, falling back to the newest saved.
 */
export function getActiveRoutine(
  routines: GeneratedRoutine[],
  sessions: WorkoutSession[]
): GeneratedRoutine | null {
  if (routines.length === 0) return null;
  const latest = [...sessions].sort(byDateDesc)[0];
  if (latest?.routineId) {
    const match = routines.find((r) => r.id === latest.routineId);
    if (match) return match;
  }
  return routines[0];
}

export interface NextSession {
  dayIndex: number;
  dayName: string;
  focus: string;
  exerciseCount: number;
  lastSessionDate: Date | null;
  daysSinceLast: number | null;
}

/** The day after the last one logged for this routine, wrapping at the end. */
export function getNextSession(
  routine: GeneratedRoutine,
  sessions: WorkoutSession[]
): NextSession {
  const forRoutine = sessions.filter((s) => s.routineId === routine.id).sort(byDateDesc);
  const last = forRoutine[0] ?? null;

  let dayIndex = 0;
  if (last) {
    const lastIdx = routine.days.findIndex((d) => d.name === last.dayName);
    dayIndex = lastIdx === -1 ? 0 : (lastIdx + 1) % routine.days.length;
  }

  const day = routine.days[dayIndex];
  const lastSessionDate = last ? new Date(last.date) : null;
  const daysSinceLast = lastSessionDate
    ? Math.floor((Date.now() - lastSessionDate.getTime()) / 86_400_000)
    : null;

  return {
    dayIndex,
    dayName: day?.name ?? `Day ${dayIndex + 1}`,
    focus: day?.focus ?? '',
    exerciseCount: day?.exercises.length ?? 0,
    lastSessionDate,
    daysSinceLast,
  };
}

// ---------------------------------------------------------------------------
// This week
// ---------------------------------------------------------------------------

/** Monday 00:00 local time of the week containing `d`. */
export function startOfWeek(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const sinceMonday = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - sinceMonday);
  return x;
}

export function sessionsThisWeek(sessions: WorkoutSession[], now: Date = new Date()): WorkoutSession[] {
  const start = startOfWeek(now).getTime();
  return sessions.filter((s) => new Date(s.date).getTime() >= start);
}

/** Consecutive weeks (ending this week or last) with at least one session. */
export function weekStreak(sessions: WorkoutSession[], now: Date = new Date()): number {
  if (sessions.length === 0) return 0;
  const weekOf = (d: Date) => startOfWeek(d).getTime();
  const weeks = new Set(sessions.map((s) => weekOf(new Date(s.date))));

  let cursor = weekOf(now);
  // A streak may still be alive if this week is empty but last week wasn't.
  if (!weeks.has(cursor)) cursor -= 7 * 86_400_000;

  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= 7 * 86_400_000;
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Weekly set volume vs. the principles' targets
// ---------------------------------------------------------------------------

export interface VolumeBucket {
  key: string;
  label: string;
  sets: number;
  min: number;
  max: number;
  /** below | on | above */
  status: 'below' | 'on' | 'above';
}

const VOLUME_TARGETS: Array<{ key: string; label: string; pattern: RegExp; min: number; max: number; exclude?: RegExp }> = [
  { key: 'glute', label: 'Glute max', pattern: GLUTE_PATTERNS, min: 10, max: 16 },
  { key: 'abduction', label: 'Hip abduction', pattern: ABDUCTION_PATTERNS, min: 6, max: 9 },
  { key: 'hamstring', label: 'Hamstrings', pattern: HAMSTRING_PATTERNS, min: 6, max: 10 },
  { key: 'pull', label: 'Pulling', pattern: PULL_PATTERNS, min: 6, max: 9, exclude: /upright row/i },
  { key: 'core', label: 'Core', pattern: CORE_PATTERNS, min: 6, max: 9 },
];

/** Counts logged sets (not planned sets) against each priority target. */
export function weeklyVolume(sessions: WorkoutSession[]): VolumeBucket[] {
  return VOLUME_TARGETS.map(({ key, label, pattern, min, max, exclude }) => {
    let sets = 0;
    for (const s of sessions) {
      for (const ex of s.exercises) {
        if (!pattern.test(ex.name)) continue;
        if (exclude && exclude.test(ex.name)) continue;
        sets += ex.sets.length;
      }
    }
    const status: VolumeBucket['status'] = sets < min ? 'below' : sets > max ? 'above' : 'on';
    return { key, label, sets, min, max, status };
  });
}

// ---------------------------------------------------------------------------
// Key lift trends
// ---------------------------------------------------------------------------

export interface TrendPoint {
  date: string;
  weight: number;
  topReps: number;
}

export interface LiftTrend {
  name: string;
  points: TrendPoint[];
}

/**
 * One series for one exercise. A pattern can match several variants (hip
 * thrust AND single-leg hip thrust), and blending them into one line makes a
 * lighter variant look like a regression — so pick the most-logged name and
 * track only that.
 */
function trendFor(sessions: WorkoutSession[], pattern: RegExp): LiftTrend | null {
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const byName = new Map<string, { display: string; points: TrendPoint[] }>();
  for (const s of sorted) {
    for (const ex of s.exercises) {
      if (!pattern.test(ex.name) || ex.sets.length === 0) continue;
      const key = ex.name.trim().toLowerCase();
      const entry = byName.get(key) ?? { display: ex.name, points: [] };
      entry.points.push({
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: workingWeight(ex.sets.map((x) => x.weight)),
        topReps: Math.max(...ex.sets.map((x) => x.reps)),
      });
      byName.set(key, entry);
    }
  }
  if (byName.size === 0) return null;

  const best = [...byName.values()].sort((a, b) => b.points.length - a.points.length)[0];
  return { name: best.display, points: best.points };
}

/** Hip thrust and RDL — the two primary lifts the whole program is built on. */
export function keyLiftTrends(sessions: WorkoutSession[]): LiftTrend[] {
  return [trendFor(sessions, THRUST_PATTERNS), trendFor(sessions, HINGE_PATTERNS)].filter(
    (t): t is LiftTrend => t !== null
  );
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

export interface MeasurementSnapshot {
  latest: BodyMeasurement;
  earliest: BodyMeasurement;
  count: number;
  hips: { now?: number; delta?: number };
  waist: { now?: number; delta?: number };
  weight: { now?: number; delta?: number };
  /** waist ÷ hips — the ratio this whole goal moves. Lower is the direction. */
  whr: { now?: number; delta?: number };
}

function delta(a?: number, b?: number): number | undefined {
  return a !== undefined && b !== undefined ? +(a - b).toFixed(1) : undefined;
}

export function measurementSnapshot(measurements: BodyMeasurement[]): MeasurementSnapshot | null {
  if (measurements.length === 0) return null;
  const sorted = [...measurements].sort(byDateDesc);
  const latest = sorted[0];
  const earliest = sorted[sorted.length - 1];

  const whrOf = (m: BodyMeasurement) =>
    m.waist !== undefined && m.hips ? +(m.waist / m.hips).toFixed(3) : undefined;

  const whrNow = whrOf(latest);
  const whrThen = whrOf(earliest);

  return {
    latest,
    earliest,
    count: measurements.length,
    hips: { now: latest.hips, delta: delta(latest.hips, earliest.hips) },
    waist: { now: latest.waist, delta: delta(latest.waist, earliest.waist) },
    weight: { now: latest.weight, delta: delta(latest.weight, earliest.weight) },
    whr: {
      now: whrNow,
      delta: whrNow !== undefined && whrThen !== undefined ? +(whrNow - whrThen).toFixed(3) : undefined,
    },
  };
}
