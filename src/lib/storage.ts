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

export async function loadWorkoutData(): Promise<StoredWorkoutData> {
  try {
    const res = await fetch(KV_API);
    if (!res.ok) return { ...EMPTY };
    const json = await res.json() as Record<string, unknown>;
    return deserialize(json);
  } catch {
    return { ...EMPTY };
  }
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
