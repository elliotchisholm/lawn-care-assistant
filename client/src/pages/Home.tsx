import { useState } from "react";
import { format, startOfYear, differenceInWeeks } from "date-fns";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CurrentWeekDisplay from "@/components/CurrentWeekDisplay";
import LawnSizeCalculator from "@/components/LawnSizeCalculator";
import ProductCard from "@/components/ProductCard";
import WeeklySchedule from "@/components/WeeklySchedule";
import InventoryManager from "@/components/InventoryManager";

// Mock data based on NZLA application guide
interface ApplicationWeek {
  month: string;
  week: number;
  products: Array<{
    name: string;
    quantity: number;
    unit: string;
    type: 'liquid' | 'granular';
  }>;
  waterVolume: number;
  applicationNotes?: string;
}

const applicationGuide: ApplicationWeek[] = [
  // January
  {
    month: "January", week: 1, waterVolume: 5,
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first with 15-20mm irrigation. Apply other products the following day."
  },
  {
    month: "January", week: 2, waterVolume: 5,
    products: [{ name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }],
    applicationNotes: "Can be applied as foliar or watered in as soil application."
  },
  {
    month: "January", week: 3, waterVolume: 5,
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid N", quantity: 350, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Liquid N needs irrigation within 24 hours. Allow 6-8 hours for foliar absorption first."
  },
  // February
  {
    month: "February", week: 1, waterVolume: 5,
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first with 15-20mm irrigation. Apply other products the following day."
  },
  {
    month: "February", week: 2, waterVolume: 5,
    products: [{ name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }],
    applicationNotes: "Can be applied as foliar or watered in as soil application."
  },
  {
    month: "February", week: 3, waterVolume: 5,
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" }
    ]
  },
  // March
  {
    month: "March", week: 1, waterVolume: 5,
    products: [
      { name: "NZLA Wetter", quantity: 250, unit: "ml", type: "liquid" },
      { name: "Nurture", quantity: 400, unit: "ml", type: "liquid" },
      { name: "Root Health", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Humic+", quantity: 50, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" }
    ],
    applicationNotes: "Apply Wetter first with 15-20mm irrigation. Apply other products the following day."
  },
  {
    month: "March", week: 2, waterVolume: 0,
    products: [{ name: "Grub+", quantity: 15, unit: "ml", type: "liquid" }],
    applicationNotes: "Follow with 3-6mm irrigation unless treating caterpillars (delay 24 hours)."
  },
  {
    month: "March", week: 3, waterVolume: 5,
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid Boost", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }
    ]
  },
  {
    month: "March", week: 4, waterVolume: 0,
    products: [{ name: "NZLA All Seasons", quantity: 2000, unit: "g", type: "granular" }],
    applicationNotes: "Follow with 5-7mm of irrigation."
  }
];

export default function Home() {
  const [lawnSize, setLawnSize] = useState(100);
  const currentDate = new Date();
  const yearStart = startOfYear(currentDate);
  const weekNumber = differenceInWeeks(currentDate, yearStart) + 1;
  
  // Get current week's application (cycling through available data)
  const currentApplicationIndex = (weekNumber - 1) % applicationGuide.length;
  const currentApplication = applicationGuide[currentApplicationIndex];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <CurrentWeekDisplay />
            <LawnSizeCalculator 
              currentSize={lawnSize} 
              onSizeChange={setLawnSize}
            />
            <InventoryManager />
          </div>
          
          {/* Center Column - Main Product Recommendation */}
          <div className="lg:col-span-2 space-y-6">
            {currentApplication && (
              <ProductCard
                products={currentApplication.products}
                waterVolume={currentApplication.waterVolume}
                lawnSize={lawnSize}
                applicationNotes={currentApplication.applicationNotes}
              />
            )}
            
            {/* Weekly Schedule */}
            <WeeklySchedule currentWeek={weekNumber} />
          </div>
        </div>
        
        {/* Footer Information */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-3">Important Application Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="mb-2"><strong>Timing:</strong></p>
              <ul className="space-y-1">
                <li>• Apply minimum 6 hours after mowing</li>
                <li>• Temperature should not exceed 25°C</li>
                <li>• Apply to dry foliage</li>
              </ul>
            </div>
            <div>
              <p className="mb-2"><strong>Post-Application:</strong></p>
              <ul className="space-y-1">
                <li>• Avoid mowing for 24 hours</li>
                <li>• Follow irrigation guidelines per product</li>
                <li>• All rates based on 100m² coverage</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}