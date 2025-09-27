import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfYear, differenceInWeeks, addWeeks } from "date-fns";
import { ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Mock user ID - in a real app this would come from authentication
const MOCK_USER_ID = "mock-user-123";

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

interface PurchaseRecommendation {
  productName: string;
  unit: string;
  currentStock: number;
  totalNeeded: number;
  shortfall: number;
  weeksUntilEmpty: number;
  suggestedPurchase: number;
}

interface PurchaseRecommendationsProps {
  lawnSize: number;
}

// Mock application guide data (same as in Home.tsx)
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
    ]
  },
  {
    month: "January", week: 2, waterVolume: 5,
    products: [{ name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }]
  },
  {
    month: "January", week: 3, waterVolume: 5,
    products: [
      { name: "NZLA Restore", quantity: 200, unit: "ml", type: "liquid" },
      { name: "NZLA Iron+", quantity: 200, unit: "ml", type: "liquid" },
      { name: "Liquid N", quantity: 350, unit: "ml", type: "liquid" }
    ]
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
    ]
  },
  {
    month: "February", week: 2, waterVolume: 5,
    products: [{ name: "NZLA Amino", quantity: 200, unit: "ml", type: "liquid" }]
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
    ]
  },
  {
    month: "March", week: 2, waterVolume: 0,
    products: [{ name: "Grub+", quantity: 15, unit: "ml", type: "liquid" }]
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
    products: [{ name: "NZLA All Seasons", quantity: 2000, unit: "g", type: "granular" }]
  }
];

export default function PurchaseRecommendations({ lawnSize }: PurchaseRecommendationsProps) {
  const scaleFactor = lawnSize / 100; // Base calculations are per 100m²
  
  // Fetch inventory data
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory", MOCK_USER_ID],
    queryFn: async (): Promise<InventoryItem[]> => {
      const response = await fetch(`/api/inventory/${MOCK_USER_ID}`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  // Calculate purchase recommendations
  const purchaseRecommendations = useMemo(() => {
    const currentDate = new Date();
    const yearStart = startOfYear(currentDate);
    const currentWeekNumber = differenceInWeeks(currentDate, yearStart) + 1;
    
    // Look ahead 8 weeks
    const weeksToAnalyze = 8;
    const productTotals = new Map<string, { total: number; unit: string; applications: number }>();

    // Calculate future product needs
    for (let i = 0; i < weeksToAnalyze; i++) {
      const weekIndex = (currentWeekNumber - 1 + i) % applicationGuide.length;
      const weekApplication = applicationGuide[weekIndex];
      
      weekApplication.products.forEach(product => {
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

    // Compare with current inventory
    const recommendations: PurchaseRecommendation[] = [];
    
    productTotals.forEach(({ total, unit, applications }, key) => {
      const productName = key.split('_')[0];
      const inventoryItem = inventory.find(item => 
        item.productName === productName && item.unit === unit
      );
      
      const currentStock = inventoryItem ? parseFloat(inventoryItem.currentQuantity) : 0;
      const shortfall = total - currentStock;
      
      if (shortfall > 0) {
        // Calculate weeks until empty (if currently have stock)
        let weeksUntilEmpty = 0;
        if (currentStock > 0) {
          const averageWeeklyUsage = total / weeksToAnalyze;
          weeksUntilEmpty = Math.floor(currentStock / averageWeeklyUsage);
        }
        
        // Suggest purchasing enough for 12 weeks plus a buffer
        const weeklyAverage = total / weeksToAnalyze;
        const suggestedPurchase = Math.ceil((weeklyAverage * 12 + shortfall) / 100) * 100; // Round up to nearest 100
        
        recommendations.push({
          productName,
          unit,
          currentStock,
          totalNeeded: total,
          shortfall,
          weeksUntilEmpty,
          suggestedPurchase
        });
      }
    });

    return recommendations.sort((a, b) => a.weeksUntilEmpty - b.weeksUntilEmpty);
  }, [inventory, lawnSize]);

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
              className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200"
              data-testid={`purchase-recommendation-${index}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium" data-testid="text-product-name">
                    {rec.productName}
                  </h4>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
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
                <p className="font-semibold text-lg text-red-700" data-testid="text-suggested-purchase">
                  Buy: {rec.suggestedPurchase}{rec.unit}
                </p>
                <p className="text-xs text-muted-foreground">
                  Shortfall: {rec.shortfall.toFixed(0)}{rec.unit}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <Separator />
        
        <div className="text-xs text-muted-foreground text-center">
          Suggestions include 12-week supply plus buffer for optimal lawn care
        </div>
      </CardContent>
    </Card>
  );
}