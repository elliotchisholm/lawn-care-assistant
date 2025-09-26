import { format, startOfYear, differenceInWeeks } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface CurrentWeekDisplayProps {
  date?: Date;
}

export default function CurrentWeekDisplay({ date = new Date() }: CurrentWeekDisplayProps) {
  const currentDate = date;
  const yearStart = startOfYear(currentDate);
  const weekNumber = differenceInWeeks(currentDate, yearStart) + 1;
  const month = format(currentDate, "MMMM");
  const formattedDate = format(currentDate, "EEEE, MMMM do, yyyy");
  
  // Calculate which week of the month (1-4)
  const weekOfMonth = Math.ceil(weekNumber / 4.33) % 4 || 4;

  return (
    <Card className="bg-primary/5" data-testid="card-current-week">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Current Application Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground" data-testid="text-current-date">{formattedDate}</p>
            <p className="text-lg font-semibold" data-testid="text-application-period">
              {month} – Week {weekOfMonth}
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Week {weekNumber}
          </Badge>
        </div>
        <div className="p-3 bg-card rounded-md border">
          <p className="text-sm font-medium text-card-foreground">
            Application Guidelines:
          </p>
          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
            <li>• Apply minimum 6 hours after mowing</li>
            <li>• Temperature should not exceed 25°C</li>
            <li>• Avoid mowing for 24 hours after application</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}