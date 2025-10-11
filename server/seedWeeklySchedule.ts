import { db } from "./db";
import { weeklySchedule } from "@shared/schema";
import { parseScheduleMarkdown } from "./parseSchedule";
import path from "path";

async function seedWeeklySchedule() {
  try {
    console.log("Seeding weekly schedule from NZLA application guide...");
    
    // Parse the markdown file
    const scheduleFile = path.join(process.cwd(), 'attached_assets', 'nzla-application-guide_1760214730776.md');
    const parsedWeeks = parseScheduleMarkdown(scheduleFile);
    
    console.log(`Parsed ${parsedWeeks.length} weeks from schedule file`);
    
    // Add missing weeks 33, 34, 35 as rest weeks
    const missingWeeks = [
      {
        weekNumber: 33,
        month: "August",
        weekOfMonth: 5,
        isRestWeek: true,
        applicationDays: [],
        generalNotes: null
      },
      {
        weekNumber: 34,
        month: "September",
        weekOfMonth: 1,
        isRestWeek: true,
        applicationDays: [],
        generalNotes: null
      },
      {
        weekNumber: 35,
        month: "September",
        weekOfMonth: 1,
        isRestWeek: true,
        applicationDays: [],
        generalNotes: null
      }
    ];
    
    const allWeeks = [...parsedWeeks, ...missingWeeks].sort((a, b) => a.weekNumber - b.weekNumber);
    
    console.log(`Total weeks to seed: ${allWeeks.length}`);
    
    // Convert to database format and insert
    for (const week of allWeeks) {
      await db.insert(weeklySchedule)
        .values({
          weekNumber: week.weekNumber,
          month: week.month,
          weekOfMonth: week.weekOfMonth,
          isRestWeek: week.isRestWeek ? 1 : 0,
          applicationDays: week.applicationDays as any, // jsonb field
          generalNotes: week.generalNotes
        })
        .onConflictDoUpdate({
          target: weeklySchedule.weekNumber,
          set: {
            month: week.month,
            weekOfMonth: week.weekOfMonth,
            isRestWeek: week.isRestWeek ? 1 : 0,
            applicationDays: week.applicationDays as any,
            generalNotes: week.generalNotes
          }
        });
    }
    
    console.log(`✓ Successfully seeded ${allWeeks.length} weeks of NZLA application schedule`);
    
    // Verify data
    const count = await db.select().from(weeklySchedule);
    console.log(`✓ Database now contains ${count.length} weeks`);
    
    // Show sample of rest week
    const restWeek = allWeeks.find(w => w.isRestWeek);
    console.log(`\nSample rest week (Week ${restWeek?.weekNumber}):`, JSON.stringify(restWeek, null, 2));
    
    // Show sample of multi-day week
    const multiDayWeek = allWeeks.find(w => w.applicationDays.length > 1);
    console.log(`\nSample multi-day week (Week ${multiDayWeek?.weekNumber}):`, JSON.stringify(multiDayWeek, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding weekly schedule:", error);
    process.exit(1);
  }
}

seedWeeklySchedule();
