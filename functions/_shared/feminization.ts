/**
 * Single source of truth for feminization training principles.
 *
 * Every AI route (generate, review, analyze, substitute) imports from here so
 * the app cannot contradict itself — previously each route carried its own
 * copy and the reviewer endorsed the same errors the generator made.
 *
 * Files under functions/_shared are not routed by Cloudflare Pages.
 */

/** The physiology the whole app is built on. Everything else follows from this. */
export const TRAINING_PRINCIPLES = `## How muscle actually responds (never violate these)
- Hypertrophy is driven by hard sets taken close to failure and by weekly set volume — NOT by how heavy the weight is. "Light weight, high reps to tone" is a myth: a 15-rep set near failure builds as much as an 8-rep set.
- Therefore, to build a muscle give it MORE sets; to keep a muscle small give it FEWER sets. Never prescribe light weight as a strategy to avoid size.

## Muscle priorities

BUILD — most of the volume:
- Gluteus medius / hip abduction. The single highest-leverage muscle for hip width, and it recovers fast. 6-9 hard sets per week across at least 2 days. Program it as a primary movement, not a finisher. Examples: seated machine abduction, cable/banded hip abduction, lateral band walks, side-lying abduction.
- Gluteus maximus. Hip thrusts and glute bridges, PLUS a true hip hinge (Romanian deadlift). 10-16 sets per week.
- Quads and hamstrings for leg shape: squat, lunge, split squat patterns.

MAINTAIN — moderate volume, real loads, for posture:
- Horizontal pulling is REQUIRED in every program: rows, face pulls, rear delt work. Upper back strength drives posture, and posture affects how the torso reads more than arm size does. At least one row and one face pull / rear delt movement per week.
- Lats: moderate only — heavily developed lats broaden the V-taper.

LIMIT — few sets or none:
- Heavy overhead pressing, lateral raises, upright rows, heavy shrugs. These widen and square the shoulder line.
- Direct arm work (curls, triceps extensions) is neither feminizing nor de-feminizing — it is simply low value here. At most one arm movement, and only if wanted.
- Calf raises and leg extensions are low priority. Never let them occupy a slot that hip abduction should have.

AVOID ENTIRELY:
- Loaded rotation and side flexion: weighted Russian twists, side bends, weighted oblique crunches, heavy woodchoppers. Obliques hypertrophy like any other muscle, and thicker obliques widen the waist — this works directly against the goal.
- Use anti-rotation and anti-extension core work instead: Pallof press, dead bug, bird dog, plank.

## Waist
Waist appearance comes from body fat level, from NOT thickening the obliques, and from rib/pelvis position. It does not come from ab training volume. Never program "obliques for waist definition".

## Rep ranges and loading
- Hip thrusts, Romanian deadlifts, squats: 6-10 reps with heavier loads and progressive overload. These stall quickly if kept in high-rep ranges.
- Accessory lower body and all upper body: 10-15 reps.
- Hip abduction: 12-20 reps.
- Never apply one flat rep range to every exercise in the program.

## Cardio
- 2-4 steady-state sessions per week for cardiovascular health and body composition.
- Never frame cardio as a way to reduce muscle mass — lower body muscle is the entire goal. Keep intensity moderate so it does not interfere with glute recovery.

## Form cues that change the outcome
- Prefer Romanian deadlifts over generic "dumbbell deadlifts" — the latter drifts quad-dominant and misses the hamstrings.
- Romanian deadlift: hinge at the hip, soft knee, weight tracking close to the legs. Felt in the hamstrings, not the lower back.
- Hip thrust: posterior pelvic tilt at the top, chin tucked, ribs down. If the glutes are not contracting, the load is irrelevant.`;

/** Concrete double-progression rule. Injected into every generated program. */
export const PROGRESSION_RULE =
  'Progression: when you complete the TOP of the rep range on all sets with good form, ' +
  'add weight the next session and drop back to the BOTTOM of the range. Repeat. ' +
  'On hip thrusts and Romanian deadlifts, move up sooner than feels necessary — they stall fast in high-rep ranges.';

export const TECHNIQUE_RULE =
  'Technique before load: if you feel Romanian deadlifts in your lower back instead of your hamstrings, ' +
  'or cannot feel your glutes working during hip thrusts, reduce the weight and fix the pattern first.';

// ---------------------------------------------------------------------------
// Exercise policy — used for prompting AND for deterministic validation
// ---------------------------------------------------------------------------

/** Loaded rotation / side flexion. Thickens obliques, widens the waist. */
export const AVOID_PATTERNS: RegExp =
  /russian twist|side bend|oblique crunch|woodchop|wood chop|landmine twist|weighted twist|side crunch/i;

/** Widens or squares the shoulder line. Acceptable in small doses, flagged in bulk. */
export const SHOULDER_WIDENING_PATTERNS: RegExp =
  /upright row|shrug|lateral raise|side raise|overhead press|shoulder press|military press|arnold press|push press/i;

/** Gluteus medius work — the highest-leverage muscle for hip width. */
export const ABDUCTION_PATTERNS: RegExp =
  /abduct|lateral leg (raise|lift)|side.?lying leg|clamshell|clam shell|fire hydrant|monster walk|lateral band walk|banded walk|side step/i;

/** Horizontal pulling and rear-delt work — required for posture. */
export const PULL_PATTERNS: RegExp =
  /row|face pull|rear delt|reverse fly|prone fly|pulldown|pull.?up|chin.?up|pull down/i;

/** Hip hinge pattern — hamstring/glute lengthening under load. */
export const HINGE_PATTERNS: RegExp =
  /romanian deadlift|\brdl\b|stiff.?leg|good morning|hip hinge|deadlift/i;

/** Hip extension via bridging. Complements, does not replace, the hinge. */
export const THRUST_PATTERNS: RegExp =
  /hip thrust|glute bridge|frog pump/i;

/** Glute max work generally. */
export const GLUTE_PATTERNS: RegExp =
  /glute|hip thrust|kickback|donkey kick|romanian deadlift|\brdl\b|sumo|step.?up|split squat|lunge|good morning/i;

/** Low-priority movements that tend to crowd out abduction work. */
export const LOW_PRIORITY_PATTERNS: RegExp =
  /calf raise|leg extension|wrist curl|forearm/i;

/** Compact policy summary for prompts that cannot carry the full principles. */
export const POLICY_SUMMARY = `Build: hip abduction (6-9 sets/wk), glutes, hamstrings, quads.
Maintain for posture: rows, face pulls, rear delts — always include pulling.
Limit: overhead pressing, lateral raises, upright rows, shrugs, direct arm work, calf raises, leg extensions.
Avoid entirely: weighted Russian twists, side bends, weighted oblique crunches — loaded oblique work widens the waist. Use Pallof press / dead bug / plank instead.
Never justify an exercise with "light weight to avoid bulk" — volume controls size, not load.`;

// ---------------------------------------------------------------------------
// Deterministic validation
// ---------------------------------------------------------------------------

export interface RoutineWarning {
  severity: 'high' | 'medium';
  message: string;
  exercise?: string;
  day?: string;
}

interface ValidatableExercise {
  name?: string;
  muscleGroup?: string;
  sets?: number;
  reps?: string;
}

interface ValidatableDay {
  name?: string;
  exercises?: ValidatableExercise[];
}

interface ValidatableRoutine {
  days?: ValidatableDay[];
}

/** Lowest rep in a range string like "6-10" or "12". Infinity when unparseable. */
function lowestRep(reps?: string): number {
  const match = reps?.match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

/**
 * Checks a generated routine against the principles above.
 *
 * The model does not reliably follow a long instruction list, so these checks
 * run on the output regardless of what the prompt asked for.
 */
export function validateRoutine(routine: ValidatableRoutine): RoutineWarning[] {
  const warnings: RoutineWarning[] = [];
  const days = routine.days || [];

  const all: Array<{ ex: ValidatableExercise; dayName: string }> = [];
  for (const day of days) {
    for (const ex of day.exercises || []) {
      all.push({ ex, dayName: day.name || 'Unnamed day' });
    }
  }
  if (all.length === 0) return warnings;

  const setsMatching = (pattern: RegExp) =>
    all
      .filter(({ ex }) => pattern.test(ex.name || ''))
      .reduce((sum, { ex }) => sum + (ex.sets || 0), 0);

  // 1. Loaded oblique work — works directly against the goal.
  for (const { ex, dayName } of all) {
    if (AVOID_PATTERNS.test(ex.name || '')) {
      warnings.push({
        severity: 'high',
        exercise: ex.name,
        day: dayName,
        message: `"${ex.name}" is loaded oblique work, which thickens the waist. Replace it with a Pallof press or dead bugs for the same anti-rotation strength without the width.`,
      });
    }
  }

  // 2. Gluteus medius volume — the highest-leverage muscle for hip width.
  const abductionSets = setsMatching(ABDUCTION_PATTERNS);
  const abductionDays = days.filter((d) =>
    (d.exercises || []).some((ex) => ABDUCTION_PATTERNS.test(ex.name || ''))
  ).length;

  if (abductionSets === 0) {
    warnings.push({
      severity: 'high',
      message:
        'No hip abduction work anywhere in the program. Gluteus medius is the highest-leverage muscle for hip width — add 6-9 sets per week (banded or seated machine abduction, lateral band walks).',
    });
  } else if (abductionSets < 6) {
    warnings.push({
      severity: 'high',
      message: `Only ${abductionSets} sets of hip abduction per week. Target 6-9 sets across at least 2 days — this muscle recovers fast and drives hip width.`,
    });
  } else if (abductionDays < 2) {
    warnings.push({
      severity: 'medium',
      message: 'All hip abduction volume sits on a single day. Spread it across at least 2 days for better weekly stimulus.',
    });
  }

  // 3. Horizontal pulling — posture affects torso shape more than arm size.
  // An upright row matches /row/ but is a shoulder-widener, not postural pulling.
  const postualPullSets = all
    .filter(({ ex }) => PULL_PATTERNS.test(ex.name || '') && !/upright row/i.test(ex.name || ''))
    .reduce((sum, { ex }) => sum + (ex.sets || 0), 0);

  if (postualPullSets === 0) {
    warnings.push({
      severity: 'high',
      message:
        'No pulling work in the program. Upper back strength drives posture, which affects how the torso reads. Add a row variation and a face pull / rear delt movement.',
    });
  }

  // 4. Both hip extension patterns should be present.
  if (setsMatching(HINGE_PATTERNS) === 0) {
    warnings.push({
      severity: 'medium',
      message: 'No hip hinge in the program. Add Romanian deadlifts — they load the hamstrings and glutes in a way squats and thrusts do not.',
    });
  }
  if (setsMatching(THRUST_PATTERNS) === 0) {
    warnings.push({
      severity: 'medium',
      message: 'No hip thrust or glute bridge. This is the primary glute max builder — add it.',
    });
  }

  // A generic "deadlift" drifts quad-dominant and misses the hamstrings.
  for (const { ex, dayName } of all) {
    const name = ex.name || '';
    if (/deadlift/i.test(name) && !/romanian|stiff.?leg|\brdl\b/i.test(name)) {
      warnings.push({
        severity: 'medium',
        exercise: name,
        day: dayName,
        message: `"${name}" tends to become quad-dominant. Use a Romanian deadlift instead — hinge at the hip with a soft knee so the hamstrings and glutes take the load.`,
      });
    }
  }

  // 5. Shoulder-widening volume.
  const shoulderSets = setsMatching(SHOULDER_WIDENING_PATTERNS);
  if (shoulderSets > 3) {
    warnings.push({
      severity: 'medium',
      message: `${shoulderSets} sets of overhead pressing / lateral raises / shrugs per week. These widen the shoulder line — keep it at 3 sets or fewer.`,
    });
  }

  // 6. Low-priority work crowding out abduction.
  const lowPrioritySets = setsMatching(LOW_PRIORITY_PATTERNS);
  if (lowPrioritySets > 0 && abductionSets < 6) {
    warnings.push({
      severity: 'medium',
      message: `${lowPrioritySets} sets go to calf raises / leg extensions while hip abduction is under-dosed. Swap those slots for abduction work.`,
    });
  }

  // 7. Flat rep ranges — nothing loaded heavily.
  const hasHeavySlot = all.some(
    ({ ex }) =>
      (HINGE_PATTERNS.test(ex.name || '') || THRUST_PATTERNS.test(ex.name || '') || /squat/i.test(ex.name || '')) &&
      lowestRep(ex.reps) <= 10
  );
  if (!hasHeavySlot) {
    warnings.push({
      severity: 'medium',
      message:
        'Every exercise sits in a high rep range. Hip thrusts, Romanian deadlifts and squats respond well to heavier loading — run those in the 6-10 range once technique is solid.',
    });
  }

  // 8. Glute volume floor.
  const gluteSets = setsMatching(GLUTE_PATTERNS);
  if (gluteSets < 8) {
    warnings.push({
      severity: 'medium',
      message: `Only ${gluteSets} sets of glute work per week. Target 10-16 sets for meaningful growth.`,
    });
  }

  return warnings;
}

/**
 * Guarantees the concrete progression and technique rules land in the program,
 * regardless of whether the model remembered to include them.
 */
export function applyProgramDefaults<T extends { generalNotes?: string[] }>(routine: T): T {
  const notes = Array.isArray(routine.generalNotes) ? [...routine.generalNotes] : [];

  // Drop the vague placeholder the model reliably emits.
  const vague = /adjust weights?.*(based on|according to).*(progress|comfort)/i;
  const filtered = notes.filter((n) => !vague.test(n));

  if (!filtered.some((n) => /double progression|top of the rep range/i.test(n))) {
    filtered.unshift(PROGRESSION_RULE);
  }
  if (!filtered.some((n) => /technique before load/i.test(n))) {
    filtered.push(TECHNIQUE_RULE);
  }

  return { ...routine, generalNotes: filtered };
}
