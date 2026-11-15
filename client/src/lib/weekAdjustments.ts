import { normalizeProductName } from "@shared/canonicalProductNames";
import type { ApplicationDay } from "@shared/schema";
import { alternativeOf, getStockInUnit } from "@/lib/productMatching";

export interface ProductAdjustment {
  productName: string;
  amountToDeduct: number;
  unit: string;
  currentInventory: number;
  newInventory: number; // negative when stock is short
  isInsufficient: boolean;
}

interface StockItem {
  productName: string;
  currentQuantity: string;
  unit: string;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Inventory deductions for applying a week. Stock is tracked across the whole week, so a
 * product used on two days is not counted twice against the same stock. When the schedule
 * offers an alternative, stock comes from the primary product first, then the alternative.
 * Any shortfall is reported against the primary product.
 */
export function planWeekAdjustments(
  days: ApplicationDay[],
  inventory: StockItem[],
  scaleFactor: number,
): ProductAdjustment[] {
  const used = new Map<string, number>();
  const keyOf = (name: string, unit: string) => `${name}\u0000${unit}`;
  const available = (name: string, unit: string) =>
    Math.max(0, getStockInUnit(inventory, name, unit).total - (used.get(keyOf(name, unit)) ?? 0));

  const adjustments: ProductAdjustment[] = [];

  for (const day of days) {
    for (const product of day.products) {
      const unit = product.unit;
      const required = Math.round(product.quantity * scaleFactor);
      const primary = normalizeProductName(product.name);
      const alt = alternativeOf(product.name, product.alternativeName);

      const primaryAvailable = available(primary, unit);
      const primaryUse = Math.min(required, primaryAvailable);
      const altAvailable = alt ? available(alt, unit) : 0;
      const altUse = alt ? Math.min(required - primaryUse, altAvailable) : 0;
      const short = required - primaryUse - altUse;

      const primaryAmount = round(primaryUse + short);
      adjustments.push({
        productName: primary,
        amountToDeduct: primaryAmount,
        unit,
        currentInventory: round(primaryAvailable),
        newInventory: round(primaryAvailable - primaryAmount),
        isInsufficient: short > 0,
      });
      used.set(keyOf(primary, unit), (used.get(keyOf(primary, unit)) ?? 0) + primaryUse);

      if (alt && altUse > 0) {
        adjustments.push({
          productName: alt,
          amountToDeduct: round(altUse),
          unit,
          currentInventory: round(altAvailable),
          newInventory: round(altAvailable - altUse),
          isInsufficient: false,
        });
        used.set(keyOf(alt, unit), (used.get(keyOf(alt, unit)) ?? 0) + altUse);
      }
    }
  }

  return adjustments;
}
