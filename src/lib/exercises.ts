import { MuscleGroup } from '../types/workout';

interface ExerciseInfo {
  muscleGroup: MuscleGroup;
  category: 'upper' | 'lower' | 'core' | 'cardio';
  feminizationPriority: 'build' | 'maintain' | 'reduce';
}

// Exercise database with muscle group mappings and feminization priorities
export const exerciseDatabase: Record<string, ExerciseInfo> = {
  // Chest exercises - reduce priority for feminization
  'bench press': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'incline bench press': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'dumbbell incline bench press': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'decline bench press': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'dumbbell bench press': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'dumbbell floor press': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'floor press': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'dumbbell fly': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'cable fly': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'push up': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'pushup': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'push-up': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'chest press': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'pec deck': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'reduce' },
  'superband chest stretch': { muscleGroup: 'chest', category: 'upper', feminizationPriority: 'maintain' },

  // Shoulder exercises - reduce priority
  'shoulder press': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'overhead press': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'overhead push press': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'barbell overhead push press': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'military press': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'lateral raise': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'front raise': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  // Rear delts and face pulls drive posture — build these, unlike the rest of the shoulder.
  'rear delt fly': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'build' },
  'prone reverse fly': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'build' },
  'reverse fly': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'build' },
  'face pull': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'build' },
  'arnold press': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'upright row': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'shrug': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'barbell shrug': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'dumbbell shrug': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'reduce' },
  'shoulder tap': { muscleGroup: 'shoulders', category: 'upper', feminizationPriority: 'maintain' },

  // Back exercises - horizontal pulling is a build priority: upper back strength
  // drives posture, which affects torso shape more than arm size does.
  // Lats stay 'maintain' — heavily developed lats broaden the V-taper.
  'lat pulldown': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'maintain' },
  'pull up': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'maintain' },
  'pullup': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'maintain' },
  'pull-up': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'maintain' },
  'chin up': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'maintain' },
  'chin-up': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'maintain' },
  'row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  'bent over row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  'barbell bent over row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  'alternating dumbbell row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  'cable row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  'seated row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  'seated cable row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  'dumbbell row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  't-bar row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },
  'inverted row': { muscleGroup: 'back', category: 'upper', feminizationPriority: 'build' },

  // Bicep exercises - reduce priority
  'bicep curl': { muscleGroup: 'biceps', category: 'upper', feminizationPriority: 'reduce' },
  'curl': { muscleGroup: 'biceps', category: 'upper', feminizationPriority: 'reduce' },
  'hammer curl': { muscleGroup: 'biceps', category: 'upper', feminizationPriority: 'reduce' },
  'preacher curl': { muscleGroup: 'biceps', category: 'upper', feminizationPriority: 'reduce' },
  'concentration curl': { muscleGroup: 'biceps', category: 'upper', feminizationPriority: 'reduce' },
  'cable curl': { muscleGroup: 'biceps', category: 'upper', feminizationPriority: 'reduce' },

  // Tricep exercises - reduce priority
  'tricep extension': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'reduce' },
  'tricep pushdown': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'reduce' },
  'triceps stretch': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'maintain' },
  'superband triceps stretch': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'maintain' },
  'skull crusher': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'reduce' },
  'dip': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'reduce' },
  'dips': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'reduce' },
  'close grip bench press': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'reduce' },
  'overhead tricep extension': { muscleGroup: 'triceps', category: 'upper', feminizationPriority: 'reduce' },

  // Glute exercises - build priority for feminization
  'hip thrust': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'barbell hip thrust': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'glute bridge': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'frog pump': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'cable kickback': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'donkey kick': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'sumo squat': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'romanian deadlift': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'rdl': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'good morning': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'step up': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  // A deadlift is a lower-body hip hinge, not a back exercise. Miscategorising it
  // as 'upper' skewed the upper/lower volume split the whole app reports on.
  'deadlift': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },

  // Gluteus medius / hip abduction - highest-leverage muscle for hip width.
  // Target 6-9 sets per week across at least two days.
  'hip abduction': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'abduction': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'seated hip abduction': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'cable hip abduction': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'banded hip abduction': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'lateral leg raise': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'lateral leg lift': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'side lying leg raise': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'lateral band walk': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'monster walk': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'clamshell': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },
  'fire hydrant': { muscleGroup: 'glutes', category: 'lower', feminizationPriority: 'build' },

  // Quad exercises - build priority
  'squat': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  'back squat': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  'front squat': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  'goblet squat': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  'leg press': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  // Low priority: does not serve the shape goal, and tends to occupy a slot
  // that hip abduction work should have.
  'leg extension': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'maintain' },
  'lunge': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  'lunges': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  'walking lunge': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  'bulgarian split squat': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },
  'hack squat': { muscleGroup: 'quads', category: 'lower', feminizationPriority: 'build' },

  // Hamstring exercises - build priority
  'leg curl': { muscleGroup: 'hamstrings', category: 'lower', feminizationPriority: 'build' },
  'lying leg curl': { muscleGroup: 'hamstrings', category: 'lower', feminizationPriority: 'build' },
  'seated leg curl': { muscleGroup: 'hamstrings', category: 'lower', feminizationPriority: 'build' },
  'stiff leg deadlift': { muscleGroup: 'hamstrings', category: 'lower', feminizationPriority: 'build' },
  'nordic curl': { muscleGroup: 'hamstrings', category: 'lower', feminizationPriority: 'build' },

  // Calf exercises - low priority, same reasoning as leg extensions
  'calf raise': { muscleGroup: 'calves', category: 'lower', feminizationPriority: 'maintain' },
  'seated calf raise': { muscleGroup: 'calves', category: 'lower', feminizationPriority: 'maintain' },
  'standing calf raise': { muscleGroup: 'calves', category: 'lower', feminizationPriority: 'maintain' },

  // Core exercises - maintain for posture
  'plank': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  'crunch': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  'crunches': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  'sit up': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  'sit-up': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  'leg raise': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  'hanging leg raise': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  'mountain climber': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  'ab wheel': { muscleGroup: 'core', category: 'core', feminizationPriority: 'maintain' },
  // Anti-rotation and anti-extension: core strength without oblique width.
  'dead bug': { muscleGroup: 'core', category: 'core', feminizationPriority: 'build' },
  'bird dog': { muscleGroup: 'core', category: 'core', feminizationPriority: 'build' },
  'pallof press': { muscleGroup: 'core', category: 'core', feminizationPriority: 'build' },
  // Loaded rotation and side flexion: obliques hypertrophy like any muscle,
  // and thicker obliques widen the waist.
  'russian twist': { muscleGroup: 'core', category: 'core', feminizationPriority: 'reduce' },
  'side bend': { muscleGroup: 'core', category: 'core', feminizationPriority: 'reduce' },
  'oblique crunch': { muscleGroup: 'core', category: 'core', feminizationPriority: 'reduce' },
  'woodchopper': { muscleGroup: 'core', category: 'core', feminizationPriority: 'reduce' },
  'bicycle crunch': { muscleGroup: 'core', category: 'core', feminizationPriority: 'reduce' },

  // Cardio exercises
  'running': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'run': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'treadmill': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'cycling': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'bike': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'elliptical': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'stairmaster': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'rowing': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'jump rope': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'swimming': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'walking': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'hiit': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'bench jump overs': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'jump overs': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },
  'box jump': { muscleGroup: 'cardio', category: 'cardio', feminizationPriority: 'build' },

  // Forearm exercises - reduce priority
  'wrist curl': { muscleGroup: 'forearms', category: 'upper', feminizationPriority: 'reduce' },
  'reverse wrist curl': { muscleGroup: 'forearms', category: 'upper', feminizationPriority: 'reduce' },
  'farmer walk': { muscleGroup: 'forearms', category: 'upper', feminizationPriority: 'reduce' },
  'farmer carry': { muscleGroup: 'forearms', category: 'upper', feminizationPriority: 'reduce' },
};

export function getMuscleGroup(exerciseName: string): ExerciseInfo | null {
  const normalizedName = exerciseName.toLowerCase().trim();

  // Direct match
  if (exerciseDatabase[normalizedName]) {
    return exerciseDatabase[normalizedName];
  }

  // Partial match
  for (const [key, value] of Object.entries(exerciseDatabase)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  return null;
}

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  core: 'Core',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  cardio: 'Cardio',
};

export const categoryColors: Record<string, string> = {
  upper: '#ef4444', // red
  lower: '#22c55e', // green
  core: '#3b82f6', // blue
  cardio: '#f59e0b', // amber
};

export const muscleGroupColors: Record<MuscleGroup, string> = {
  chest: '#ef4444',
  back: '#f97316',
  shoulders: '#f59e0b',
  biceps: '#eab308',
  triceps: '#84cc16',
  forearms: '#22c55e',
  core: '#3b82f6',
  glutes: '#8b5cf6',
  quads: '#a855f7',
  hamstrings: '#d946ef',
  calves: '#ec4899',
  cardio: '#06b6d4',
};
