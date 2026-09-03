import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  WorkoutEntry,
  ColumnMapping,
  ParsedData,
  MuscleGroupData,
  WorkoutStats,
  WorkoutProgram,
  WorkoutDay,
  GeneratedRoutine,
  WorkoutSession,
  BodyMeasurement,
  MeasurementGoals,
  MeasurementSettings,
} from '../types/workout';
import {
  convertToWorkoutEntries,
  combineWorkoutDays,
  ParsedFileData,
} from '../lib/parser';
import {
  calculateWorkoutStats,
  calculateMuscleGroupDistribution,
} from '../lib/analyzer';
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
  parsedData: ParsedData | null;
  setParsedData: (data: ParsedData | null) => void;
  workoutProgram: WorkoutProgram | null;
  workoutDays: WorkoutDay[];
  addWorkoutDay: (day: WorkoutDay) => void;
  removeWorkoutDay: (dayId: string) => void;
  clearWorkoutDays: () => void;
  columnMapping: ColumnMapping | null;
  setColumnMapping: (mapping: ColumnMapping) => void;
  workouts: WorkoutEntry[];
  setWorkouts: (workouts: WorkoutEntry[]) => void;
  stats: WorkoutStats | null;
  muscleData: MuscleGroupData[];
  aiAnalysis: string | null;
  setAiAnalysis: (analysis: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
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
  processData: (mapping: ColumnMapping) => void;
  processMultipleFiles: (days: WorkoutDay[]) => void;
  clearData: () => void;
  clearStoredData: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [muscleData, setMuscleData] = useState<MuscleGroupData[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedRoutines, setGeneratedRoutines] = useState<GeneratedRoutine[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [measurementGoals, setMeasurementGoalsState] = useState<MeasurementGoals | null>(null);
  const [measurementSettings, setMeasurementSettingsState] = useState<MeasurementSettings>({ unit: 'imperial' });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStoredData, setHasStoredData] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from KV on mount
  useEffect(() => {
    loadWorkoutData().then((storedData) => {
      if (storedData && (storedData.workouts.length > 0 || storedData.generatedRoutines.length > 0 || storedData.measurements.length > 0 || (storedData.sessions?.length ?? 0) > 0)) {
        setHasStoredData(true);
        if (storedData.program) {
          setWorkoutProgram(storedData.program);
          setWorkoutDays(storedData.program.days);
        }
        if (storedData.workouts.length > 0) setWorkouts(storedData.workouts);
        if (storedData.stats) setStats(storedData.stats);
        if (storedData.muscleData.length > 0) setMuscleData(storedData.muscleData);
        if (storedData.generatedRoutines.length > 0) setGeneratedRoutines(storedData.generatedRoutines);
        if (storedData.sessions?.length > 0) setSessions(storedData.sessions);
        if (storedData.measurements.length > 0) setMeasurements(storedData.measurements);
        if (storedData.measurementGoals) setMeasurementGoalsState(storedData.measurementGoals);
        if (storedData.measurementSettings) setMeasurementSettingsState(storedData.measurementSettings);
        if (storedData.lastUpdated) setLastUpdated(new Date(storedData.lastUpdated));
      }
      setIsLoading(false);
    });
  }, []);

  // Debounced save to KV
  const scheduleSave = useCallback((data: Parameters<typeof saveWorkoutData>[0]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveWorkoutData(data).then(() => {
        setLastUpdated(new Date());
        setHasStoredData(true);
      });
    }, 1000);
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

  const processData = useCallback(
    (mapping: ColumnMapping) => {
      if (!parsedData) return;
      const entries = convertToWorkoutEntries(parsedData.rows, mapping);
      setWorkouts(entries);
      setColumnMapping(mapping);
      const workoutStats = calculateWorkoutStats(entries);
      setStats(workoutStats);
      const muscleDistribution = calculateMuscleGroupDistribution(entries);
      setMuscleData(muscleDistribution);
      const programName = (parsedData as ParsedFileData).programName || 'Uploaded Workout';
      const now = new Date();
      const day: WorkoutDay = { id: `day-${now.getTime()}`, name: programName, fileName: 'uploaded-file', entries, uploadedAt: now };
      const program: WorkoutProgram = { id: `program-${now.getTime()}`, name: programName, days: [day], createdAt: now, updatedAt: now };
      setWorkoutProgram(program);
      setWorkoutDays([day]);
      scheduleSave({ program, workouts: entries, stats: workoutStats, muscleData: muscleDistribution, generatedRoutines, sessions, measurements, measurementGoals: measurementGoals || undefined, measurementSettings, lastUpdated: new Date().toISOString() });
    },
    [parsedData, generatedRoutines, sessions, measurements, measurementGoals, measurementSettings, scheduleSave]
  );

  const processMultipleFiles = useCallback((days: WorkoutDay[]) => {
    const allEntries = combineWorkoutDays(days);
    setWorkouts(allEntries);
    setWorkoutDays(days);
    const workoutStats = calculateWorkoutStats(allEntries);
    setStats(workoutStats);
    const muscleDistribution = calculateMuscleGroupDistribution(allEntries);
    setMuscleData(muscleDistribution);
    const now = new Date();
    const program: WorkoutProgram = { id: `program-${now.getTime()}`, name: `Training Program (${days.length} days)`, days, createdAt: now, updatedAt: now };
    setWorkoutProgram(program);
    scheduleSave({ program, workouts: allEntries, stats: workoutStats, muscleData: muscleDistribution, generatedRoutines, sessions, measurements, measurementGoals: measurementGoals || undefined, measurementSettings, lastUpdated: new Date().toISOString() });
  }, [generatedRoutines, sessions, measurements, measurementGoals, measurementSettings, scheduleSave]);

  const addWorkoutDay = useCallback((day: WorkoutDay) => {
    setWorkoutDays((prev) => {
      const updated = [...prev, day];
      const allEntries = combineWorkoutDays(updated);
      setWorkouts(allEntries);
      const workoutStats = calculateWorkoutStats(allEntries);
      setStats(workoutStats);
      const muscleDistribution = calculateMuscleGroupDistribution(allEntries);
      setMuscleData(muscleDistribution);
      const now = new Date();
      setWorkoutProgram((prevProgram) => ({
        id: prevProgram?.id || `program-${now.getTime()}`,
        name: prevProgram?.name || `Training Program (${updated.length} days)`,
        days: updated,
        createdAt: prevProgram?.createdAt || now,
        updatedAt: now,
      }));
      return updated;
    });
  }, []);

  const removeWorkoutDay = useCallback((dayId: string) => {
    setWorkoutDays((prev) => {
      const updated = prev.filter((d) => d.id !== dayId);
      if (updated.length === 0) { setWorkouts([]); setStats(null); setMuscleData([]); setWorkoutProgram(null); return []; }
      const allEntries = combineWorkoutDays(updated);
      setWorkouts(allEntries);
      setStats(calculateWorkoutStats(allEntries));
      setMuscleData(calculateMuscleGroupDistribution(allEntries));
      setWorkoutProgram((p) => p ? { ...p, days: updated, updatedAt: new Date() } : null);
      return updated;
    });
  }, []);

  const clearWorkoutDays = useCallback(() => {
    setWorkoutDays([]); setWorkouts([]); setStats(null); setMuscleData([]); setWorkoutProgram(null);
  }, []);

  const saveRoutine = useCallback((routine: GeneratedRoutine) => {
    setGeneratedRoutines((prev) => [routine, ...prev].slice(0, 10));
    saveGeneratedRoutine(routine);
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

  const clearData = useCallback(() => {
    setParsedData(null); setColumnMapping(null); setWorkouts([]); setWorkoutDays([]);
    setWorkoutProgram(null); setStats(null); setMuscleData([]); setAiAnalysis(null);
    setIsAnalyzing(false); setMeasurements([]); setMeasurementGoalsState(null);
    setMeasurementSettingsState({ unit: 'imperial' });
  }, []);

  const clearStoredData = useCallback(() => {
    clearData(); setGeneratedRoutines([]); setSessions([]); setLastUpdated(null); setHasStoredData(false);
    clearWorkoutData();
  }, [clearData]);

  return (
    <WorkoutContext.Provider value={{
      parsedData, setParsedData, workoutProgram, workoutDays, addWorkoutDay, removeWorkoutDay, clearWorkoutDays,
      columnMapping, setColumnMapping, workouts, setWorkouts, stats, muscleData, aiAnalysis, setAiAnalysis,
      isAnalyzing, setIsAnalyzing, generatedRoutines, saveRoutine, deleteRoutine, sessions, saveSession, deleteSession, measurements, measurementGoals,
      measurementSettings, addMeasurement, updateMeasurement, deleteMeasurement, setMeasurementGoals,
      setMeasurementSettings, lastUpdated, isLoading, hasStoredData, processData, processMultipleFiles,
      clearData, clearStoredData,
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
