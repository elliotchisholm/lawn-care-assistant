import { db } from "./db";
import { weeklySchedule } from "@shared/schema";

// Full 52-week schedule based on NZLA Application Guide
// https://www.newzealandlawnaddicts.com/application-guide/
const scheduleData = [
  // JANUARY (Summer - Active growth period)
  {
    weekNumber: 1,
    month: "January",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
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
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
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
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid N", quantity: 350, unit: "ml", type: "liquid" }
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
  // FEBRUARY (Late summer)
  {
    weekNumber: 5,
    month: "February",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
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
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
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
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
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
  // MARCH (Autumn - Transition period)
  {
    weekNumber: 9,
    month: "March",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" }
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
      { name: "Grub+", quantity: 15, unit: "ml", type: "insecticide" }
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
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
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
      { name: "NZLA All Seasons", quantity: 2000, unit: "g", type: "granular" }
    ],
    applicationNotes: "Apply 2kg per 100m².",
    irrigationNotes: "Follow with 5-7mm of irrigation."
  },
  // APRIL (Mid-autumn)
  {
    weekNumber: 13,
    month: "April",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 14,
    month: "April",
    weekOfMonth: 2,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 15,
    month: "April",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Charger", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Tank mix all products together.",
    irrigationNotes: null
  },
  {
    weekNumber: 16,
    month: "April",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // MAY (Late autumn - Reduced applications)
  {
    weekNumber: 17,
    month: "May",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first, follow with irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 18,
    month: "May",
    weekOfMonth: 2,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 19,
    month: "May",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: null,
    irrigationNotes: null
  },
  {
    weekNumber: 20,
    month: "May",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // JUNE (Winter - Minimal applications)
  {
    weekNumber: 21,
    month: "June",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Light feeding to maintain root health.",
    irrigationNotes: null
  },
  {
    weekNumber: 22,
    month: "June",
    weekOfMonth: 2,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 23,
    month: "June",
    weekOfMonth: 3,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 24,
    month: "June",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // JULY (Mid-winter - Minimal applications)
  {
    weekNumber: 25,
    month: "July",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Light feeding to maintain root health.",
    irrigationNotes: null
  },
  {
    weekNumber: 26,
    month: "July",
    weekOfMonth: 2,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 27,
    month: "July",
    weekOfMonth: 3,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 28,
    month: "July",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // AUGUST (Late winter - Start ramping up)
  {
    weekNumber: 29,
    month: "August",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Preparing for spring growth.",
    irrigationNotes: null
  },
  {
    weekNumber: 30,
    month: "August",
    weekOfMonth: 2,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Can be applied as foliar or irrigated as soil application.",
    irrigationNotes: "Optional - can be applied as foliar or watered in as soil application."
  },
  {
    weekNumber: 31,
    month: "August",
    weekOfMonth: 3,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 32,
    month: "August",
    weekOfMonth: 4,
    applicationType: "granular",
    waterVolume: "0",
    products: [
      { name: "NZLA All Seasons", quantity: 2000, unit: "g", type: "granular" }
    ],
    applicationNotes: "Apply 2kg per 100m² to prepare for spring growth.",
    irrigationNotes: "Follow with 5-7mm of irrigation."
  },
  // SEPTEMBER (Early spring - Active growth resumes)
  {
    weekNumber: 33,
    month: "September",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 34,
    month: "September",
    weekOfMonth: 2,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Can be applied as foliar or irrigated as soil application.",
    irrigationNotes: "Optional - can be applied as foliar or watered in as soil application."
  },
  {
    weekNumber: 35,
    month: "September",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid N", quantity: 350, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Liquid N needs irrigation within 24 hours. Allow 6-8 hours for foliar absorption first.",
    irrigationNotes: "Irrigate within 24 hours after 6-8 hour foliar absorption period."
  },
  {
    weekNumber: 36,
    month: "September",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // OCTOBER (Mid-spring - Active growth)
  {
    weekNumber: 37,
    month: "October",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 38,
    month: "October",
    weekOfMonth: 2,
    applicationType: "insecticide",
    waterVolume: "0",
    products: [
      { name: "Grub+", quantity: 15, unit: "ml", type: "insecticide" }
    ],
    applicationNotes: "Apply at 15ml per 100m². Follow with 3-6mm irrigation unless treating caterpillars, then delay 24 hours.",
    irrigationNotes: "3-6mm irrigation after application (delay 24 hours for caterpillars like Porina)."
  },
  {
    weekNumber: 39,
    month: "October",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Amino can be tank mixed or applied 6 hours later and watered in.",
    irrigationNotes: "Optional for Amino - can be foliar or soil application."
  },
  {
    weekNumber: 40,
    month: "October",
    weekOfMonth: 4,
    applicationType: "granular",
    waterVolume: "0",
    products: [
      { name: "NZLA All Seasons", quantity: 2000, unit: "g", type: "granular" }
    ],
    applicationNotes: "Apply 2kg per 100m².",
    irrigationNotes: "Follow with 5-7mm of irrigation."
  },
  // NOVEMBER (Late spring - Peak growth)
  {
    weekNumber: 41,
    month: "November",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 42,
    month: "November",
    weekOfMonth: 2,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Can be applied as foliar or irrigated as soil application.",
    irrigationNotes: "Optional - can be applied as foliar or watered in as soil application."
  },
  {
    weekNumber: 43,
    month: "November",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid N", quantity: 350, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Liquid N needs irrigation within 24 hours. Allow 6-8 hours for foliar absorption first.",
    irrigationNotes: "Irrigate within 24 hours after 6-8 hour foliar absorption period."
  },
  {
    weekNumber: 44,
    month: "November",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // DECEMBER (Early summer - Active growth)
  {
    weekNumber: 45,
    month: "December",
    weekOfMonth: 1,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first, follow with 15-20mm irrigation. The following day, apply remaining products.",
    irrigationNotes: "Follow Wetter application with 15-20mm of irrigation."
  },
  {
    weekNumber: 46,
    month: "December",
    weekOfMonth: 2,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Can be applied as foliar or irrigated as soil application.",
    irrigationNotes: "Optional - can be applied as foliar or watered in as soil application."
  },
  {
    weekNumber: 47,
    month: "December",
    weekOfMonth: 3,
    applicationType: "liquid",
    waterVolume: "5",
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid N", quantity: 350, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Liquid N needs irrigation within 24 hours. Allow 6-8 hours for foliar absorption first.",
    irrigationNotes: "Irrigate within 24 hours after 6-8 hour foliar absorption period."
  },
  {
    weekNumber: 48,
    month: "December",
    weekOfMonth: 4,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  // Extra weeks for years with 53 weeks (weeks 49-52)
  {
    weekNumber: 49,
    month: "December",
    weekOfMonth: 5,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 50,
    month: "December",
    weekOfMonth: 6,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 51,
    month: "December",
    weekOfMonth: 7,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  },
  {
    weekNumber: 52,
    month: "December",
    weekOfMonth: 8,
    applicationType: "rest",
    waterVolume: "0",
    products: [],
    applicationNotes: "Rest week - no applications.",
    irrigationNotes: null
  }
];

async function seedWeeklySchedule() {
  try {
    console.log("Seeding weekly schedule...");
    
    for (const week of scheduleData) {
      await db.insert(weeklySchedule)
        .values(week)
        .onConflictDoUpdate({
          target: weeklySchedule.weekNumber,
          set: {
            month: week.month,
            weekOfMonth: week.weekOfMonth,
            applicationType: week.applicationType,
            waterVolume: week.waterVolume,
            products: week.products,
            applicationNotes: week.applicationNotes,
            irrigationNotes: week.irrigationNotes
          }
        });
    }
    
    console.log(`Successfully seeded ${scheduleData.length} weeks of schedule data`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding weekly schedule:", error);
    process.exit(1);
  }
}

seedWeeklySchedule();
