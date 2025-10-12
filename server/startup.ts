import { seedWeeklySchedule } from "./seedWeeklySchedule";

export async function initializeApplication() {
  try {
    // Seed weekly schedule data
    await seedWeeklySchedule();
  } catch (error) {
    console.error("Error initializing application:", error);
    throw error;
  }
}