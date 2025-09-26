import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CheckCircle2 } from "lucide-react";

interface WeekEntry {
  month: string;
  week: number;
  products: string[];
  type: 'liquid' | 'granular' | 'insecticide' | 'rest';
  isCurrentWeek?: boolean;
}

interface WeeklyScheduleProps {
  currentWeek?: number;
  className?: string;
}

// Mock data for the full year schedule based on NZLA guide
const mockSchedule: WeekEntry[] = [
  { month: "January", week: 1, products: ["Wetter 3W", "Nurture", "Root Health", "Humic+", "Iron+"], type: "liquid" },
  { month: "January", week: 2, products: ["Amino"], type: "liquid" },
  { month: "January", week: 3, products: ["Restore", "Iron+", "Liquid N"], type: "liquid" },
  { month: "January", week: 4, products: [], type: "rest" },
  { month: "February", week: 1, products: ["Wetter 3W", "Nurture", "Root Health", "Humic+", "Iron+"], type: "liquid" },
  { month: "February", week: 2, products: ["Amino"], type: "liquid" },
  { month: "February", week: 3, products: ["Restore", "Iron+"], type: "liquid" },
  { month: "February", week: 4, products: [], type: "rest" },
  { month: "March", week: 1, products: ["Wetter 3W", "Nurture", "Root Health", "Humic+", "Liquid Boost"], type: "liquid" },
  { month: "March", week: 2, products: ["Grub+"], type: "insecticide" },
  { month: "March", week: 3, products: ["Restore", "Liquid Boost", "Amino"], type: "liquid" },
  { month: "March", week: 4, products: ["All Seasons"], type: "granular" },
  { month: "April", week: 1, products: ["Wetter 3W", "Nurture", "Root Health", "Humic+", "Liquid Boost"], type: "liquid" },
  { month: "April", week: 2, products: [], type: "rest" },
  { month: "April", week: 3, products: ["Restore", "Liquid Boost", "Charger"], type: "liquid" }
];

export default function WeeklySchedule({ currentWeek = 1, className = "" }: WeeklyScheduleProps) {
  const getVariantForType = (type: WeekEntry['type']) => {
    switch (type) {
      case 'liquid': return 'default';
      case 'granular': return 'secondary';
      case 'insecticide': return 'destructive';
      case 'rest': return 'outline';
      default: return 'default';
    }
  };

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
            {mockSchedule.map((entry, index) => {
              const isCurrentWeek = currentWeek === index + 1;
              return (
                <div 
                  key={index} 
                  className={`p-3 rounded-md border transition-colors ${
                    isCurrentWeek ? 'bg-primary/10 border-primary' : 'bg-muted/30'
                  }`}
                  data-testid={`schedule-week-${index}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{entry.month} – Week {entry.week}</p>
                      {isCurrentWeek && (
                        <Badge variant="default" className="text-xs mt-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Current Week
                        </Badge>
                      )}
                    </div>
                    <Badge variant={getVariantForType(entry.type)} className="text-xs">
                      {entry.type}
                    </Badge>
                  </div>
                  
                  {entry.products.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {entry.products.map((product, productIndex) => (
                        <Badge key={productIndex} variant="outline" className="text-xs">
                          {product}
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