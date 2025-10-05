import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type WeeklySchedule as WeeklyScheduleType } from "@shared/schema";

interface WeeklyScheduleProps {
  currentWeek?: number;
  className?: string;
}

export default function WeeklySchedule({ currentWeek = 1, className = "" }: WeeklyScheduleProps) {
  const { data: schedule, isLoading, error } = useQuery<WeeklyScheduleType[]>({
    queryKey: ["/api/schedule"],
  });
  
  const getVariantForType = (type: string) => {
    switch (type) {
      case 'liquid': return 'default';
      case 'granular': return 'secondary';
      case 'insecticide': return 'destructive';
      case 'rest': return 'outline';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card className={className} data-testid="card-weekly-schedule">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Year-Round Application Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className} data-testid="card-weekly-schedule">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Year-Round Application Schedule
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Year-Round Application Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No schedule data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="card-weekly-schedule">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Year-Round Application Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {schedule.map((entry) => {
              const isCurrentWeek = currentWeek === entry.weekNumber;
              const products = Array.isArray(entry.products) ? entry.products.filter(
                (p: unknown): p is { name: string; quantity: number; unit: string } => 
                  typeof p === 'object' && p !== null && 
                  'name' in p && typeof (p as { name: unknown }).name === 'string'
              ) : [];
              return (
                <div 
                  key={entry.id} 
                  className={`p-3 rounded-md border transition-colors ${
                    isCurrentWeek ? 'bg-primary/10 border-primary' : 'bg-muted/30'
                  }`}
                  data-testid={`schedule-week-${entry.weekNumber - 1}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{entry.month} – Week {entry.weekOfMonth}</p>
                      {isCurrentWeek && (
                        <Badge variant="default" className="text-xs mt-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Current Week
                        </Badge>
                      )}
                    </div>
                    <Badge variant={getVariantForType(entry.applicationType)} className="text-xs">
                      {entry.applicationType}
                    </Badge>
                  </div>
                  
                  {products.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {products.map((product, productIndex: number) => (
                        <Badge key={productIndex} variant="outline" className="text-xs">
                          {product.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Rest week - no application</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}