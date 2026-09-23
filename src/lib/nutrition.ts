import { DailyNutrition, BodyMeasurement, WorkoutSession } from '../types/workout';

const KCAL_PER_LB = 3500;

function dayKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

/** Least-squares slope in units per day. */
function slopePerDay(points: Array<{ t: number; v: number }>): number | null {
  const n = points.length;
  if (n < 2) return null;
  const mt = points.reduce((a, p) => a + p.t, 0) / n;
  const mv = points.reduce((a, p) => a + p.v, 0) / n;
  const den = points.reduce((a, p) => a + (p.t - mt) ** 2, 0);
  if (den === 0) return null;
  return points.reduce((a, p) => a + (p.t - mt) * (p.v - mv), 0) / den;
}

function withinDays(d: Date | string, days: number, now = Date.now()): boolean {
  return now - new Date(d).getTime() <= days * 86_400_000;
}

/**
 * Splits the weight series in half and compares each half's slope. A window
 * containing a step change — the classic glycogen jump when training volume
 * rises — still yields a tidy-looking line, but its slope is meaningless. Day
 * count alone cannot catch that, and a confidently wrong maintenance number is
 * worse than no number.
 */
function trendIsStable(points: Array<{ t: number; v: number }>): {
  stable: boolean;
  firstHalf: number | null;
  secondHalf: number | null;
} {
  if (points.length < 8) return { stable: true, firstHalf: null, secondHalf: null };
  const mid = Math.floor(points.length / 2);
  const a = slopePerDay(points.slice(0, mid));
  const b = slopePerDay(points.slice(mid));
  if (a === null || b === null) return { stable: true, firstHalf: null, secondHalf: null };
  const aw = a * 7;
  const bw = b * 7;
  // More than 1.5 lb/week of disagreement between halves is a step, not a trend.
  return { stable: Math.abs(aw - bw) <= 1.5, firstHalf: aw, secondHalf: bw };
}

export interface EnergyBalance {
  /** Days in the window that carry a calorie entry. */
  intakeDays: number;
  /** Days in the window that carry a weight. */
  weightDays: number;
  meanCalories: number | null;
  /** Positive means gaining. */
  trendLbPerWeek: number | null;
  /** Intake plus the energy the trend implies you are running at a deficit. */
  estimatedTDEE: number | null;
  /** How far the current intake sits from maintenance. */
  impliedDailyBalance: number | null;
  confidence: 'none' | 'low' | 'moderate' | 'good';
  caveat: string | null;
  /** False when the window contains a step change rather than a steady trend. */
  trendStable: boolean;
}

/**
 * Derives maintenance from what actually happened rather than a formula:
 * TDEE = mean intake + the energy represented by the weight trend.
 *
 * Short windows are dominated by glycogen and water swings, so the window
 * needs to be long enough that the trend is real. Below two weeks this is
 * reported as low confidence rather than presented as a number to act on.
 */
export function energyBalance(
  nutrition: DailyNutrition[],
  measurements: BodyMeasurement[],
  windowDays = 21
): EnergyBalance {
  const intake = nutrition.filter((n) => n.calories != null && withinDays(n.date, windowDays));
  const weights = measurements.filter((m) => m.weight != null && withinDays(m.date, windowDays));

  // Collapse to one value per day so a double-logged day cannot outvote others.
  const byDayCal = new Map<string, number>();
  for (const n of intake) byDayCal.set(dayKey(n.date), n.calories!);
  const byDayWeight = new Map<string, number[]>();
  for (const m of weights) {
    const k = dayKey(m.date);
    byDayWeight.set(k, [...(byDayWeight.get(k) || []), m.weight!]);
  }

  const intakeDays = byDayCal.size;
  const weightDays = byDayWeight.size;
  const meanCalories = intakeDays
    ? [...byDayCal.values()].reduce((a, b) => a + b, 0) / intakeDays
    : null;

  const pts = [...byDayWeight.entries()]
    .map(([k, vs]) => ({
      t: new Date(k).getTime() / 86_400_000,
      v: vs.reduce((a, b) => a + b, 0) / vs.length,
    }))
    .sort((a, b) => a.t - b.t);

  const perDay = slopePerDay(pts);
  const trendLbPerWeek = perDay === null ? null : perDay * 7;

  let estimatedTDEE: number | null = null;
  let impliedDailyBalance: number | null = null;
  if (meanCalories !== null && perDay !== null) {
    estimatedTDEE = Math.round(meanCalories - perDay * KCAL_PER_LB);
    impliedDailyBalance = Math.round(meanCalories - estimatedTDEE);
  }

  const stability = trendIsStable(pts);

  let confidence: EnergyBalance['confidence'] = 'none';
  let caveat: string | null = null;
  const usable = Math.min(intakeDays, weightDays);
  if (usable === 0) {
    caveat = 'Log daily calories and weight — both are needed before maintenance can be estimated.';
  } else if (usable < 10) {
    confidence = 'low';
    caveat = `Only ${usable} day${usable === 1 ? '' : 's'} with both. Water and glycogen swings dominate under two weeks — treat this as a placeholder, not a number to act on.`;
  } else if (usable < 14) {
    confidence = 'moderate';
    caveat = `${usable} days of overlap. Getting usable, but a couple more weeks will tighten it.`;
  } else {
    confidence = 'good';
  }

  // A step inside the window overrides day count: the line fits, but its slope
  // describes the step rather than energy balance.
  if (!stability.stable && stability.firstHalf !== null && stability.secondHalf !== null) {
    confidence = 'low';
    estimatedTDEE = null;
    impliedDailyBalance = null;
    caveat =
      `Your weight moved ${stability.firstHalf >= 0 ? '+' : ''}${stability.firstHalf.toFixed(1)} lb/wk ` +
      `over the first half of this window and ${stability.secondHalf >= 0 ? '+' : ''}${stability.secondHalf.toFixed(1)} lb/wk ` +
      `over the second. That is a step, not a trend — usually glycogen and water after a jump in training ` +
      `volume. Maintenance is not shown because any number from this window would describe the step, ` +
      `not your energy balance. It will settle once the weight plateaus at the new level.`;
  }

  return {
    intakeDays,
    weightDays,
    meanCalories: meanCalories === null ? null : Math.round(meanCalories),
    trendLbPerWeek,
    estimatedTDEE,
    impliedDailyBalance,
    confidence,
    caveat,
    trendStable: stability.stable,
  };
}

/**
 * Protein thresholds tuned for this client rather than the general population.
 * Age 58 brings anabolic resistance — more protein is needed per day to provoke
 * the same muscle protein synthesis response — and androgen blockade removes
 * much of the testosterone signal that would otherwise drive it. Both push the
 * floor up, and a calorie deficit pushes it up again, so the usual 0.7 g/lb
 * low-end is not protective here.
 *
 * Above the upper bound is informational, not a warning: there is no benefit
 * being missed, just no further gain from the extra grams.
 */
const PROTEIN_LOW_GPLB = 0.9;
const PROTEIN_AMPLE_GPLB = 1.3;

export interface ProteinRead {
  meanProtein: number | null;
  latestWeight: number | null;
  gramsPerLb: number | null;
  verdict: 'low' | 'adequate' | 'ample' | null;
  /** The band being applied, so the UI can state it rather than imply it. */
  band: { low: number; ample: number };
}

export function proteinRead(
  nutrition: DailyNutrition[],
  measurements: BodyMeasurement[],
  windowDays = 14
): ProteinRead {
  const entries = nutrition.filter((n) => n.protein != null && withinDays(n.date, windowDays));
  const byDay = new Map<string, number>();
  for (const n of entries) byDay.set(dayKey(n.date), n.protein!);

  const meanProtein = byDay.size
    ? [...byDay.values()].reduce((a, b) => a + b, 0) / byDay.size
    : null;

  const weighed = measurements
    .filter((m) => m.weight != null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestWeight = weighed[0]?.weight ?? null;

  const gramsPerLb =
    meanProtein !== null && latestWeight ? meanProtein / latestWeight : null;

  let verdict: ProteinRead['verdict'] = null;
  if (gramsPerLb !== null) {
    verdict =
      gramsPerLb < PROTEIN_LOW_GPLB
        ? 'low'
        : gramsPerLb > PROTEIN_AMPLE_GPLB
          ? 'ample'
          : 'adequate';
  }

  return {
    meanProtein: meanProtein === null ? null : Math.round(meanProtein),
    latestWeight,
    gramsPerLb,
    verdict,
    band: { low: PROTEIN_LOW_GPLB, ample: PROTEIN_AMPLE_GPLB },
  };
}

export interface Confound {
  message: string;
  intakeChangePct: number;
  volumeChangePct: number;
}

/**
 * The reason this lives in femfit rather than a macro app: a calorie change
 * and a training-volume change in the same week are confounded, and reading
 * the scale during that overlap is how a glycogen swing gets mistaken for fat.
 */
export function detectConfound(
  nutrition: DailyNutrition[],
  sessions: WorkoutSession[],
  now = Date.now()
): Confound | null {
  const meanCals = (fromDaysAgo: number, toDaysAgo: number) => {
    const vals = nutrition.filter((n) => {
      const age = (now - new Date(n.date).getTime()) / 86_400_000;
      return n.calories != null && age >= toDaysAgo && age < fromDaysAgo;
    });
    const byDay = new Map<string, number>();
    for (const n of vals) byDay.set(dayKey(n.date), n.calories!);
    return byDay.size ? [...byDay.values()].reduce((a, b) => a + b, 0) / byDay.size : null;
  };

  const tonnage = (fromDaysAgo: number, toDaysAgo: number) =>
    sessions
      .filter((s) => {
        const age = (now - new Date(s.date).getTime()) / 86_400_000;
        return age >= toDaysAgo && age < fromDaysAgo;
      })
      .reduce(
        (total, s) =>
          total +
          s.exercises.reduce(
            (t, e) => t + e.sets.reduce((x, st) => x + (st.weight || 0) * st.reps, 0),
            0
          ),
        0
      );

  const calsNow = meanCals(7, 0);
  const calsPrev = meanCals(14, 7);
  const volNow = tonnage(7, 0);
  const volPrev = tonnage(14, 7);

  if (calsNow === null || calsPrev === null || volPrev === 0) return null;

  const intakeChangePct = ((calsNow - calsPrev) / calsPrev) * 100;
  const volumeChangePct = ((volNow - volPrev) / volPrev) * 100;

  // Only worth flagging when intake fell and training rose — the combination
  // that makes the scale move for reasons that are not fat.
  if (intakeChangePct > -5 || volumeChangePct < 15) return null;

  return {
    intakeChangePct,
    volumeChangePct,
    message:
      `Intake is down ${Math.abs(intakeChangePct).toFixed(0)}% while training volume is up ` +
      `${volumeChangePct.toFixed(0)}% versus last week. These two move the scale in opposite ` +
      `directions and the glycogen swing from the volume jump is the larger effect — ` +
      `give it two weeks before reading anything into your weight.`,
  };
}
