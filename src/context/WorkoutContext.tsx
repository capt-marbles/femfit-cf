import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  GeneratedRoutine,
  WorkoutSession,
  BodyMeasurement,
  MeasurementGoals,
  MeasurementSettings,
  DailyNutrition,
  NutritionTargets,
} from '../types/workout';
import {
  saveWorkoutData,
  loadWorkoutData,
  clearWorkoutData,
  saveGeneratedRoutine, updateGeneratedRoutine,
  deleteGeneratedRoutine,
  saveSession as persistSession,
  deleteSession as removeSession,
} from '../lib/storage';
import { localDateKey } from '../lib/dates';

interface WorkoutContextType {
  generatedRoutines: GeneratedRoutine[];
  saveRoutine: (routine: GeneratedRoutine) => void;
  updateRoutine: (routine: GeneratedRoutine) => void;
  deleteRoutine: (routineId: string) => void;
  sessions: WorkoutSession[];
  saveSession: (session: WorkoutSession) => void;
  deleteSession: (sessionId: string) => void;
  measurements: BodyMeasurement[];
  measurementGoals: MeasurementGoals | null;
  measurementSettings: MeasurementSettings;
  addMeasurement: (measurement: BodyMeasurement) => void;
  updateMeasurement: (id: string, measurement: Partial<BodyMeasurement>) => void;
  deleteMeasurement: (id: string) => void;
  setMeasurementGoals: (goals: MeasurementGoals) => void;
  setMeasurementSettings: (settings: MeasurementSettings) => void;
  nutrition: DailyNutrition[];
  nutritionTargets: NutritionTargets | null;
  upsertNutrition: (entry: DailyNutrition) => void;
  deleteNutrition: (id: string) => void;
  setNutritionTargets: (targets: NutritionTargets) => void;
  lastUpdated: Date | null;
  isLoading: boolean;
  hasStoredData: boolean;
  clearStoredData: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [generatedRoutines, setGeneratedRoutines] = useState<GeneratedRoutine[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [measurementGoals, setMeasurementGoalsState] = useState<MeasurementGoals | null>(null);
  const [measurementSettings, setMeasurementSettingsState] = useState<MeasurementSettings>({ unit: 'imperial' });
  const [nutrition, setNutrition] = useState<DailyNutrition[]>([]);
  const [nutritionTargets, setNutritionTargetsState] = useState<NutritionTargets | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStoredData, setHasStoredData] = useState(false);

  // Load from KV on mount
  useEffect(() => {
    loadWorkoutData().then((stored) => {
      const any =
        stored.generatedRoutines.length > 0 ||
        stored.sessions.length > 0 ||
        stored.measurements.length > 0;
      if (any) {
        setHasStoredData(true);
        setGeneratedRoutines(stored.generatedRoutines);
        setSessions(stored.sessions);
        setMeasurements(stored.measurements);
        setNutrition(stored.nutrition || []);
        if (stored.nutritionTargets) setNutritionTargetsState(stored.nutritionTargets);
        if (stored.measurementGoals) setMeasurementGoalsState(stored.measurementGoals);
        if (stored.measurementSettings) setMeasurementSettingsState(stored.measurementSettings);
        if (stored.lastUpdated) setLastUpdated(new Date(stored.lastUpdated));
      }
      setIsLoading(false);
    });
  }, []);

  // Persist measurements, goals and settings whenever they change.
  // isLoading guard prevents a spurious save on the initial hydration pass.
  const measurementSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoading) return;
    if (measurementSaveTimerRef.current) clearTimeout(measurementSaveTimerRef.current);
    measurementSaveTimerRef.current = setTimeout(() => {
      loadWorkoutData().then((current) => {
        saveWorkoutData({
          ...current,
          measurements,
          measurementGoals: measurementGoals || undefined,
          measurementSettings,
          nutrition,
          nutritionTargets: nutritionTargets || undefined,
          lastUpdated: new Date().toISOString(),
        }).then(() => {
          setLastUpdated(new Date());
          setHasStoredData(true);
        });
      });
    }, 1000);
  }, [measurements, measurementGoals, measurementSettings, nutrition, nutritionTargets, isLoading]);

  const saveRoutine = useCallback((routine: GeneratedRoutine) => {
    setGeneratedRoutines((prev) => [routine, ...prev].slice(0, 10));
    saveGeneratedRoutine(routine).then(() => {
      setLastUpdated(new Date());
      setHasStoredData(true);
    });
  }, []);

  const updateRoutine = useCallback((routine: GeneratedRoutine) => {
    setGeneratedRoutines((prev) => prev.map((r) => (r.id === routine.id ? routine : r)));
    updateGeneratedRoutine(routine).then(() => setLastUpdated(new Date()));
  }, []);

  const deleteRoutine = useCallback((routineId: string) => {
    setGeneratedRoutines((prev) => prev.filter((r) => r.id !== routineId));
    deleteGeneratedRoutine(routineId);
  }, []);

  const saveSession = useCallback((session: WorkoutSession) => {
    setSessions((prev) => [session, ...prev]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 200));
    persistSession(session).then(() => {
      setLastUpdated(new Date());
      setHasStoredData(true);
    });
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    removeSession(sessionId);
  }, []);

  /**
   * Merges into the existing record for that day rather than appending. Logging
   * weight in the morning and a waist measurement later should land on one day,
   * and re-saving the same value should correct it rather than stack another
   * copy. Only fields that were actually supplied overwrite.
   */
  const addMeasurement = useCallback((measurement: BodyMeasurement) => {
    setMeasurements((prev) => {
      const key = localDateKey(measurement.date);
      const existing = prev.find((m) => localDateKey(m.date) === key);
      const supplied = Object.fromEntries(
        Object.entries(measurement).filter(
          ([k, v]) => v !== undefined && k !== 'id' && k !== 'date'
        )
      );
      const next = existing
        ? prev.map((m) => (m === existing ? { ...m, ...supplied } : m))
        : [...prev, measurement];
      return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }, []);

  const updateMeasurement = useCallback((id: string, updates: Partial<BodyMeasurement>) => {
    setMeasurements((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const deleteMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  /** One entry per day: re-saving a date replaces that day rather than stacking. */
  const upsertNutrition = useCallback((entry: DailyNutrition) => {
    const key = new Date(entry.date).toISOString().slice(0, 10);
    setNutrition((prev) =>
      [...prev.filter((n) => new Date(n.date).toISOString().slice(0, 10) !== key), entry]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  }, []);

  const deleteNutrition = useCallback((id: string) => {
    setNutrition((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const setNutritionTargets = useCallback((t: NutritionTargets) => {
    setNutritionTargetsState(t);
  }, []);

  const setMeasurementGoals = useCallback((goals: MeasurementGoals) => { setMeasurementGoalsState(goals); }, []);
  const setMeasurementSettings = useCallback((settings: MeasurementSettings) => { setMeasurementSettingsState(settings); }, []);

  const clearStoredData = useCallback(() => {
    setGeneratedRoutines([]); setSessions([]); setMeasurements([]);
    setNutrition([]); setNutritionTargetsState(null);
    setMeasurementGoalsState(null); setMeasurementSettingsState({ unit: 'imperial' });
    setLastUpdated(null); setHasStoredData(false);
    clearWorkoutData();
  }, []);

  return (
    <WorkoutContext.Provider value={{
      generatedRoutines, saveRoutine, updateRoutine, deleteRoutine,
      sessions, saveSession, deleteSession,
      measurements, measurementGoals, measurementSettings,
      addMeasurement, updateMeasurement, deleteMeasurement, setMeasurementGoals, setMeasurementSettings,
      nutrition, nutritionTargets, upsertNutrition, deleteNutrition, setNutritionTargets,
      lastUpdated, isLoading, hasStoredData, clearStoredData,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within a WorkoutProvider');
  return context;
}
