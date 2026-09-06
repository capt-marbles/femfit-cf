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
} from '../types/workout';
import {
  saveWorkoutData,
  loadWorkoutData,
  clearWorkoutData,
  saveGeneratedRoutine,
  deleteGeneratedRoutine,
  saveSession as persistSession,
  deleteSession as removeSession,
} from '../lib/storage';

interface WorkoutContextType {
  generatedRoutines: GeneratedRoutine[];
  saveRoutine: (routine: GeneratedRoutine) => void;
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
          lastUpdated: new Date().toISOString(),
        }).then(() => {
          setLastUpdated(new Date());
          setHasStoredData(true);
        });
      });
    }, 1000);
  }, [measurements, measurementGoals, measurementSettings, isLoading]);

  const saveRoutine = useCallback((routine: GeneratedRoutine) => {
    setGeneratedRoutines((prev) => [routine, ...prev].slice(0, 10));
    saveGeneratedRoutine(routine).then(() => {
      setLastUpdated(new Date());
      setHasStoredData(true);
    });
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

  const addMeasurement = useCallback((measurement: BodyMeasurement) => {
    setMeasurements((prev) => [...prev, measurement].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const updateMeasurement = useCallback((id: string, updates: Partial<BodyMeasurement>) => {
    setMeasurements((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const deleteMeasurement = useCallback((id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const setMeasurementGoals = useCallback((goals: MeasurementGoals) => { setMeasurementGoalsState(goals); }, []);
  const setMeasurementSettings = useCallback((settings: MeasurementSettings) => { setMeasurementSettingsState(settings); }, []);

  const clearStoredData = useCallback(() => {
    setGeneratedRoutines([]); setSessions([]); setMeasurements([]);
    setMeasurementGoalsState(null); setMeasurementSettingsState({ unit: 'imperial' });
    setLastUpdated(null); setHasStoredData(false);
    clearWorkoutData();
  }, []);

  return (
    <WorkoutContext.Provider value={{
      generatedRoutines, saveRoutine, deleteRoutine,
      sessions, saveSession, deleteSession,
      measurements, measurementGoals, measurementSettings,
      addMeasurement, updateMeasurement, deleteMeasurement, setMeasurementGoals, setMeasurementSettings,
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
