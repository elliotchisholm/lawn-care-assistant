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
