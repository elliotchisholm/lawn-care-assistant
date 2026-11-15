import { convertQuantity } from "@shared/unitConversions";
import { normalizeProductName } from "@shared/canonicalProductNames";

/**
 * Single place where product names are compared and stock is summed, so This Week,
 * Buy, Stock and the apply flow always agree. Names are compared in canonical form.
 */

export function sameProduct(a: string, b: string): boolean {
  return normalizeProductName(a) === normalizeProductName(b);
}

interface StockItem {
  productName: string;
  currentQuantity: string;
  unit: string;
}

/** Total stock of a product converted to `unit`, plus how many inventory rows matched. */
export function getStockInUnit(inventory: StockItem[], productName: string, unit: string) {
  const items = inventory.filter((item) => sameProduct(item.productName, productName));
  const total = items.reduce(
    (sum, item) => sum + convertQuantity(parseFloat(item.currentQuantity), item.unit, unit),
    0,
  );
  return { total, itemCount: items.length };
}

/** Looks up a product's entry in a map keyed by product name, tolerating name variations. */
export function findByProduct<T>(map: Record<string, T>, productName: string): T | undefined {
  if (productName in map) return map[productName];
  const key = Object.keys(map).find((k) => sameProduct(k, productName));
  return key === undefined ? undefined : map[key];
}

/** The interchangeable alternative of a scheduled product, or null when there is none. */
export function alternativeOf(productName: string, alternativeName?: string | null): string | null {
  if (!alternativeName || sameProduct(productName, alternativeName)) return null;
  return normalizeProductName(alternativeName);
}

/**
 * Stock available to a scheduled product, in `unit`. When the schedule offers an alternative
 * ("NZLA Wetter or Wetter 3W"), either product can be applied, so their stock is pooled.
 */
export function getPooledStock(
  inventory: StockItem[],
  productName: string,
  alternativeName: string | null | undefined,
  unit: string,
) {
  const primary = getStockInUnit(inventory, productName, unit);
  const alt = alternativeOf(productName, alternativeName);
  const alternative = alt ? getStockInUnit(inventory, alt, unit) : { total: 0, itemCount: 0 };
  return {
    total: primary.total + alternative.total,
    itemCount: primary.itemCount + alternative.itemCount,
    primary: primary.total,
    alternative: alternative.total,
  };
}
