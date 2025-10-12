import { seedWeeklySchedule } from "./seedWeeklySchedule";

export async function initializeApplication() {
  // Seed weekly schedule data
  await seedWeeklySchedule();
  console.log("Initialization completed successfully");
}