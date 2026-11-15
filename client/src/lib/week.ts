import { differenceInWeeks, startOfYear } from "date-fns";

export const WEEKS_IN_SCHEDULE = 52;

/** Week of the NZLA schedule for a date, clamped to 1..52. */
export function getCurrentWeekNumber(date: Date = new Date()): number {
  const week = differenceInWeeks(date, startOfYear(date)) + 1;
  return Math.min(Math.max(week, 1), WEEKS_IN_SCHEDULE);
}

/** Reads a valid `?week=N` (1..52) from a query string, else null. */
export function parseWeekParam(search: string): number | null {
  const raw = new URLSearchParams(search).get("week");
  if (!raw || !/^\d+$/.test(raw)) return null;
  const week = Number(raw);
  return week >= 1 && week <= WEEKS_IN_SCHEDULE ? week : null;
}
