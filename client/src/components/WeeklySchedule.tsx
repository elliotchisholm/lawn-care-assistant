import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type WeeklySchedule as WeeklyScheduleType } from "@shared/schema";
import { getProductSummaries, groupByMonth } from "@/lib/scheduleUtils";
import { cn } from "@/lib/utils";

interface WeeklyScheduleProps {
  currentWeek?: number;
  className?: string;
  onSelectWeek?: (entry: WeeklyScheduleType) => void;
}

const TYPE_DOT: Record<string, string> = {
  liquid: "bg-primary",
  granular: "bg-secondary-foreground/60",
  insecticide: "bg-destructive",
};

export default function WeeklySchedule({ currentWeek = 1, className = "", onSelectWeek }: WeeklyScheduleProps) {
  const { data: schedule, isLoading, error } = useQuery<WeeklyScheduleType[]>({
    queryKey: ["/api/schedule"],
  });
  const currentRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (schedule && schedule.length > 0) {
      currentRef.current?.scrollIntoView?.({ block: "center" });
    }
  }, [schedule]);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)} data-testid="card-weekly-schedule">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className} data-testid="card-weekly-schedule">
        <CardHeader>
          <CardTitle>Year-Round Application Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load schedule. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (!schedule || schedule.length === 0) {
    return (
      <Card className={className} data-testid="card-weekly-schedule">
        <CardHeader>
          <CardTitle>Year-Round Application Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No schedule data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)} data-testid="card-weekly-schedule">
      {groupByMonth(schedule).map(({ month, weeks }) => (
        <section key={month} aria-labelledby={`month-${month}`}>
          <h2
            id={`month-${month}`}
            className="sticky top-16 z-10 -mx-1 bg-background/95 px-1 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur"
          >
            {month}
          </h2>
          <ul className="space-y-2">
            {weeks.map((entry) => {
              const isCurrent = entry.weekNumber === currentWeek;
              const isRest = entry.isRestWeek === 1;
              const products = getProductSummaries(entry);
              return (
                <li key={entry.id} ref={isCurrent ? currentRef : undefined}>
                  <button
                    type="button"
                    onClick={() => onSelectWeek?.(entry)}
                    aria-current={isCurrent ? "date" : undefined}
                    className={cn(
                      "flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover-elevate",
                      isCurrent ? "border-primary bg-primary/10" : isRest ? "bg-muted/30 text-muted-foreground" : "bg-card",
                    )}
                    data-testid={`schedule-week-${entry.weekNumber - 1}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums">
                      {entry.weekNumber}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">Week {entry.weekOfMonth}</span>
                        {isCurrent && (
                          <Badge className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Current
                          </Badge>
                        )}
                      </span>
                      {isRest ? (
                        <span className="block text-sm italic">Rest week</span>
                      ) : (
                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                          {products.map((p, i) => (
                            <span key={i} className="inline-flex items-center gap-1">
                              <span className={cn("h-2 w-2 rounded-full", TYPE_DOT[p.type] ?? "bg-muted-foreground")} aria-hidden="true" />
                              {p.name}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
