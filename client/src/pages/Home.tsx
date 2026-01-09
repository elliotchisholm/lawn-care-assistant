import { useState, useEffect } from "react";
import { format, startOfYear, differenceInWeeks } from "date-fns";
import { ExternalLink, Lock, BarChart3, ShoppingCart, LogIn, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type User, type WeeklySchedule, type ApplicationDay } from "@shared/schema";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CurrentWeekDisplay from "@/components/CurrentWeekDisplay";
import LawnSizeCalculator from "@/components/LawnSizeCalculator";
import ProductCard from "@/components/ProductCard";
import InventoryManager from "@/components/InventoryManager";
import PurchaseRecommendations from "@/components/PurchaseRecommendations";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [lawnSize, setLawnSize] = useState(100);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();
  const currentDate = new Date();
  const yearStart = startOfYear(currentDate);
  const currentWeekNumber = differenceInWeeks(currentDate, yearStart) + 1;
  
  // State for selected week (defaults to current week)
  const [selectedWeek, setSelectedWeek] = useState(currentWeekNumber);
  
  // Fetch selected week's application from database
  const weekQuery = useQuery<WeeklySchedule, Error>({
    queryKey: ["/api/schedule", selectedWeek],
    queryFn: async () => {
      const res = await fetch(`/api/schedule/${selectedWeek}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
  });
  const currentWeek = weekQuery.data;
  const isWeekLoading = weekQuery.isPending;
  const refetchWeek = weekQuery.refetch;

  // Check if this is a rest week or has application data
  const isRestWeek = currentWeek?.isRestWeek === 1;
  const hasApplicationDays = currentWeek && Array.isArray(currentWeek.applicationDays) && currentWeek.applicationDays.length > 0;

  // Fetch user data to get saved lawn size (only when authenticated)
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    enabled: isAuthenticated,
  });

  // Update lawn size mutation (only used when authenticated)
  const updateLawnSizeMutation = useMutation({
    mutationFn: async (newSize: number) => {
      setSaveSuccess(false);
      return await apiRequest('PUT', '/api/user/lawn-size', { lawnSize: newSize });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setSaveSuccess(true);
      toast({
        title: "Lawn size saved",
        description: "Your lawn size has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      setSaveSuccess(false);
      toast({
        title: "Error saving lawn size",
        description: error.message || "Failed to save lawn size. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update local state when user data is loaded
  useEffect(() => {
    if (user?.lawnSize) {
      setLawnSize(user.lawnSize);
    }
  }, [user?.lawnSize]);

  // Handle lawn size changes
  const handleLawnSizeChange = (newSize: number) => {
    setLawnSize(newSize);
    if (isAuthenticated) {
      updateLawnSizeMutation.mutate(newSize);
    }
  };

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
              onSizeChange={handleLawnSizeChange}
              isSaving={updateLawnSizeMutation.isPending}
              isLoading={isUserLoading}
              saveSuccess={saveSuccess}
            />
          </div>
          
          {/* Right Column - Product Application, Inventory, and Purchase Recommendations */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Week Selector */}
            <Card data-testid="card-week-selector">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-primary" />
                  Select Application Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Select 
                    value={selectedWeek.toString()} 
                    onValueChange={(value) => setSelectedWeek(parseInt(value))}
                  >
                    <SelectTrigger className="w-full" data-testid="select-week">
                      <SelectValue placeholder="Select a week" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                        <SelectItem key={week} value={week.toString()} data-testid={`option-week-${week}`}>
                          Week {week} {week === currentWeekNumber && "(Current Week)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {isWeekLoading && (
              <Skeleton className="h-96 w-full" data-testid="skeleton-loading-application" />
            )}
            {weekQuery.isError && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded space-y-3" data-testid="error-application">
                <div>
                  <p className="font-medium">Failed to load weekly application schedule</p>
                  <p className="text-sm">The server may still be initializing. Please try again.</p>
                </div>
                <Button 
                  onClick={() => refetchWeek()} 
                  variant="destructive" 
                  size="sm"
                  data-testid="button-retry-schedule"
                >
                  Retry Now
                </Button>
              </div>
            )}
            {Boolean(weekQuery.isSuccess && isRestWeek) && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-6 text-center space-y-3" data-testid="card-rest-week">
                <h3 className="text-lg font-semibold">🌿 Rest Period - No Application</h3>
                <p className="text-sm text-muted-foreground">
                  This week requires no product application
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>Focus on regular lawn maintenance:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Regular mowing at appropriate height</li>
                    <li>• Watering as needed based on weather</li>
                    <li>• Lawn observation and weed monitoring</li>
                  </ul>
                </div>
              </div>
            )}
            {Boolean(weekQuery.isSuccess && hasApplicationDays && currentWeek?.applicationDays) && currentWeek && (
              <ProductCard
                applicationDays={currentWeek.applicationDays as ApplicationDay[]}
                lawnSize={lawnSize}
                weekNumber={selectedWeek}
                isCurrentWeek={selectedWeek === currentWeekNumber}
              />
            )}
            
            {/* Show Inventory Manager when authenticated, otherwise show locked preview */}
            {isAuthenticated ? (
              <InventoryManager />
            ) : (
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
            )}
            
            {/* Show Purchase Recommendations when authenticated, otherwise show locked preview */}
            {isAuthenticated ? (
              <PurchaseRecommendations lawnSize={lawnSize} />
            ) : (
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
