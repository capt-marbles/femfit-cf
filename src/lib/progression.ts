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

  // Bare "row" is a back exercise and bare "walk" is usually a band walk
  // (abduction) — neither may match here, or those movements silently vanish
  // from progression. Cardio is logged from its own routine block, not here,
  // so only unambiguous machine/activity names are needed.
  if (/(cardio|rowing machine|rower|cycling|elliptical|stairmaster|treadmill|jogging|running)/.test(text)) {
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
export function workingWeight(weights: number[]): number {
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
      // Muscle size is controlled by weekly set count, not by capping load —
      // that is set in the program, not here. Upper body progresses normally
      // so posture work actually gets stronger. Two exceptions are held flat:
      // lat pulldowns (lats widen the upper back) and anything that widens the
      // shoulder line.
      const holdFlat = /pulldown|pull down|lat pull|shrug|lateral raise|side raise|upright row|overhead press|shoulder press/i.test(hist.name);

      if (holdFlat) {
        out.push({
          ...base,
          action: 'hold',
          suggestedWeight: weight,
          suggestedReps: base.targetReps,
          rationale: /pulldown|pull down|lat pull/i.test(hist.name)
            ? `Keep lat pulldowns light and don't progress them — lats widen the upper back. Upper-back strength should come from rows and face pulls.`
            : `This movement widens the shoulder line. Hold the load; it shouldn't be a progression target.`,
        });
      } else if (allHitMax) {
        const next = roundToIncrement(weight + 2.5);
        out.push({
          ...base,
          action: 'increase-weight',
          suggestedWeight: next,
          suggestedReps: `${range.min}`,
          rationale: `All sets hit ${range.max}. Add load to ${next} lb and reset to ${range.min} reps. Rows and face pulls need to get stronger for posture — size is governed by how many sets are in the program, not by the weight on the bar.`,
        });
      } else if (belowMin && prevBelowMin) {
        const next = roundToIncrement(weight * 0.9);
        out.push({
          ...base,
          action: 'deload',
          suggestedWeight: next,
          suggestedReps: `${range.min}-${range.max}`,
          rationale: `Missed the bottom of the range two sessions running. Deload to ${next} lb and rebuild clean reps.`,
        });
      } else {
        out.push({
          ...base,
          action: 'increase-reps',
          suggestedWeight: weight,
          suggestedReps: `${range.max}`,
          rationale: `Stay at ${weight} lb and work toward ${range.max} reps on every set with 1-2 in reserve.`,
        });
      }
      continue;
    }

    // Core — anti-extension / anti-rotation, bodyweight or light band only.
    out.push({
      ...base,
      action: 'maintain',
      suggestedWeight: weight,
      suggestedReps: base.targetReps,
      rationale: `Core work stays bodyweight or light band. Progress by slowing the tempo or lengthening the hold, not by adding load.`,
    });
  }

  // Lower-body suggestions first (the priority), then upper, then core.
  const order: Record<ProgressionCategory, number> = { lower: 0, upper: 1, core: 2, cardio: 3 };
  return out.sort((a, b) => order[a.category] - order[b.category]);
}
