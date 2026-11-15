import { convertQuantity } from "@shared/unitConversions";
import type { WeeklySchedule } from "@shared/schema";
import { calculatePackagePurchase, formatPackageRecommendation, type PackageSize } from "@/lib/packageCalculator";

export interface PurchaseInventoryItem {
  id: string;
  userId: string;
  productName: string;
  currentQuantity: string;
  unit: string;
  notes?: string;
  lastUpdated: string;
  purchaseDate?: string;
}

export interface PurchaseRecommendation {
  productName: string;
  unit: string;
  currentStock: number;
  totalNeeded: number;
  shortfall: number;
  weeksUntilEmpty: number;
  suggestedPurchase: number;
  packageRecommendation?: string; // e.g., "3 x 1L" or "2kg"
}

interface ComputeArgs {
  fullSchedule: WeeklySchedule[];
  inventory: PurchaseInventoryItem[];
  packageSizes: Record<string, PackageSize[]>;
  scaleFactor: number;
  weeksToAnalyze: number;
  currentWeekNumber: number;
}

/** Products to buy to cover the next N weeks of applications. Logic moved unchanged from the component. */
export function computePurchaseRecommendations({
  fullSchedule,
  inventory,
  packageSizes,
  scaleFactor,
  weeksToAnalyze,
  currentWeekNumber,
}: ComputeArgs): PurchaseRecommendation[] {
  if (!fullSchedule || fullSchedule.length === 0) {
    return [];
  }

  const productTotals = new Map<string, { total: number; unit: string; applications: number }>();

  // Calculate future product needs using API data
  for (let i = 0; i < weeksToAnalyze; i++) {
    // Calculate target week with wrapping (weeks 1-52)
    const targetWeekNumber = ((currentWeekNumber + i - 1) % 52) + 1;
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

      // Try to find package sizes for this product
      const productPackages = packageSizes[productName];
      let packageRecommendation: string | undefined;
      let suggestedPurchase: number;

      if (productPackages && productPackages.length > 0) {
        // Use package calculator to find best package combination based on shortfall
        const purchase = calculatePackagePurchase(shortfall, unit, productPackages);
        if (purchase) {
          suggestedPurchase = purchase.totalAmount;
          packageRecommendation = formatPackageRecommendation(purchase);
        } else {
          // Fallback to simple rounding if no package match
          suggestedPurchase = Math.ceil(shortfall);
        }
      } else {
        // Fallback: Smart rounding based on unit type and quantity
        if (unit === 'kg' || unit === 'L') {
          if (shortfall < 5) {
            suggestedPurchase = Math.ceil(shortfall);
          } else if (shortfall < 20) {
            suggestedPurchase = Math.ceil(shortfall / 5) * 5;
          } else {
            suggestedPurchase = Math.ceil(shortfall / 10) * 10;
          }
        } else {
          suggestedPurchase = Math.ceil(shortfall / 100) * 100;
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
}

export type Urgency = "now" | "soon" | "later";

export function urgencyOf(rec: PurchaseRecommendation): Urgency {
  if (rec.weeksUntilEmpty === 0) return "now";
  return rec.weeksUntilEmpty <= 4 ? "soon" : "later";
}
