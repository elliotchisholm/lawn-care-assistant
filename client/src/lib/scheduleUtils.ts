import type { ApplicationDay, WeeklySchedule } from "@shared/schema";

export function getApplicationDays(entry: WeeklySchedule): ApplicationDay[] {
  return Array.isArray(entry.applicationDays) ? (entry.applicationDays as ApplicationDay[]) : [];
}

export function getProductSummaries(entry: WeeklySchedule): { name: string; type: string }[] {
  return getApplicationDays(entry).flatMap((day) =>
    (day.products ?? []).map((p) => ({
      name: p.alternativeName ? `${p.name} or ${p.alternativeName}` : p.name,
      type: p.type,
    })),
  );
}

/** Groups entries by month, keeping schedule order. */
export function groupByMonth(entries: WeeklySchedule[]): { month: string; weeks: WeeklySchedule[] }[] {
  const sorted = [...entries].sort((a, b) => a.weekNumber - b.weekNumber);
  const groups: { month: string; weeks: WeeklySchedule[] }[] = [];
  for (const entry of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.month === entry.month) last.weeks.push(entry);
    else groups.push({ month: entry.month, weeks: [entry] });
  }
  return groups;
}
