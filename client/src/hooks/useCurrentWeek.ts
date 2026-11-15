import { useMemo } from "react";
import { getCurrentWeekNumber } from "@/lib/week";

/** Single source of truth for the current schedule week. */
export function useCurrentWeek(date?: Date): number {
  const time = date?.getTime();
  return useMemo(() => getCurrentWeekNumber(time === undefined ? new Date() : new Date(time)), [time]);
}
