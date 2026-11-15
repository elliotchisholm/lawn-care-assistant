import { normalizeProductName } from "@shared/canonicalProductNames";
import { findByProduct, getStockInUnit, sameProduct } from "@/lib/productMatching";
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

  const productTotals = new Map<string, { productName: string; total: number; unit: string; applications: number }>();

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
            const productName = normalizeProductName(product.name);
            const key = `${productName}\u0000${product.unit}`;

            if (productTotals.has(key)) {
              const existing = productTotals.get(key)!;
              productTotals.set(key, {
                productName,
                total: existing.total + scaledQuantity,
                unit: product.unit,
                applications: existing.applications + 1
              });
            } else {
              productTotals.set(key, {
                productName,
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

  productTotals.forEach(({ productName, total, unit }) => {
    const currentStock = getStockInUnit(inventory, productName, unit).total;

    const shortfall = total - currentStock;

    if (shortfall > 0) {
      // Calculate weeks until empty (if currently have stock)
      let weeksUntilEmpty = 0;
      if (currentStock > 0) {
        const averageWeeklyUsage = total / weeksToAnalyze;
        weeksUntilEmpty = Math.floor(currentStock / averageWeeklyUsage);
      }

      // Try to find package sizes for this product
      const productPackages = findByProduct(packageSizes, productName);
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

/** An item counts as low when it would run out within this many weeks of scheduled applications. */
export const LOW_STOCK_WEEKS = 4;

export interface StockWarning {
  level: "out" | "low";
  /** Whole weeks of stock left at the scheduled rate (0 when under a week). */
  weeksLeft: number;
}

/**
 * Warning for a stocked product, from recommendations computed over LOW_STOCK_WEEKS.
 * Returns null when the product is not short within that window.
 */
export function getStockWarning(
  recommendations: PurchaseRecommendation[],
  productName: string,
): StockWarning | null {
  const rec = recommendations.find((r) => sameProduct(r.productName, productName));
  if (!rec) return null;
  if (rec.currentStock <= 0) return { level: "out", weeksLeft: 0 };
  return { level: "low", weeksLeft: rec.weeksUntilEmpty };
}

export function describeStockWarning(warning: StockWarning): string {
  if (warning.level === "out") return "Out of stock";
  return warning.weeksLeft < 1 ? "Low: under 1 week left" : `Low: about ${warning.weeksLeft} ${warning.weeksLeft === 1 ? "week" : "weeks"} left`;
}
