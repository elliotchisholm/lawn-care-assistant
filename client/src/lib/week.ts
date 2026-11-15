import { differenceInWeeks, startOfYear } from "date-fns";

export const WEEKS_IN_SCHEDULE = 52;

/** Week of the NZLA schedule for a date, clamped to 1..52. */
export function getCurrentWeekNumber(date: Date = new Date()): number {
  const week = differenceInWeeks(date, startOfYear(date)) + 1;
  return Math.min(Math.max(week, 1), WEEKS_IN_SCHEDULE);
}
