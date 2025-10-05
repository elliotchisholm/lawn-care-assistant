import { db } from "./db";
import { weeklySchedule } from "@shared/schema";

const scheduleData = [
  // January
  {
    weekNumber: 1,
    month: "January",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml" },
      { name: "Nurture", quantity: 400, unit: "ml" },
      { name: "Root Health", quantity: 50, unit: "ml" },
      { name: "Humic+", quantity: 50, unit: "ml" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 2,
    month: "January",
    weekOfMonth: 2,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Amino", quantity: 200, unit: "ml" }
    ],
    applicationNotes: "Can be applied as foliar or irrigated as soil application.",
    irrigationNotes: "Optional - can be applied as foliar or watered in as soil application."
  },
  {
    weekNumber: 3,
    month: "January",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml" },
      { name: "Liquid N", quantity: 350, unit: "ml" }
    ],
    applicationNotes: "Liquid N needs irrigation within 24 hours. Allow 6-8 hours for foliar absorption first.",
    irrigationNotes: "Irrigate within 24 hours after 6-8 hour foliar absorption period."
  },
  {
    weekNumber: 4,
    month: "January",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // February
  {
    weekNumber: 5,
    month: "February",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml" },
      { name: "Nurture", quantity: 400, unit: "ml" },
      { name: "Root Health", quantity: 50, unit: "ml" },
      { name: "Humic+", quantity: 50, unit: "ml" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 6,
    month: "February",
    weekOfMonth: 2,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Amino", quantity: 200, unit: "ml" }
    ],
    applicationNotes: "Can be applied as foliar or irrigated as soil application.",
    irrigationNotes: "Optional - can be applied as foliar or watered in as soil application."
  },
  {
    weekNumber: 7,
    month: "February",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml" }
    ],
    applicationNotes: null,
    irrigationNotes: null
  },
  {
    weekNumber: 8,
    month: "February",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // March
  {
    weekNumber: 9,
    month: "March",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml" },
      { name: "Nurture", quantity: 400, unit: "ml" },
      { name: "Root Health", quantity: 50, unit: "ml" },
      { name: "Humic+", quantity: 50, unit: "ml" },
      { name: "Liquid Boost", quantity: 200, unit: "ml" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 10,
    month: "March",
    weekOfMonth: 2,
    applicationType: "insecticide",
    waterVolume: "0",
    products: [
      { name: "Grub+", quantity: 15, unit: "ml" }
    ],
    applicationNotes: "Apply at 15ml per 100m². Follow with 3-6mm irrigation unless treating caterpillars, then delay 24 hours.",
    irrigationNotes: "3-6mm irrigation after application (delay 24 hours for caterpillars like Porina)."
  },
  {
    weekNumber: 11,
    month: "March",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml" },
      { name: "Liquid Boost", quantity: 200, unit: "ml" },
      { name: "NZLA Amino", quantity: 200, unit: "ml" }
    ],
    applicationNotes: "Amino can be tank mixed or applied 6 hours later and watered in.",
    irrigationNotes: "Optional for Amino - can be foliar or soil application."
  },
  {
    weekNumber: 12,
    month: "March",
    weekOfMonth: 4,
    applicationType: "granular",
    waterVolume: "0",
    products: [
      { name: "NZLA All Seasons", quantity: 2000, unit: "g" }
    ],
    applicationNotes: "Apply 2kg per 100m².",
    irrigationNotes: "Follow with 5-7mm of irrigation."
  },
  {
    weekNumber: 13,
    month: "April",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml" },
      { name: "Nurture", quantity: 400, unit: "ml" },
      { name: "Root Health", quantity: 50, unit: "ml" },
      { name: "Humic+", quantity: 50, unit: "ml" },
      { name: "Liquid Boost", quantity: 200, unit: "ml" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  }
  // Note: Only first 13 weeks extracted from the guide. Full year would continue...
];

async function seedWeeklySchedule() {
  try {
    console.log("Seeding weekly schedule...");
    
    for (const week of scheduleData) {
      await db.insert(weeklySchedule).values(week).onConflictDoNothing();
    }
    
    console.log(`Successfully seeded ${scheduleData.length} weeks of schedule data`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding weekly schedule:", error);
    process.exit(1);
  }
}

seedWeeklySchedule();
