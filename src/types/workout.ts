export interface WorkoutEntry {
  id: string;
  date: Date;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  muscleGroup?: MuscleGroup;
  notes?: string;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'cardio';

export interface MuscleGroupData {
  muscleGroup: MuscleGroup;
  label: string;
  volume: number;
  count: number;
  category: 'upper' | 'lower' | 'core' | 'cardio';
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  favoriteExercise: string;
  averageVolume: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface ColumnMapping {
  date: string | null;
  exercise: string | null;
  sets: string | null;
  reps: string | null;
  weight: string | null;
  notes?: string | null;
}

export interface ParsedData {
  headers: string[];
  rows: Record<string, unknown>[];
  suggestedMapping: ColumnMapping;
}

export interface AIAnalysis {
  summary: string;
  muscleDistribution: {
    upperBody: number;
    lowerBody: number;
    core: number;
  };
  recommendations: string[];
  exercisesToAdd: string[];
  exercisesToReduce: string[];
  postureRecommendations: string[];
}

export interface ExerciseSubstitute {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string[];
  description: string;
  feminizationNote?: string;
}

export interface WorkoutDay {
  id: string;
  name: string;
  fileName: string;
  entries: WorkoutEntry[];
  uploadedAt: Date;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  days: WorkoutDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedExercise {
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  feminizationNote?: string;
}

export interface StretchExercise {
  name: string;
  duration: string;
  targetArea: string;
  instructions: string;
}

export interface WarmupRoutine {
  duration: string;
  description: string;
  exercises: StretchExercise[];
}

export interface CooldownRoutine {
  duration: string;
  description: string;
  stretches: StretchExercise[];
}

export interface CardioSession {
  name: string;
  duration: string;
  intensity: string;
  notes?: string;
  feminizationNote?: string;
}

export interface WeeklyCardio {
  sessionsPerWeek: number;
  totalMinutes: string;
  sessions: CardioSession[];
  notes: string[];
}

export interface GeneratedWorkoutDay {
  name: string;
  focus: string;
  exercises: GeneratedExercise[];
  warmup?: string | WarmupRoutine;
  cooldown?: string | CooldownRoutine;
}

/** Deterministic check result from the generator (see functions/_shared/feminization.ts). */
export interface RoutineWarning {
  severity: 'high' | 'medium';
  message: string;
  exercise?: string;
  day?: string;
}

export interface GeneratedRoutine {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  days: GeneratedWorkoutDay[];
  cardio?: WeeklyCardio;
  generalNotes: string[];
  createdAt: Date;
}

// ---- Session logging & progression ----

export interface LoggedSet {
  weight: number;
  reps: number;
  rpe?: number;
}

export interface LoggedExercise {
  name: string;
  // Free-text muscle group as it comes from a generated routine (e.g. "glutes, hamstrings")
  muscleGroup?: string;
  targetSets: number;
  targetReps: string;
  sets: LoggedSet[];
}

export interface WorkoutSession {
  id: string;
  date: Date;
  routineId?: string;
  routineName?: string;
  dayName: string;
  exercises: LoggedExercise[];
  notes?: string;
}

export type ProgressionCategory = 'upper' | 'lower' | 'core' | 'cardio';

export type ProgressionAction =
  | 'increase-weight'
  | 'increase-reps'
  | 'hold'
  | 'deload'
  | 'maintain';

export interface ProgressionSuggestion {
  exercise: string;
  category: ProgressionCategory;
  lastWeight: number;
  lastReps: string;
  targetReps: string;
  action: ProgressionAction;
  suggestedWeight: number;
  suggestedReps: string;
  rationale: string;
  sessionsLogged: number;
}

export interface BodyMeasurement {
  id: string;
  date: Date;
  weight?: number;
  waist?: number;
  hips?: number;
  thighLeft?: number;
  thighRight?: number;
  bust?: number;
  notes?: string;
}

export interface MeasurementGoals {
  weight?: number;
  waist?: number;
  hips?: number;
  thigh?: number;
  bust?: number;
}

export interface MeasurementSettings {
  unit: 'imperial' | 'metric';
}

export interface StoredWorkoutData {
  program: WorkoutProgram | null;
  workouts: WorkoutEntry[];
  stats: WorkoutStats | null;
  muscleData: MuscleGroupData[];
  generatedRoutines: GeneratedRoutine[];
  sessions: WorkoutSession[];
  measurements: BodyMeasurement[];
  measurementGoals?: MeasurementGoals;
  measurementSettings?: MeasurementSettings;
  lastUpdated: string;
}
