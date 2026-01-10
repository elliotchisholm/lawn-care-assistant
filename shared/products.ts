import { CANONICAL_PRODUCT_NAMES, type CanonicalProductName } from './canonicalProductNames';

export interface Product {
  name: CanonicalProductName;
  unit: string;
}

export const NZLA_PRODUCTS: Product[] = [
  // Liquid Products (ml)
  { name: "NZLA Wetter", unit: "ml" },
  { name: "Wetter 3W", unit: "ml" },
  { name: "Nurture", unit: "ml" },
  { name: "Root Health", unit: "ml" },
  { name: "Humic+", unit: "ml" },
  { name: "Iron+", unit: "ml" },
  { name: "Amino", unit: "ml" },
  { name: "Restore", unit: "ml" },
  { name: "Liquid N", unit: "ml" },
  { name: "Liquid Boost", unit: "ml" },
  { name: "Grub+", unit: "ml" },
  { name: "Charger", unit: "ml" },
  { name: "Liquid Starter", unit: "ml" },
  
  // Granular Products (g)
  { name: "NZLA All Seasons", unit: "g" }
];

// Validate that all products in NZLA_PRODUCTS match canonical names
if (process.env.NODE_ENV !== 'production') {
  const invalidProducts = NZLA_PRODUCTS.filter(
    product => !CANONICAL_PRODUCT_NAMES.includes(product.name)
  );
  
  if (invalidProducts.length > 0) {
    console.error(
      'WARNING: The following products in NZLA_PRODUCTS do not match canonical names:',
      invalidProducts.map(p => p.name)
    );
  }
}
