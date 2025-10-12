import { seedWeeklySchedule } from "./seedWeeklySchedule";

export async function initializeApplication() {
  // Seed weekly schedule data
  await seedWeeklySchedule();
  
  // Use both to ensure message appears in production
  console.log("Initialization completed successfully");
  return true; // Explicitly return to ensure promise resolves
}