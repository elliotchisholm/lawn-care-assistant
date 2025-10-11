import { useState, useEffect } from "react";
import { format, startOfYear, differenceInWeeks } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, WeeklySchedule } from "@shared/schema";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CurrentWeekDisplay from "@/components/CurrentWeekDisplay";
import LawnSizeCalculator from "@/components/LawnSizeCalculator";
import ProductCard from "@/components/ProductCard";
import InventoryManager from "@/components/InventoryManager";
import PurchaseRecommendations from "@/components/PurchaseRecommendations";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [lawnSize, setLawnSize] = useState(100);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();
  const currentDate = new Date();
  const yearStart = startOfYear(currentDate);
  const weekNumber = differenceInWeeks(currentDate, yearStart) + 1;
  
  // Fetch current week's application from database
  const { data: currentWeek, isLoading: isWeekLoading, error: weekError } = useQuery<WeeklySchedule>({
    queryKey: ["/api/schedule", weekNumber],
  });

  // Check if this is a rest week or has application data
  const isRestWeek = currentWeek?.isRestWeek === 1;
  const hasApplicationDays = currentWeek && Array.isArray(currentWeek.applicationDays) && currentWeek.applicationDays.length > 0;

  // Fetch user data to get saved lawn size
  // Auth is checked by ProtectedRoute wrapper, so this is safe
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Update lawn size mutation
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
    updateLawnSizeMutation.mutate(newSize);
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
            <InventoryManager />
          </div>
          
          {/* Center Column - Main Product Recommendation */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {isWeekLoading && (
              <Skeleton className="h-96 w-full" data-testid="skeleton-loading-application" />
            )}
            {weekError && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded" data-testid="error-application">
                <p className="font-medium">Failed to load weekly application schedule</p>
                <p className="text-sm">Please try again later or contact support if the problem persists.</p>
              </div>
            )}
            {!isWeekLoading && !weekError && isRestWeek && (
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
            {!isWeekLoading && !weekError && hasApplicationDays && currentWeek?.applicationDays && (
              <ProductCard
                applicationDays={currentWeek.applicationDays as any}
                lawnSize={lawnSize}
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