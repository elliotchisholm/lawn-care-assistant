import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { startOfYear, differenceInWeeks } from "date-fns";
import { ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { convertQuantity } from "@shared/unitConversions";
import type { WeeklySchedule } from "@shared/schema";
import { calculatePackagePurchase, formatPackageRecommendation, type PackageSize } from "@/lib/packageCalculator";

interface InventoryItem {
  id: string;
  userId: string;
  productName: string;
  currentQuantity: string;
  unit: string;
  notes?: string;
  lastUpdated: string;
  purchaseDate?: string;
}

interface PurchaseRecommendation {
  productName: string;
  unit: string;
  currentStock: number;
  totalNeeded: number;
  shortfall: number;
  weeksUntilEmpty: number;
  suggestedPurchase: number;
  packageRecommendation?: string; // e.g., "3 × 1L" or "2kg"
}

interface PurchaseRecommendationsProps {
  lawnSize: number;
}

export default function PurchaseRecommendations({ lawnSize }: PurchaseRecommendationsProps) {
  const scaleFactor = lawnSize / 100; // Base calculations are per 100m²
  
  // Fetch inventory data for authenticated user
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch full schedule from API
  const { data: fullSchedule = [], isLoading: isScheduleLoading } = useQuery<WeeklySchedule[]>({
    queryKey: ["/api/schedule"],
  });

  // Fetch package sizes
  const { data: packageSizes = {} } = useQuery<Record<string, PackageSize[]>>({
    queryKey: ["/api/package-sizes"],
  });

  // Calculate purchase recommendations
  const purchaseRecommendations = useMemo(() => {
    if (!fullSchedule || fullSchedule.length === 0) {
      return [];
    }
    
    console.log('Package sizes loaded:', Object.keys(packageSizes).length);

    const currentDate = new Date();
    const yearStart = startOfYear(currentDate);
    const currentWeekNumber = differenceInWeeks(currentDate, yearStart) + 1;
    
    // Look ahead 8 weeks
    const weeksToAnalyze = 8;
    const productTotals = new Map<string, { total: number; unit: string; applications: number }>();

    // Calculate future product needs using API data
    for (let i = 0; i < weeksToAnalyze; i++) {
      const targetWeekNumber = currentWeekNumber + i;
      const weekData = fullSchedule.find(week => week.weekNumber === targetWeekNumber);
      
      if (!weekData || weekData.isRestWeek === 1) {
        continue; // Skip rest weeks
      }

      // Extract products from applicationDays
      if (Array.isArray(weekData.applicationDays)) {
        weekData.applicationDays.forEach((day: any) => {
          if (Array.isArray(day.products)) {
            day.products.forEach((product: any) => {
              const scaledQuantity = product.quantity * scaleFactor;
              const key = `${product.name}_${product.unit}`;
              
              if (productTotals.has(key)) {
                const existing = productTotals.get(key)!;
                productTotals.set(key, {
                  total: existing.total + scaledQuantity,
                  unit: product.unit,
                  applications: existing.applications + 1
                });
              } else {
                productTotals.set(key, {
                  total: scaledQuantity,
                  unit: product.unit,
                  applications: 1
                });
              }
            });
          }
        });
      }
    }

    // Compare with current inventory
    const recommendations: PurchaseRecommendation[] = [];
    
    productTotals.forEach(({ total, unit, applications }, key) => {
      const productName = key.split('_')[0];
      const inventoryItems = inventory.filter(item => 
        item.productName === productName
      );
      
      const currentStock = inventoryItems.reduce((sum, item) => {
        const qty = parseFloat(item.currentQuantity);
        const converted = convertQuantity(qty, item.unit, unit);
        return sum + converted;
      }, 0);
      
      const shortfall = total - currentStock;
      
      if (shortfall > 0) {
        // Calculate weeks until empty (if currently have stock)
        let weeksUntilEmpty = 0;
        if (currentStock > 0) {
          const averageWeeklyUsage = total / weeksToAnalyze;
          weeksUntilEmpty = Math.floor(currentStock / averageWeeklyUsage);
        }
        
        // Calculate 12-week supply based on usage rate
        const weeklyAverage = total / weeksToAnalyze;
        const twelveWeekSupply = weeklyAverage * 12;
        
        // Try to find package sizes for this product
        const productPackages = packageSizes[productName];
        let packageRecommendation: string | undefined;
        let suggestedPurchase: number;
        
        if (productPackages && productPackages.length > 0) {
          // Use package calculator to find best package combination
          const purchase = calculatePackagePurchase(twelveWeekSupply, unit, productPackages);
          if (purchase) {
            suggestedPurchase = purchase.totalAmount;
            packageRecommendation = formatPackageRecommendation(purchase);
          } else {
            // Fallback to simple rounding if no package match
            suggestedPurchase = Math.ceil(twelveWeekSupply);
          }
        } else {
          // Fallback: Smart rounding based on unit type and quantity
          if (unit === 'kg' || unit === 'L') {
            if (twelveWeekSupply < 5) {
              suggestedPurchase = Math.ceil(twelveWeekSupply);
            } else if (twelveWeekSupply < 20) {
              suggestedPurchase = Math.ceil(twelveWeekSupply / 5) * 5;
            } else {
              suggestedPurchase = Math.ceil(twelveWeekSupply / 10) * 10;
            }
          } else {
            suggestedPurchase = Math.ceil(twelveWeekSupply / 100) * 100;
          }
        }
        
        recommendations.push({
          productName,
          unit,
          currentStock,
          totalNeeded: total,
          shortfall,
          weeksUntilEmpty,
          suggestedPurchase,
          packageRecommendation
        });
      }
    });

    return recommendations.sort((a, b) => a.weeksUntilEmpty - b.weeksUntilEmpty);
  }, [inventory, lawnSize, fullSchedule, packageSizes]);

  if (isScheduleLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (purchaseRecommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Your inventory looks good!</p>
            <p className="text-sm">No immediate purchases needed for the next 8 weeks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Recommendations
          </div>
          <Badge variant="destructive" className="text-xs">
            {purchaseRecommendations.length} {purchaseRecommendations.length === 1 ? 'item' : 'items'} needed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Based on next 8 weeks of applications for your {lawnSize}m² lawn
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          {purchaseRecommendations.map((rec, index) => (
            <div 
              key={`${rec.productName}_${rec.unit}`}
              className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5 dark:bg-destructive/10"
              data-testid={`purchase-recommendation-${index}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground" data-testid="text-product-name">
                    {rec.productName}
                  </h4>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground">
                    Current: {rec.currentStock}{rec.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Need: {rec.totalNeeded.toFixed(0)}{rec.unit}
                  </p>
                  {rec.weeksUntilEmpty > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {rec.weeksUntilEmpty} weeks left
                    </Badge>
                  )}
                  {rec.weeksUntilEmpty === 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Out of stock
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold text-lg text-destructive" data-testid="text-suggested-purchase">
                  {rec.packageRecommendation ? (
                    <>Buy: {rec.packageRecommendation}</>
                  ) : (
                    <>Buy: {rec.suggestedPurchase}{rec.unit}</>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rec.packageRecommendation && (
                    <>= {rec.suggestedPurchase}{rec.unit} total • </>
                  )}
                  Shortfall: {rec.shortfall.toFixed(0)}{rec.unit}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <Separator />
        
        <div className="text-xs text-muted-foreground text-center">
          Suggestions based on 12-week supply calculated from your usage rate
        </div>
      </CardContent>
    </Card>
  );
}