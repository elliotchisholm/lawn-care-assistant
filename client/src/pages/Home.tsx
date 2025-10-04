import { useState } from "react";
import { format, startOfYear, differenceInWeeks } from "date-fns";
import { ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CurrentWeekDisplay from "@/components/CurrentWeekDisplay";
import LawnSizeCalculator from "@/components/LawnSizeCalculator";
import ProductCard from "@/components/ProductCard";
import InventoryManager from "@/components/InventoryManager";
import PurchaseRecommendations from "@/components/PurchaseRecommendations";

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
        
        {/* Attribution Banner */}
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground">
                <strong>Content Source:</strong> All application calculations, product recommendations, and guidance are based on the{" "}
                <a 
                  href="https://www.newzealandlawnaddicts.com/application-guide" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline font-medium"
                  data-testid="link-nzla-guide"
                >
                  New Zealand Lawn Addicts Application Guide
                </a>
                .
              </p>
              <p className="text-muted-foreground mt-1">
                The application guide and its content are the intellectual property of New Zealand Lawn Addicts. This tool provides calculations and tracking based on their guidance.
              </p>
            </div>
          </div>
        </div>
        
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
            
            {/* Purchase Recommendations */}
            <PurchaseRecommendations lawnSize={lawnSize} />
          </div>
        </div>
      </main>
    </div>
  );
}