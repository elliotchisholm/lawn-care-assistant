/**
 * Canonical NZLA Product Names
 * 
 * This is the single source of truth for all NZLA product names.
 * Names are extracted from the official NZLA application guide.
 * All other systems (inventory, recommendations, packages) should use these exact names.
 */

export const CANONICAL_PRODUCT_NAMES = [
  // Liquid Products
  'NZLA Wetter',
  'Wetter 3W',
  'Nurture',
  'Root Health',
  'Humic+',
  'Iron+',
  'Amino',
  'Restore',
  'Liquid N',
  'Liquid Boost',
  'Grub+',
  'Charger',
  'Liquid Starter',
  
  // Granular Products
  'NZLA All Seasons',
] as const;

export type CanonicalProductName = typeof CANONICAL_PRODUCT_NAMES[number];

/**
 * Product name variations and their canonical mappings
 * This handles common user inputs and normalizes them to canonical names
 */
export const PRODUCT_NAME_MAPPINGS: Record<string, CanonicalProductName> = {
  // NZLA Wetter variations
  'NZLA Wetter': 'NZLA Wetter',
  'nzla wetter': 'NZLA Wetter',
  'Wetter': 'NZLA Wetter',
  'wetter': 'NZLA Wetter',
  
  // Wetter 3W variations
  'Wetter 3W': 'Wetter 3W',
  'wetter 3w': 'Wetter 3W',
  'NZLA Wetter 3W': 'Wetter 3W',
  
  // Nurture variations
  'Nurture': 'Nurture',
  'nurture': 'Nurture',
  'NZLA Nurture': 'Nurture',
  
  // Root Health variations
  'Root Health': 'Root Health',
  'root health': 'Root Health',
  'NZLA Root Health': 'Root Health',
  
  // Humic+ variations
  'Humic+': 'Humic+',
  'humic+': 'Humic+',
  'NZLA Humic+': 'Humic+',
  'Humic Plus': 'Humic+',
  
  // Iron+ variations
  'Iron+': 'Iron+',
  'iron+': 'Iron+',
  'NZLA Iron+': 'Iron+',
  'Iron Plus': 'Iron+',
  
  // Amino variations (Amino+ maps to Amino - same product)
  'Amino': 'Amino',
  'amino': 'Amino',
  'NZLA Amino': 'Amino',
  'Amino+': 'Amino',
  'amino+': 'Amino',
  'NZLA Amino+': 'Amino',
  'Amino Plus': 'Amino',
  
  // Restore variations
  'Restore': 'Restore',
  'restore': 'Restore',
  'NZLA Restore': 'Restore',
  
  // Liquid N variations
  'Liquid N': 'Liquid N',
  'liquid n': 'Liquid N',
  'NZLA Liquid N': 'Liquid N',
  
  // Liquid Boost variations
  'Liquid Boost': 'Liquid Boost',
  'liquid boost': 'Liquid Boost',
  'NZLA Liquid Boost': 'Liquid Boost',
  
  // Grub+ variations
  'Grub+': 'Grub+',
  'grub+': 'Grub+',
  'NZLA Grub+': 'Grub+',
  'Grub Plus': 'Grub+',
  
  // Charger variations
  'Charger': 'Charger',
  'charger': 'Charger',
  'NZLA Charger': 'Charger',
  
  // Liquid Starter variations
  'Liquid Starter': 'Liquid Starter',
  'liquid starter': 'Liquid Starter',
  'NZLA Liquid Starter': 'Liquid Starter',
  
  // All Seasons variations
  'NZLA All Seasons': 'NZLA All Seasons',
  'nzla all seasons': 'NZLA All Seasons',
  'All Seasons': 'NZLA All Seasons',
  'all seasons': 'NZLA All Seasons',
};

/**
 * Normalize a product name to its canonical form
 * @param name - The input product name (may be in any variation)
 * @returns The canonical product name, or the original name if no mapping found
 */
export function normalizeProductName(name: string): string {
  const trimmedName = name.trim();
  return PRODUCT_NAME_MAPPINGS[trimmedName] || trimmedName;
}

/**
 * Check if a product name is valid (exists in canonical list)
 */
export function isValidProductName(name: string): boolean {
  const normalized = normalizeProductName(name);
  return CANONICAL_PRODUCT_NAMES.includes(normalized as CanonicalProductName);
}
