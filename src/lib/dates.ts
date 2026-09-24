/**
 * Date handling for day-keyed records.
 *
 * `new Date('2026-09-24')` parses as UTC midnight, which in any timezone behind
 * UTC is the *previous* day locally. That made entries invisible to same-day
 * checks and shifted every chart label back a day. Storing local noon instead
 * keeps a record on the right calendar day both when rendered locally and when
 * its date is read straight off the ISO string.
 */

/** Today's date in the user's timezone, as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return localDateKey(now);
}

/** The local calendar day a Date falls on, as YYYY-MM-DD. */
export function localDateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Turns a date input's YYYY-MM-DD into a Date at local noon. Noon rather than
 * midnight so neither a timezone offset nor a daylight-saving shift can tip it
 * into an adjacent day.
 */
export function fromDateInput(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function isSameLocalDay(a: Date | string, b: Date | string): boolean {
  return localDateKey(a) === localDateKey(b);
}
