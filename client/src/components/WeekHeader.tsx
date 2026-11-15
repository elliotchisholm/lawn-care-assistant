import { Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WeekPicker from "@/components/WeekPicker";
import type { WeeklySchedule } from "@shared/schema";

interface WeekHeaderProps {
  selectedWeek: number;
  currentWeek: number;
  onWeekChange: (week: number) => void;
  week?: WeeklySchedule;
  lawnSize: number;
  onLawnSizeClick: () => void;
}

export default function WeekHeader({
  selectedWeek,
  currentWeek,
  onWeekChange,
  week,
  lawnSize,
  onLawnSizeClick,
}: WeekHeaderProps) {
  const isCurrent = selectedWeek === currentWeek;
  const isRest = week?.isRestWeek === 1;

  return (
    <section className="space-y-3 rounded-xl border bg-primary/5 p-4" data-testid="card-current-week">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-4xl font-semibold leading-none tabular-nums" data-testid="text-week-number">
            Week {selectedWeek}
          </p>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-application-period">
            {week ? `${week.month} – Week ${week.weekOfMonth}` : "Loading..."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isCurrent ? <Badge>Current week</Badge> : <Badge variant="outline">Not current</Badge>}
          {week ? (
            <Badge variant={isRest ? "secondary" : "outline"}>{isRest ? "Rest week" : "Application"}</Badge>
          ) : null}
        </div>
      </div>

      <div data-testid="card-week-selector">
        <WeekPicker value={selectedWeek} currentWeek={currentWeek} onChange={onWeekChange} />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full justify-between"
        onClick={onLawnSizeClick}
        data-testid="button-open-lawn-size"
      >
        <span className="flex items-center gap-2">
          <Ruler className="h-4 w-4" aria-hidden="true" />
          Lawn size
        </span>
        <span className="font-semibold tabular-nums">{lawnSize} m²</span>
      </Button>

      <details className="rounded-md border bg-card p-3 text-sm">
        <summary className="min-h-6 cursor-pointer font-medium">Application guidelines</summary>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Apply minimum 6 hours after mowing</li>
          <li>• Temperature should not exceed 25°C</li>
          <li>• Avoid mowing for 24 hours after application</li>
        </ul>
      </details>
    </section>
  );
}
