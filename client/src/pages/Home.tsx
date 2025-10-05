import { useState } from "react";
import { format, startOfYear, differenceInWeeks } from "date-fns";
import { ExternalLink, Lock, BarChart3, ShoppingCart, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { type WeeklySchedule } from "@shared/schema";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CurrentWeekDisplay from "@/components/CurrentWeekDisplay";
import LawnSizeCalculator from "@/components/LawnSizeCalculator";
import ProductCard from "@/components/ProductCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [lawnSize, setLawnSize] = useState(100);
  const currentDate = new Date();
  const yearStart = startOfYear(currentDate);
  const weekNumber = differenceInWeeks(currentDate, yearStart) + 1;
  
  // Fetch current week's application from database
  const { data: currentWeek } = useQuery<WeeklySchedule>({
    queryKey: ["/api/schedule", weekNumber],
  });

  // Transform database format to ProductCard format
  const currentApplication = currentWeek ? {
    products: (currentWeek.products as any[]).map((p: any) => ({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      type: currentWeek.applicationType === 'granular' ? 'granular' as const : 'liquid' as const
    })),
    waterVolume: parseFloat(currentWeek.waterVolume || "5"),
    applicationNotes: currentWeek.applicationNotes || undefined
  } : null;

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Attribution Banner */}
        <div className="bg-muted/50 border rounded-lg p-3 md:p-4 transition-all hover:bg-muted/70">
          <div className="flex items-start gap-2 md:gap-3">
            <ExternalLink className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm">
              <p className="text-foreground">
                <strong>Content Source:</strong> All application calculations, product recommendations, and guidance are based on the{" "}
                <a 
                  href="https://www.newzealandlawnaddicts.com/application-guide" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline font-medium transition-colors"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="space-y-4 md:space-y-6">
            <CurrentWeekDisplay />
            <LawnSizeCalculator 
              currentSize={lawnSize} 
              onSizeChange={setLawnSize}
              isSaving={false}
              isLoading={false}
              saveSuccess={false}
            />
          </div>
          
          {/* Center Column - Main Product Recommendation */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {currentApplication && (
              <ProductCard
                products={currentApplication.products}
                waterVolume={currentApplication.waterVolume}
                lawnSize={lawnSize}
                applicationNotes={currentApplication.applicationNotes}
              />
            )}
            
            {/* Locked Feature Preview Cards */}
            {!isAuthenticated && (
              <div className="space-y-4 md:space-y-6">
                {/* Inventory Manager - Locked */}
                <Card className="relative overflow-hidden border-2 border-dashed opacity-60">
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="text-center space-y-3 p-6">
                      <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Sign in to unlock Inventory Tracking</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Track your product stocks, monitor inventory levels, and never run out of essential lawn care products.
                        </p>
                        <Button onClick={handleLogin} data-testid="button-login-inventory" className="opacity-100">
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In to Unlock
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardHeader className="blur-sm">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Product Inventory
                    </CardTitle>
                    <CardDescription>
                      Track your current stock levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="blur-sm">
                    <div className="space-y-3">
                      <div className="h-20 bg-muted rounded-md"></div>
                      <div className="h-20 bg-muted rounded-md"></div>
                      <div className="h-20 bg-muted rounded-md"></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Purchase Recommendations - Locked */}
                <Card className="relative overflow-hidden border-2 border-dashed opacity-60">
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="text-center space-y-3 p-6">
                      <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Sign in to unlock Purchase Recommendations</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get 8-week forecasts, automatic purchase alerts, and suggested quantities based on your inventory.
                        </p>
                        <Button onClick={handleLogin} data-testid="button-login-purchase" className="opacity-100">
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In to Unlock
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardHeader className="blur-sm">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      Purchase Recommendations
                    </CardTitle>
                    <CardDescription>
                      Smart purchase planning and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="blur-sm">
                    <div className="space-y-3">
                      <div className="h-16 bg-muted rounded-md"></div>
                      <div className="h-16 bg-muted rounded-md"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
