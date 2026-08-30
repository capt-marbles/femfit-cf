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
- One horizontal press (dumbbell bench or machine chest press), 2-3 sets, whenever the program has 6 or more sets of pulling. An all-pull upper body creates a shoulder imbalance over months. This is a joint-health decision, not a masculinising one: frame width comes from delts and traps, not pecs. Keep it horizontal — no overhead pressing.
- Core: 6-9 sets per week of anti-rotation and anti-extension work (Pallof press, dead bug, bird dog, plank, hollow hold) across at least 2 days. Cutting the oblique work must not take the whole core allocation with it.

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

## Weekly set targets — count these before finalising
- Glute max (hip thrust, RDL, split squat, lunge, kickback): 10-16 sets. This is the primary target and must have the most volume of any muscle.
- Hip abduction / gluteus medius: 6-9 sets, and AT MOST 2 abduction exercises in the entire week (for example one machine or cable abduction, plus one lateral band walk). Three or four different abduction movements is over-programming a small muscle. Its volume must never exceed glute max volume — if it does, the priority is inverted.
- Hamstrings: 6-10 sets, and a Romanian deadlift alone does not cover it. Include a leg curl so the knee-flexion function is trained.
- Quads: 6-10 sets.
- Core (anti-rotation / anti-extension): 6-9 sets across 2+ days.
- Pulling: 6-9 sets. Horizontal press: 2-3 sets.

## Redundancy — do not waste slots
- Exactly ONE heavily loaded hip hinge per week. A Romanian deadlift and a conventional deadlift in the same week is duplicated lower back fatigue for little extra return. If a second posterior chain movement is wanted, use a hamstring curl.
- Never program both a hip thrust and a glute bridge. Same movement, and the bridge loads less. Use the slot for single-leg glute work or a hamstring curl.
- Never program both a squat and a leg press. Same bilateral knee-dominant pattern, and the leg press does less for the hips.
- Never include calf raises, leg extensions or wrist work. They do not serve the goal, and every slot they take is one a hamstring or glute movement should have had. If an exercise can only be justified as "low priority", leave it out.
- At most 2 bilateral quad-dominant movements per day. Squats plus lunges plus leg press is three overlapping movements for a muscle that is not the priority. Prefer Bulgarian split squats and walking lunges — they bias toward the glutes.

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

/** Hamstring work. An RDL alone does not cover this. */
export const HAMSTRING_PATTERNS: RegExp =
  /romanian deadlift|\brdl\b|leg curl|hamstring curl|nordic|good morning|stiff.?leg|glute ham/i;

/** Bilateral knee-dominant pressing. Squat and leg press are the same pattern. */
export const BILATERAL_KNEE_PATTERNS: RegExp = /leg press|hack squat/i;

/** Low-priority movements that tend to crowd out abduction work. */
export const LOW_PRIORITY_PATTERNS: RegExp =
  /calf raise|leg extension|wrist curl|forearm/i;

/** Anti-rotation and anti-extension core work — the kind that does not widen. */
export const CORE_PATTERNS: RegExp =
  /pallof|dead ?bug|bird ?dog|plank|hollow|ab wheel|ab roll|leg raise|knee raise|suitcase carry|plank/i;

/**
 * Horizontal pressing. Kept in small doses for shoulder balance against pulling
 * volume — shoulder width comes from delts and traps, not pecs.
 */
export const HORIZONTAL_PRESS_PATTERNS: RegExp =
  /bench press|chest press|push.?up|pushup|floor press|pec deck|chest fly|incline press|dumbbell press/i;

/**
 * Bilateral quad-dominant movements. Unilateral variants (split squat, walking
 * lunge) are excluded because they bias toward glutes and are the fix, not the
 * problem.
 */
export const QUAD_DOMINANT_PATTERNS: RegExp = /squat|leg press|hack|leg extension|lunge/i;
export const QUAD_EXEMPT_PATTERNS: RegExp =
  /bulgarian|split squat|walking lunge|reverse lunge|sumo|step.?up/i;

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
  feminizationNote?: string;
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

  // 6. Low-priority work. These serve no part of the goal, so any slot they
  //    occupy is a slot a hamstring curl or glute movement should have had.
  const lowPriority = all.filter(({ ex }) => LOW_PRIORITY_PATTERNS.test(ex.name || ''));
  if (lowPriority.length > 0) {
    const names = lowPriority.map(({ ex }) => `"${ex.name}"`).join(', ');
    warnings.push({
      severity: 'medium',
      day: lowPriority[0].dayName,
      message: `${names} does not serve the goal and is taking a slot. Replace it with a hamstring curl or a second glute movement.`,
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

  // 8. Glute max volume floor. This is the primary target muscle.
  const gluteSets = setsMatching(GLUTE_PATTERNS);
  if (gluteSets < 10) {
    warnings.push({
      severity: 'high',
      message: `Only ${gluteSets} sets of glute max work per week. This is the primary target — get it to 10-16 sets.`,
    });
  }

  // 8b. Priority inversion. Glute medius is smaller and needs less volume than
  //     glute max; when it outranks it, the emphasis has been over-applied.
  if (abductionSets > 9 && abductionSets >= gluteSets) {
    const relation = abductionSets === gluteSets ? 'as much volume as' : 'more volume than';
    warnings.push({
      severity: 'high',
      message: `Hip abduction (${abductionSets} sets) has ${relation} glute max (${gluteSets} sets). That inverts the priority — glute medius is the smaller muscle and 6-9 sets covers it. Move the surplus into hip thrusts or a second glute max movement.`,
    });
  } else if (abductionSets > 9) {
    warnings.push({
      severity: 'medium',
      message: `${abductionSets} sets of hip abduction per week is above the 6-9 target. More is not better here, and it crowds out glute max work.`,
    });
  }

  // 8c. Hamstring floor. A single RDL does not cover the muscle.
  const hamstringSets = setsMatching(HAMSTRING_PATTERNS);
  if (hamstringSets < 6) {
    warnings.push({
      severity: 'medium',
      message: `Only ${hamstringSets} sets of hamstring work per week. Add a leg curl — a Romanian deadlift alone leaves the knee-flexion function untrained.`,
    });
  }

  // 9. Core volume floor. Core definition is a stated goal, and trimming the
  //    oblique work must not take the whole core allocation with it.
  const coreSets = setsMatching(CORE_PATTERNS);
  if (coreSets < 6) {
    warnings.push({
      severity: 'medium',
      message: `Only ${coreSets} sets of core work per week. Add a second core slot — dead bugs or hollow holds — on another day. Six sets is a reasonable floor.`,
    });
  }

  // 10. Push/pull balance. All-pull programming causes shoulder problems over
  //     months. A horizontal press is a joint-health choice, not a masculinising
  //     one — the width being avoided comes from delts and traps, not pecs.
  const pressSets = setsMatching(HORIZONTAL_PRESS_PATTERNS);
  if (postualPullSets >= 6 && pressSets === 0) {
    warnings.push({
      severity: 'medium',
      message: `${postualPullSets} sets of pulling and no pressing at all. Add one horizontal press (dumbbell bench or machine chest press, 2-3 sets) to balance the shoulder. Pecs are not what widens the frame — delts and traps are.`,
    });
  }

  // 11. More than one heavily loaded hinge per week is a lot of lower back
  //     fatigue, and the second one rarely adds anything the first missed.
  const heavyHinges = all.filter(
    ({ ex }) => HINGE_PATTERNS.test(ex.name || '') && lowestRep(ex.reps) <= 10
  );
  if (heavyHinges.length >= 2) {
    const names = heavyHinges.map(({ ex }) => `"${ex.name}"`).join(' and ');
    warnings.push({
      severity: 'medium',
      message: `Two heavy hinge movements in one week (${names}). That is a lot of lower back fatigue and they overlap heavily. Keep one — replace the other with a hamstring curl, or use a trap bar if you want the loading pattern.`,
    });
  }

  // 12. Hip thrust and glute bridge are the same pattern; the bridge loads less.
  const hasThrust = all.some(({ ex }) => /hip thrust/i.test(ex.name || ''));
  const bridge = all.find(({ ex }) => /glute bridge|frog pump/i.test(ex.name || ''));
  if (hasThrust && bridge) {
    warnings.push({
      severity: 'medium',
      exercise: bridge.ex.name,
      day: bridge.dayName,
      message: `"${bridge.ex.name}" duplicates the hip thrust already in the program — same movement, less loading potential. Spend the slot on a second abduction variation or single-leg work.`,
    });
  }

  // 12b. Squat and leg press are the same bilateral knee-dominant pattern, and
  //      the leg press contributes less to the hips.
  const hasSquat = all.some(
    ({ ex }) => /squat/i.test(ex.name || '') && !QUAD_EXEMPT_PATTERNS.test(ex.name || '')
  );
  const legPress = all.find(({ ex }) => BILATERAL_KNEE_PATTERNS.test(ex.name || ''));
  if (hasSquat && legPress) {
    warnings.push({
      severity: 'medium',
      exercise: legPress.ex.name,
      day: legPress.dayName,
      message: `"${legPress.ex.name}" repeats the squat pattern already in the program and does less for the hips. Use the slot for a hamstring curl or single-leg glute work.`,
    });
  }

  // 13. Overlapping quad movements in one day, when quads are not the priority.
  for (const day of days) {
    const quadWork = (day.exercises || []).filter(
      (ex) =>
        QUAD_DOMINANT_PATTERNS.test(ex.name || '') && !QUAD_EXEMPT_PATTERNS.test(ex.name || '')
    );
    if (quadWork.length >= 3) {
      warnings.push({
        severity: 'medium',
        day: day.name,
        message: `${quadWork.length} overlapping quad movements in one day (${quadWork.map((e) => e.name).join(', ')}), and quads are not the priority. Swap one for Bulgarian split squats or walking lunges to shift emphasis toward the glutes.`,
      });
    }
  }

  // 14. Repeated rationale text is a sign the model padded rather than reasoned.
  const noteCounts = new Map<string, number>();
  for (const { ex } of all) {
    const note = (ex.feminizationNote || '').trim().toLowerCase();
    if (note) noteCounts.set(note, (noteCounts.get(note) || 0) + 1);
  }
  const repeated = [...noteCounts.entries()].filter(([, n]) => n >= 3);
  if (repeated.length > 0) {
    warnings.push({
      severity: 'medium',
      message: `${repeated.length} rationale note${repeated.length > 1 ? 's are' : ' is'} repeated verbatim across exercises. Each one should explain what that specific movement does, not restate a generic line.`,
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

  // Drop the vague placeholders the model reliably emits. These read as advice
  // but contain no instruction the reader can act on, and they dilute the rules
  // below that do.
  const vague = [
    /adjust weights?.*(based on|according to|depending on)/i,
    /listen to your body/i,
    /focus on (proper )?form and technique/i,
    /stay hydrated/i,
    /(rest|recover) (adequately|as needed|when needed)/i,
    /consult (a|your) (doctor|physician|professional)/i,
  ];
  const filtered = notes.filter((n) => !vague.some((re) => re.test(n)));

  if (!filtered.some((n) => /double progression|top of the rep range/i.test(n))) {
    filtered.unshift(PROGRESSION_RULE);
  }
  if (!filtered.some((n) => /technique before load/i.test(n))) {
    filtered.push(TECHNIQUE_RULE);
  }

  return { ...routine, generalNotes: filtered };
}
