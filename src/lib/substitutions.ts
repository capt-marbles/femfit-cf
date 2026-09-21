import {
  AVOID_PATTERNS,
  ABDUCTION_PATTERNS,
  THRUST_PATTERNS,
  HINGE_PATTERNS,
  UNILATERAL_LOWER_PATTERNS,
  HAMSTRING_PATTERNS,
  CORE_PATTERNS,
  PULL_PATTERNS,
  HORIZONTAL_PRESS_PATTERNS,
  GLUTE_PATTERNS,
  SHOULDER_WIDENING_PATTERNS,
} from '../../functions/_shared/feminization';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'band' | 'bodyweight';

export interface SubstituteOption {
  name: string;
  equipment: Equipment;
  note?: string;
}

export interface SubstitutionGroup {
  key: string;
  label: string;
  /** Why this pattern has to be preserved when swapping. */
  why: string;
  pattern: RegExp;
  options: SubstituteOption[];
}

/**
 * Substitutes are grouped by movement pattern, not by muscle vocabulary,
 * because weekly volume on the dashboard and the generator's validator both
 * classify exercises by matching these same regexes against the name. Swapping
 * across groups would silently drop volume from one bucket and add it to
 * another, so the picker only ever offers same-group alternatives.
 *
 * Every option here is checked against its group's regex by
 * `scripts/verify-substitutions.mjs`.
 */
export const SUBSTITUTION_GROUPS: SubstitutionGroup[] = [
  {
    key: 'abduction',
    label: 'Hip abduction',
    why: 'Glute medius drives hip width — the highest-priority pattern in the program. Swaps must stay abduction.',
    pattern: ABDUCTION_PATTERNS,
    options: [
      { name: 'Hip Abduction Machine', equipment: 'machine' },
      { name: 'Seated Hip Abduction', equipment: 'machine' },
      { name: 'Cable Hip Abduction', equipment: 'cable' },
      { name: 'Banded Hip Abduction', equipment: 'band' },
      { name: 'Clamshell', equipment: 'band' },
      { name: 'Side-Lying Leg Raise', equipment: 'bodyweight' },
      { name: 'Fire Hydrant', equipment: 'bodyweight' },
      { name: 'Lateral Band Walk', equipment: 'band' },
      { name: 'Monster Walk', equipment: 'band' },
    ],
  },
  {
    key: 'thrust',
    label: 'Hip thrust / bridging',
    why: 'Loaded hip extension at end range. Complements the hinge rather than replacing it, so it needs its own slot.',
    pattern: THRUST_PATTERNS,
    options: [
      { name: 'Barbell Hip Thrust', equipment: 'barbell' },
      { name: 'Machine Hip Thrust', equipment: 'machine' },
      { name: 'Single-Leg Hip Thrust', equipment: 'bodyweight' },
      { name: 'Dumbbell Hip Thrust', equipment: 'dumbbell' },
      { name: 'Barbell Glute Bridge', equipment: 'barbell' },
      { name: 'Glute Bridge', equipment: 'bodyweight' },
      { name: 'Banded Glute Bridge', equipment: 'band' },
      { name: 'Frog Pump', equipment: 'bodyweight' },
    ],
  },
  {
    key: 'hinge',
    label: 'Hip hinge',
    why: 'Loads the glutes and hamstrings at length. Standing good mornings are excluded for this client.',
    pattern: HINGE_PATTERNS,
    options: [
      { name: 'Romanian Deadlift', equipment: 'barbell' },
      { name: 'Dumbbell Romanian Deadlift', equipment: 'dumbbell' },
      { name: 'Single-Leg Romanian Deadlift', equipment: 'dumbbell' },
      { name: 'Stiff-Leg Deadlift', equipment: 'barbell' },
      { name: 'Sumo Deadlift', equipment: 'barbell' },
      { name: 'Seated Good Morning', equipment: 'barbell', note: 'Seated only — standing is excluded for this client.' },
    ],
  },
  {
    key: 'unilateral',
    label: 'Single-leg work',
    why: 'Biases toward the glutes and evens out side-to-side differences. Needs to appear twice a week.',
    pattern: UNILATERAL_LOWER_PATTERNS,
    options: [
      { name: 'Bulgarian Split Squat', equipment: 'bodyweight', note: 'Bodyweight until form is established.' },
      { name: 'Dumbbell Split Squat', equipment: 'dumbbell' },
      { name: 'Step-Up', equipment: 'dumbbell' },
      { name: 'Reverse Lunge', equipment: 'dumbbell' },
      { name: 'Walking Lunge', equipment: 'dumbbell' },
      { name: 'Single-Leg Press', equipment: 'machine' },
    ],
  },
  {
    key: 'hamstring',
    label: 'Hamstring curl',
    why: 'Knee-flexion hamstring work. An RDL alone does not cover this function.',
    pattern: HAMSTRING_PATTERNS,
    options: [
      { name: 'Lying Leg Curl', equipment: 'machine' },
      { name: 'Seated Leg Curl', equipment: 'machine' },
      { name: 'Standing Leg Curl', equipment: 'machine' },
      { name: 'Nordic Curl', equipment: 'bodyweight' },
      { name: 'Glute Ham Raise', equipment: 'bodyweight' },
      { name: 'Banded Leg Curl', equipment: 'band' },
    ],
  },
  {
    key: 'pull',
    label: 'Pulling',
    why: 'Upper-back and rear-delt work for posture. Lat pulldowns stay light and are not progressed.',
    pattern: PULL_PATTERNS,
    options: [
      { name: 'Seated Cable Row', equipment: 'cable' },
      { name: 'Chest-Supported Row', equipment: 'machine' },
      { name: 'Dumbbell Row', equipment: 'dumbbell' },
      { name: 'Inverted Row', equipment: 'bodyweight' },
      { name: 'Face Pull', equipment: 'cable' },
      { name: 'Rear Delt Fly', equipment: 'dumbbell' },
      { name: 'Reverse Fly', equipment: 'machine' },
      { name: 'Lat Pulldown', equipment: 'cable', note: 'Keep light and do not progress — lats widen the upper back.' },
    ],
  },
  {
    key: 'press',
    label: 'Horizontal press',
    why: 'Small doses balance the pulling volume. Overhead pressing is avoided — it squares the shoulder line.',
    pattern: HORIZONTAL_PRESS_PATTERNS,
    options: [
      { name: 'Dumbbell Bench Press', equipment: 'dumbbell' },
      { name: 'Machine Chest Press', equipment: 'machine' },
      { name: 'Push-Up', equipment: 'bodyweight' },
      { name: 'Incline Dumbbell Press', equipment: 'dumbbell' },
      { name: 'Floor Press', equipment: 'dumbbell' },
    ],
  },
  {
    key: 'core',
    label: 'Core (anti-rotation / anti-extension)',
    why: 'Bracing without spinal flexion or rotation. Loaded twisting and crunching thickens the waist.',
    pattern: CORE_PATTERNS,
    options: [
      { name: 'Pallof Press', equipment: 'cable' },
      { name: 'Dead Bug', equipment: 'bodyweight' },
      { name: 'Bird Dog', equipment: 'bodyweight' },
      { name: 'Plank', equipment: 'bodyweight' },
      { name: 'Side Plank', equipment: 'bodyweight' },
      { name: 'Hollow Hold', equipment: 'bodyweight' },
      { name: 'Ab Wheel Rollout', equipment: 'bodyweight' },
      { name: 'Suitcase Carry', equipment: 'dumbbell' },
    ],
  },
  {
    key: 'glute-accessory',
    label: 'Glute accessory',
    why: 'Direct glute max work that is not a thrust or a hinge.',
    pattern: GLUTE_PATTERNS,
    options: [
      { name: 'Cable Kickback', equipment: 'cable' },
      { name: 'Glute Kickback Machine', equipment: 'machine' },
      { name: 'Donkey Kick', equipment: 'bodyweight' },
      { name: 'Banded Kickback', equipment: 'band' },
    ],
  },
];

/**
 * Order matters. An RDL matches hinge, hamstring and glute; hinge is the
 * primary classification, so the more specific groups are tested first.
 */
const CLASSIFY_ORDER = [
  'abduction',
  'thrust',
  'hinge',
  'unilateral',
  'hamstring',
  'core',
  'pull',
  'press',
  'glute-accessory',
];

export function classifyExercise(name: string): SubstitutionGroup | null {
  for (const key of CLASSIFY_ORDER) {
    const group = SUBSTITUTION_GROUPS.find((g) => g.key === key);
    if (group?.pattern.test(name)) return group;
  }
  return null;
}

export interface SubstituteChoice extends SubstituteOption {
  /** Flagged when the name widens the shoulder line, which is allowed but not ideal. */
  widensShoulders: boolean;
}

/** Valid swaps for an exercise: same movement pattern, never a banned movement. */
export function getSubstitutes(exerciseName: string): {
  group: SubstitutionGroup;
  choices: SubstituteChoice[];
} | null {
  const group = classifyExercise(exerciseName);
  if (!group) return null;

  const current = exerciseName.trim().toLowerCase();
  const choices = group.options
    .filter((o) => o.name.trim().toLowerCase() !== current)
    .filter((o) => !AVOID_PATTERNS.test(o.name))
    .map((o) => ({ ...o, widensShoulders: SHOULDER_WIDENING_PATTERNS.test(o.name) }));

  return { group, choices };
}
