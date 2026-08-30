import {
  WorkoutSession,
  ProgressionSuggestion,
  ProgressionCategory,
} from '../types/workout';

// Categorize an exercise from its (free-text) muscle group and/or name.
// Feminization training treats lower/upper/core asymmetrically, so this
// classification drives the whole progression strategy.
export function categorize(muscleGroup: string | undefined, exerciseName: string): ProgressionCategory {
  const text = `${muscleGroup || ''} ${exerciseName}`.toLowerCase();

  if (/(cardio|run|walk|cycl|row|jog|elliptical|stairmaster|incline)/.test(text)) {
    return 'cardio';
  }
  if (/(glute|quad|hamstring|ham\b|leg|calf|calves|hip|thigh|lunge|squat|deadlift|bridge|thrust|abduct|adduct|kickback|step[- ]?up)/.test(text)) {
    return 'lower';
  }
  if (/(core|\bab\b|abs|plank|oblique|crunch|russian|hollow|leg raise|posture|back extension)/.test(text)) {
    return 'core';
  }
  if (/(chest|shoulder|delt|tricep|bicep|back|lat\b|row|press|curl|arm|push[- ]?up|pull[- ]?up|fly|raise|pulldown|extension)/.test(text)) {
    return 'upper';
  }
  // Default unknowns to core (conservative — no aggressive load progression)
  return 'core';
}

export function parseRepRange(reps: string): { min: number; max: number } {
  const nums = (reps || '').match(/\d+/g)?.map(Number) || [];
  if (nums.length >= 2) return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: 8, max: 12 };
}

function roundToIncrement(weight: number, increment = 2.5): number {
  return Math.round(weight / increment) * increment;
}

// Most common weight in a set of sets ("working weight"); ties break to the heaviest.
function workingWeight(weights: number[]): number {
  if (weights.length === 0) return 0;
  const freq = new Map<number, number>();
  for (const w of weights) freq.set(w, (freq.get(w) || 0) + 1);
  let best = weights[0];
  let bestCount = 0;
  for (const [w, count] of freq) {
    if (count > bestCount || (count === bestCount && w > best)) {
      best = w;
      bestCount = count;
    }
  }
  return best;
}

interface ExerciseHistory {
  name: string;
  muscleGroup?: string;
  targetReps: string;
  // Sessions containing this exercise, oldest → newest
  sessions: { date: Date; reps: number[]; weights: number[] }[];
}

function buildHistories(sessions: WorkoutSession[]): ExerciseHistory[] {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const map = new Map<string, ExerciseHistory>();

  for (const session of sorted) {
    for (const ex of session.exercises) {
      if (!ex.sets.length) continue;
      const key = ex.name.trim().toLowerCase();
      let hist = map.get(key);
      if (!hist) {
        hist = { name: ex.name, muscleGroup: ex.muscleGroup, targetReps: ex.targetReps, sessions: [] };
        map.set(key, hist);
      }
      // Keep the most recent target/muscleGroup metadata
      hist.muscleGroup = ex.muscleGroup ?? hist.muscleGroup;
      hist.targetReps = ex.targetReps || hist.targetReps;
      hist.sessions.push({
        date: new Date(session.date),
        reps: ex.sets.map((s) => s.reps),
        weights: ex.sets.map((s) => s.weight),
      });
    }
  }
  return [...map.values()];
}

export function getProgressionSuggestions(sessions: WorkoutSession[]): ProgressionSuggestion[] {
  const histories = buildHistories(sessions);
  const out: ProgressionSuggestion[] = [];

  for (const hist of histories) {
    const latest = hist.sessions[hist.sessions.length - 1];
    const prev = hist.sessions[hist.sessions.length - 2];
    const category = categorize(hist.muscleGroup, hist.name);

    // Cardio isn't load-progressed here — skip.
    if (category === 'cardio') continue;

    const range = parseRepRange(hist.targetReps);
    const weight = workingWeight(latest.weights);
    const isBodyweight = weight === 0;

    const allHitMax = latest.reps.every((r) => r >= range.max);
    const belowMin = latest.reps.some((r) => r < range.min);
    const prevBelowMin = prev ? prev.reps.some((r) => r < range.min) : false;

    const lastReps = latest.reps.join(', ');
    const base = {
      exercise: hist.name,
      category,
      lastWeight: weight,
      lastReps,
      targetReps: hist.targetReps || `${range.min}-${range.max}`,
      sessionsLogged: hist.sessions.length,
    };

    // Bodyweight movements can only progress by reps.
    if (isBodyweight) {
      out.push({
        ...base,
        action: 'increase-reps',
        suggestedWeight: 0,
        suggestedReps: `${range.max + 2}`,
        rationale: allHitMax
          ? `You hit ${range.max} reps — add 2 more reps per set, or add a light load to keep progressing.`
          : `Keep working toward ${range.max} clean reps per set at bodyweight.`,
      });
      continue;
    }

    if (category === 'lower') {
      // Build the curves — progress aggressively via double progression.
      if (allHitMax) {
        const next = roundToIncrement(weight + 5);
        out.push({
          ...base,
          action: 'increase-weight',
          suggestedWeight: next,
          suggestedReps: `${range.min}`,
          rationale: `All sets hit the top of the range (${range.max}). Add load to ${next} lb and reset to ${range.min} reps — this is where you build glutes/legs.`,
        });
      } else if (belowMin && prevBelowMin) {
        const next = roundToIncrement(weight * 0.9);
        out.push({
          ...base,
          action: 'deload',
          suggestedWeight: next,
          suggestedReps: `${range.min}-${range.max}`,
          rationale: `Missed the bottom of the range two sessions running. Deload to ${next} lb, rebuild clean reps, then climb again.`,
        });
      } else {
        out.push({
          ...base,
          action: 'increase-reps',
          suggestedWeight: weight,
          suggestedReps: `${range.max}`,
          rationale: `Stay at ${weight} lb and push toward ${range.max} reps on every set before adding load.`,
        });
      }
      continue;
    }

    if (category === 'upper') {
      // Goal is maintenance without bulk — cap load, keep reps high.
      if (weight > 0 && allHitMax) {
        out.push({
          ...base,
          action: 'increase-reps',
          suggestedWeight: weight,
          suggestedReps: `${Math.max(range.max, 18)}`,
          rationale: `Upper body is maintenance, not growth. Hold ${weight} lb and keep reps high (${Math.max(range.max, 18)}+) — adding weight here risks bulk.`,
        });
      } else {
        out.push({
          ...base,
          action: 'hold',
          suggestedWeight: weight,
          suggestedReps: base.targetReps,
          rationale: `Hold ${weight} lb at high reps. For a feminine line, keep upper-body load flat rather than progressing it.`,
        });
      }
      continue;
    }

    // Core — stability & posture, not load.
    out.push({
      ...base,
      action: 'maintain',
      suggestedWeight: weight,
      suggestedReps: base.targetReps,
      rationale: `Core work is for posture and control. Focus on clean, controlled reps rather than adding load.`,
    });
  }

  // Lower-body suggestions first (the priority), then upper, then core.
  const order: Record<ProgressionCategory, number> = { lower: 0, upper: 1, core: 2, cardio: 3 };
  return out.sort((a, b) => order[a.category] - order[b.category]);
}
