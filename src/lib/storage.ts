import { StoredWorkoutData, GeneratedRoutine, WorkoutSession } from '../types/workout';

const KV_API = '/api/data';

const EMPTY: StoredWorkoutData = {
  program: null,
  workouts: [],
  stats: null,
  muscleData: [],
  generatedRoutines: [],
  sessions: [],
  measurements: [],
  lastUpdated: new Date().toISOString(),
};

function deserializeDates(data: StoredWorkoutData): StoredWorkoutData {
  return {
    ...data,
    program: data.program
      ? {
          ...data.program,
          createdAt: new Date(data.program.createdAt),
          updatedAt: new Date(data.program.updatedAt),
          days: data.program.days.map((d) => ({
            ...d,
            uploadedAt: new Date(d.uploadedAt),
            entries: d.entries.map((e) => ({ ...e, date: new Date(e.date) })),
          })),
        }
      : null,
    workouts: data.workouts.map((e) => ({ ...e, date: new Date(e.date) })),
    stats: data.stats
      ? {
          ...data.stats,
          dateRange: {
            start: new Date(data.stats.dateRange.start),
            end: new Date(data.stats.dateRange.end),
          },
        }
      : null,
    generatedRoutines: data.generatedRoutines.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt),
    })),
    sessions: (data.sessions || []).map((s) => ({
      ...s,
      date: new Date(s.date),
    })),
    measurements: (data.measurements || []).map((m) => ({
      ...m,
      date: new Date(m.date),
    })),
  };
}

export async function loadWorkoutData(): Promise<StoredWorkoutData> {
  try {
    const res = await fetch(KV_API);
    if (!res.ok) return { ...EMPTY };
    const json = await res.json() as StoredWorkoutData;
    return deserializeDates(json);
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
  const updated = [session, ...(data.sessions || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 200);
  await saveWorkoutData({ ...data, sessions: updated });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const data = await loadWorkoutData();
  await saveWorkoutData({
    ...data,
    sessions: (data.sessions || []).filter((s) => s.id !== sessionId),
  });
}
