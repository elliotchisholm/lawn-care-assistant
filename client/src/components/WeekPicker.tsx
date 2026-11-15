import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import { WEEKS_IN_SCHEDULE } from "@/lib/week";
import { cn } from "@/lib/utils";

interface WeekPickerProps {
  value: number;
  currentWeek: number;
  onChange: (week: number) => void;
}

const WEEKS = Array.from({ length: WEEKS_IN_SCHEDULE }, (_, i) => i + 1);

/** Prev/next stepper plus a sheet listing all 52 weeks. */
export default function WeekPicker({ value, currentWeek, onChange }: WeekPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2" data-testid="week-picker">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-12 w-12"
        aria-label="Previous week"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        data-testid="button-week-prev"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-12 flex-1 justify-center gap-2 text-base"
        onClick={() => setOpen(true)}
        data-testid="select-week"
      >
        <Calendar className="h-4 w-4" aria-hidden="true" />
        Week {value}
        {value === currentWeek ? " (current)" : ""}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-12 w-12"
        aria-label="Next week"
        disabled={value >= WEEKS_IN_SCHEDULE}
        onClick={() => onChange(value + 1)}
        data-testid="button-week-next"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <ResponsiveSheet open={open} onOpenChange={setOpen} title="Select week">
        <div className="grid max-h-[60vh] grid-cols-4 gap-2 overflow-y-auto">
          {WEEKS.map((week) => (
            <Button
              key={week}
              type="button"
              variant={week === value ? "default" : "outline"}
              className={cn("h-12", week === currentWeek && week !== value && "border-primary")}
              aria-current={week === currentWeek ? "date" : undefined}
              onClick={() => {
                onChange(week);
                setOpen(false);
              }}
              data-testid={`option-week-${week}`}
            >
              {week}
            </Button>
          ))}
        </div>
      </ResponsiveSheet>
    </div>
  );
}
