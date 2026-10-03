import { localDateKey } from './dates';
import { StoredWorkoutData, GeneratedRoutine, WorkoutSession } from '../types/workout';

const KV_API = '/api/data';

const EMPTY: StoredWorkoutData = {
  generatedRoutines: [],
  sessions: [],
  measurements: [],
  nutrition: [],
  lastUpdated: new Date().toISOString(),
};

/**
 * Rebuilds Date objects from JSON and drops the upload-era fields (program,
 * workouts, stats, muscleData) that older KV blobs still carry, so the next
 * save writes a clean record.
 */
function deserialize(raw: Record<string, unknown>): StoredWorkoutData {
  const routines = Array.isArray(raw.generatedRoutines) ? raw.generatedRoutines : [];
  const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  const measurements = Array.isArray(raw.measurements) ? raw.measurements : [];
  const nutrition = Array.isArray(raw.nutrition) ? raw.nutrition : [];

  return {
    generatedRoutines: (routines as GeneratedRoutine[]).map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt),
    })),
    sessions: (sessions as WorkoutSession[]).map((s) => ({
      ...s,
      date: new Date(s.date),
    })),
    measurements: (measurements as StoredWorkoutData['measurements']).map((m) => ({
      ...m,
      date: new Date(m.date),
    })),
    nutrition: (nutrition as StoredWorkoutData['nutrition']).map((n) => ({
      ...n,
      date: new Date(n.date),
    })),
    nutritionTargets: raw.nutritionTargets as StoredWorkoutData['nutritionTargets'],
    measurementGoals: raw.measurementGoals as StoredWorkoutData['measurementGoals'],
    measurementSettings: raw.measurementSettings as StoredWorkoutData['measurementSettings'],
    lastUpdated: typeof raw.lastUpdated === 'string' ? raw.lastUpdated : EMPTY.lastUpdated,
  };
}

/** Thrown when storage could not be read. Distinct from storage being empty. */
export class StorageUnavailableError extends Error {
  constructor(reason: string) {
    super(`workout storage unavailable: ${reason}`);
    this.name = 'StorageUnavailableError';
  }
}

/**
 * Throws rather than returning EMPTY on failure. Returning empty data made a
 * read error indistinguishable from an empty account, and every read-modify-
 * write caller would then persist that emptiness over real records. Callers
 * that cannot read the current state must not write.
 */
export async function loadWorkoutData(): Promise<StoredWorkoutData> {
  let res: Response;
  try {
    res = await fetch(KV_API);
  } catch {
    throw new StorageUnavailableError('network');
  }
  if (!res.ok) throw new StorageUnavailableError(`http ${res.status}`);

  let json: Record<string, unknown>;
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new StorageUnavailableError('unparseable body');
  }

  // An error envelope carries no records; deserializing it would yield empty
  // arrays that look like a legitimately empty account.
  if (json && typeof json === 'object' && 'error' in json && !('measurements' in json)) {
    throw new StorageUnavailableError(String(json.error));
  }

  return deserialize(json);
}

export async function saveWorkoutData(data: StoredWorkoutData): Promise<void> {
  await fetch(KV_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, lastUpdated: new Date().toISOString() }),
  });
}

export async function clearWorkoutData(): Promise<void> {
  await fetch(KV_API, { method: 'DELETE' });
}

export async function updateGeneratedRoutine(routine: GeneratedRoutine): Promise<void> {
  const data = await loadWorkoutData();
  const updated = data.generatedRoutines.map((r) => (r.id === routine.id ? routine : r));
  await saveWorkoutData({ ...data, generatedRoutines: updated });
}

export async function saveGeneratedRoutine(routine: GeneratedRoutine): Promise<void> {
  const data = await loadWorkoutData();
  const updated = [routine, ...data.generatedRoutines].slice(0, 10);
  await saveWorkoutData({ ...data, generatedRoutines: updated });
}

export async function deleteGeneratedRoutine(routineId: string): Promise<void> {
  const data = await loadWorkoutData();
  await saveWorkoutData({
    ...data,
    generatedRoutines: data.generatedRoutines.filter((r) => r.id !== routineId),
  });
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const data = await loadWorkoutData();
  const updated = [session, ...data.sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 200);
  await saveWorkoutData({ ...data, sessions: updated });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const data = await loadWorkoutData();
  await saveWorkoutData({
    ...data,
    sessions: data.sessions.filter((s) => s.id !== sessionId),
  });
}

/**
 * Unions two day-keyed record sets. Local wins where both hold the same day,
 * but a day only the remote side knows about survives — so a client carrying
 * stale state cannot erase another device's entries merely by saving. Removal
 * therefore needs an explicit call rather than an absence.
 */
export function mergeByDay<T extends { date: Date | string }>(remote: T[], local: T[]): T[] {
  const byDay = new Map<string, T>();
  for (const r of remote) byDay.set(localDateKey(r.date), r);
  for (const l of local) byDay.set(localDateKey(l.date), l);
  return [...byDay.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function removeMeasurement(id: string): Promise<void> {
  const data = await loadWorkoutData();
  await saveWorkoutData({
    ...data,
    measurements: data.measurements.filter((m) => m.id !== id),
  });
}

export async function removeNutrition(id: string): Promise<void> {
  const data = await loadWorkoutData();
  await saveWorkoutData({
    ...data,
    nutrition: (data.nutrition || []).filter((n) => n.id !== id),
  });
}
