import { Calendar } from "lucide-react";
import { format } from "date-fns";
import WeeklySchedule from "@/components/WeeklySchedule";
import Header from "@/components/Header";

export default function Schedule() {
  // Calculate current week of year (simple approximation)
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + 1) / 7);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
      <Header />
      
      <main className="container mx-auto px-4 pt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                NZLA Weekly Schedule
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow the New Zealand Lawn Association's comprehensive year-round application 
              schedule for optimal lawn health. Currently week {weekNumber} of {format(now, 'yyyy')}.
            </p>
          </div>

          {/* Weekly Schedule Component */}
          <WeeklySchedule currentWeek={weekNumber} className="mx-auto" />
          
          {/* Information Footer */}
          <div className="mt-8 p-6 rounded-lg bg-card border">
            <h3 className="text-lg font-semibold mb-3 text-card-foreground">Application Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-card-foreground mb-1">Liquid Applications:</p>
                <p>Apply in early morning or late afternoon. Ensure lawn is dry before and after application.</p>
              </div>
              <div>
                <p className="font-medium text-card-foreground mb-1">Granular Applications:</p>
                <p>Water in thoroughly after application. Best applied before rain or irrigation.</p>
              </div>
              <div>
                <p className="font-medium text-card-foreground mb-1">Insecticide Applications:</p>
                <p>Follow label instructions carefully. Avoid application during flowering periods.</p>
              </div>
              <div>
                <p className="font-medium text-card-foreground mb-1">Rest Weeks:</p>
                <p>Allow lawn to recover. Focus on regular mowing and irrigation management.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}