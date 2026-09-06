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
  generatedRoutines: GeneratedRoutine[];
  sessions: WorkoutSession[];
  measurements: BodyMeasurement[];
  measurementGoals?: MeasurementGoals;
  measurementSettings?: MeasurementSettings;
  lastUpdated: string;
}
