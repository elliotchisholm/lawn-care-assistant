import { db } from "./db";
import { weeklySchedule } from "@shared/schema";
import { parseScheduleMarkdown } from "./parseSchedule";
import path from "path";

export async function seedWeeklySchedule() {
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
    
    return allWeeks.length;
  } catch (error) {
    console.error("Error seeding weekly schedule:", error);
    throw error;
  }
}

// Run seeding when executed directly (ES modules syntax)
// Only run standalone if explicitly called with tsx/node directly
// This prevents execution when bundled by esbuild for production
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
const isStandalone = process.env.NODE_ENV !== 'production' && isMainModule;

if (isStandalone) {
  seedWeeklySchedule()
    .then(() => {
      console.log("Seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
