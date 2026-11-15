import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import WeeklySchedule from "@/components/WeeklySchedule";
import WeekDetailSheet from "@/components/WeekDetailSheet";
import { useCurrentWeek } from "@/hooks/useCurrentWeek";
import type { WeeklySchedule as WeeklyScheduleType } from "@shared/schema";

export default function Schedule() {
  const currentWeek = useCurrentWeek();
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<WeeklyScheduleType | null>(null);

  return (
    <main className="container mx-auto max-w-2xl px-3 py-4 sm:px-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold" data-testid="text-schedule-title">Schedule</h1>
        <p className="text-sm text-muted-foreground">
          NZLA year-round plan. Currently week {currentWeek} of {format(new Date(), "yyyy")}.
        </p>
      </header>

      <WeeklySchedule currentWeek={currentWeek} onSelectWeek={setSelected} />

      <details className="mt-6 rounded-xl border bg-card p-4 text-sm">
        <summary className="min-h-6 cursor-pointer font-medium">Application guidelines</summary>
        <dl className="mt-3 space-y-3 text-muted-foreground">
          <div><dt className="font-medium text-card-foreground">Liquid applications</dt><dd>Apply in early morning or late afternoon. Ensure lawn is dry before and after application.</dd></div>
          <div><dt className="font-medium text-card-foreground">Granular applications</dt><dd>Water in thoroughly after application. Best applied before rain or irrigation.</dd></div>
          <div><dt className="font-medium text-card-foreground">Insecticide applications</dt><dd>Follow label instructions carefully. Avoid application during flowering periods.</dd></div>
          <div><dt className="font-medium text-card-foreground">Rest weeks</dt><dd>Allow lawn to recover. Focus on regular mowing and irrigation management.</dd></div>
        </dl>
      </details>

      <WeekDetailSheet
        entry={selected}
        currentWeek={currentWeek}
        onClose={() => setSelected(null)}
        onOpenInThisWeek={(week) => setLocation(`/?week=${week}`)}
      />
    </main>
  );
}
