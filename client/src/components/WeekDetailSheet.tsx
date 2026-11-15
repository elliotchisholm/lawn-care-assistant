import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import { useAppliedWeeks } from "@/hooks/useAppliedWeeks";
import { getApplicationDays } from "@/lib/scheduleUtils";
import type { WeeklySchedule } from "@shared/schema";

interface WeekDetailSheetProps {
  entry: WeeklySchedule | null;
  currentWeek: number;
  onClose: () => void;
  onOpenInThisWeek: (weekNumber: number) => void;
}

export default function WeekDetailSheet({ entry, currentWeek, onClose, onOpenInThisWeek }: WeekDetailSheetProps) {
  const { appliedWeeks } = useAppliedWeeks();

  if (!entry) return null;
  const days = getApplicationDays(entry);
  const isRest = entry.isRestWeek === 1;

  return (
    <ResponsiveSheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Week ${entry.weekNumber}`}
      description={`${entry.month}, week ${entry.weekOfMonth}${entry.weekNumber === currentWeek ? " (current week)" : ""}`}
      data-testid="sheet-week-detail"
      footer={
        <Button className="min-h-12" onClick={() => onOpenInThisWeek(entry.weekNumber)} data-testid="button-open-in-this-week">
          Open in This week
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={isRest ? "secondary" : "outline"}>{isRest ? "Rest week" : "Application"}</Badge>
          {appliedWeeks.has(entry.weekNumber) ? (
            <Badge data-testid="badge-week-applied">
              <Check className="mr-1 h-3 w-3" />
              Applied
            </Badge>
          ) : null}
        </div>

        {isRest ? (
          <p className="text-sm text-muted-foreground">No product application. Keep up regular mowing, watering and weed checks.</p>
        ) : (
          days.map((day, i) => (
            <div key={i} className="space-y-2">
              {day.dayLabel ? <h4 className="text-sm font-semibold text-primary">{day.dayLabel}</h4> : null}
              <ul className="space-y-1 text-sm">
                {day.products.map((p, j) => (
                  <li key={j} className="flex justify-between gap-3 rounded-md border p-2">
                    <span>
                      {p.name}
                      {p.alternativeName ? <span className="text-muted-foreground"> (or {p.alternativeName})</span> : null}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.quantity}
                      {p.unit}/100m²
                    </span>
                  </li>
                ))}
              </ul>
              {day.dayNotes ? <p className="text-sm italic text-muted-foreground">{day.dayNotes}</p> : null}
            </div>
          ))
        )}

        {entry.generalNotes ? <p className="text-sm text-muted-foreground">{entry.generalNotes}</p> : null}
      </div>
    </ResponsiveSheet>
  );
}
