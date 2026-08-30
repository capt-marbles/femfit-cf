import {
  WorkoutEntry,
  MuscleGroup,
  MuscleGroupData,
  WorkoutStats,
} from '../types/workout';
import { getMuscleGroup, muscleGroupLabels } from './exercises';

export function calculateWorkoutStats(workouts: WorkoutEntry[]): WorkoutStats {
  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      favoriteExercise: 'N/A',
      averageVolume: 0,
      dateRange: {
        start: new Date(),
        end: new Date(),
      },
    };
  }

  // Count unique workout dates
  const uniqueDates = new Set(
    workouts.map((w) => w.date.toISOString().split('T')[0])
  );

  // Calculate total volume
  const totalVolume = workouts.reduce(
    (sum, w) => sum + w.sets * w.reps * w.weight,
    0
  );

  // Find most frequent exercise
  const exerciseCounts: Record<string, number> = {};
  workouts.forEach((w) => {
    exerciseCounts[w.exercise] = (exerciseCounts[w.exercise] || 0) + 1;
  });
  const favoriteExercise = Object.entries(exerciseCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] || 'N/A';

  // Date range
  const dates = workouts.map((w) => w.date.getTime());
  const start = new Date(Math.min(...dates));
  const end = new Date(Math.max(...dates));

  return {
    totalWorkouts: uniqueDates.size,
    totalVolume,
    favoriteExercise,
    averageVolume: totalVolume / uniqueDates.size,
    dateRange: { start, end },
  };
}

export function calculateMuscleGroupDistribution(
  workouts: WorkoutEntry[]
): MuscleGroupData[] {
  const muscleData: Record<MuscleGroup, { volume: number; count: number }> = {
    chest: { volume: 0, count: 0 },
    back: { volume: 0, count: 0 },
    shoulders: { volume: 0, count: 0 },
    biceps: { volume: 0, count: 0 },
    triceps: { volume: 0, count: 0 },
    forearms: { volume: 0, count: 0 },
    core: { volume: 0, count: 0 },
    glutes: { volume: 0, count: 0 },
    quads: { volume: 0, count: 0 },
    hamstrings: { volume: 0, count: 0 },
    calves: { volume: 0, count: 0 },
    cardio: { volume: 0, count: 0 },
  };

  workouts.forEach((workout) => {
    let muscleGroup = workout.muscleGroup;

    // Try to detect muscle group if not set
    if (!muscleGroup) {
      const info = getMuscleGroup(workout.exercise);
      muscleGroup = info?.muscleGroup;
    }

    if (muscleGroup) {
      const volume = workout.sets * workout.reps * (workout.weight || 1);
      muscleData[muscleGroup].volume += volume;
      muscleData[muscleGroup].count += 1;
    }
  });

  const getCategoryFromMuscleGroup = (
    mg: MuscleGroup
  ): 'upper' | 'lower' | 'core' | 'cardio' => {
    if (['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'].includes(mg)) {
      return 'upper';
    }
    if (['glutes', 'quads', 'hamstrings', 'calves'].includes(mg)) {
      return 'lower';
    }
    if (mg === 'core') return 'core';
    return 'cardio';
  };

  return Object.entries(muscleData)
    .map(([key, value]) => ({
      muscleGroup: key as MuscleGroup,
      label: muscleGroupLabels[key as MuscleGroup],
      volume: value.volume,
      count: value.count,
      category: getCategoryFromMuscleGroup(key as MuscleGroup),
    }))
    .filter((item) => item.volume > 0 || item.count > 0);
}

export function getExerciseFrequency(
  workouts: WorkoutEntry[]
): { exercise: string; count: number; volume: number }[] {
  const exerciseData: Record<string, { count: number; volume: number }> = {};

  workouts.forEach((w) => {
    if (!exerciseData[w.exercise]) {
      exerciseData[w.exercise] = { count: 0, volume: 0 };
    }
    exerciseData[w.exercise].count += 1;
    exerciseData[w.exercise].volume += w.sets * w.reps * w.weight;
  });

  return Object.entries(exerciseData)
    .map(([exercise, data]) => ({ exercise, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 exercises
}

export function getVolumeOverTime(
  workouts: WorkoutEntry[]
): { date: string; volume: number }[] {
  const volumeByDate: Record<string, number> = {};

  workouts.forEach((w) => {
    const dateKey = w.date.toISOString().split('T')[0];
    volumeByDate[dateKey] =
      (volumeByDate[dateKey] || 0) + w.sets * w.reps * w.weight;
  });

  return Object.entries(volumeByDate)
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getCategoryDistribution(
  muscleData: MuscleGroupData[]
): { category: string; volume: number; percentage: number }[] {
  const categoryTotals: Record<string, number> = {
    upper: 0,
    lower: 0,
    core: 0,
    cardio: 0,
  };

  muscleData.forEach((item) => {
    categoryTotals[item.category] += item.volume;
  });

  const totalVolume = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  return Object.entries(categoryTotals).map(([category, volume]) => ({
    category:
      category === 'upper'
        ? 'Upper Body'
        : category === 'lower'
          ? 'Lower Body'
          : category.charAt(0).toUpperCase() + category.slice(1),
    volume,
    percentage: totalVolume > 0 ? Math.round((volume / totalVolume) * 100) : 0,
  }));
}

export function getFeminizationScore(muscleData: MuscleGroupData[]): {
  score: number;
  feedback: string;
} {
  const categoryDist = getCategoryDistribution(muscleData);
  const lowerBody = categoryDist.find((c) => c.category === 'Lower Body');
  const upperBody = categoryDist.find((c) => c.category === 'Upper Body');

  const lowerPercent = lowerBody?.percentage || 0;
  const upperPercent = upperBody?.percentage || 0;

  // Ideal ratio for feminization: more lower body than upper body
  // Score based on how close to ideal (60% lower, 25% upper, 15% core/cardio)
  let score = 50;

  // Reward lower body focus
  if (lowerPercent >= 50) score += 20;
  else if (lowerPercent >= 40) score += 10;
  else if (lowerPercent < 30) score -= 10;

  // Penalize excessive upper body
  if (upperPercent <= 30) score += 20;
  else if (upperPercent <= 40) score += 10;
  else if (upperPercent > 50) score -= 20;

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  let feedback: string;
  if (score >= 80) {
    feedback = 'Excellent balance for feminization goals!';
  } else if (score >= 60) {
    feedback = 'Good progress! Consider increasing lower body work.';
  } else if (score >= 40) {
    feedback = 'Room for improvement. Focus more on glutes, quads, and hamstrings.';
  } else {
    feedback =
      'Your routine is upper-body dominant. Shift focus to lower body for feminization.';
  }

  return { score, feedback };
}
