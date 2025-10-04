export function normalizeToBaseUnit(quantity: number, unit: string): { quantity: number; unit: string } {
  const lowerUnit = unit.trim().toLowerCase();
  
  // Weight conversions - normalize to grams
  if (lowerUnit === 'kg') {
    return { quantity: quantity * 1000, unit: 'g' };
  }
  if (lowerUnit === 'g') {
    return { quantity, unit: 'g' };
  }
  
  // Volume conversions - normalize to milliliters
  if (lowerUnit === 'l') {
    return { quantity: quantity * 1000, unit: 'ml' };
  }
  if (lowerUnit === 'ml') {
    return { quantity, unit: 'ml' };
  }
  
  // Return as-is if unrecognized unit
  return { quantity, unit };
}

export function convertQuantity(fromQuantity: number, fromUnit: string, toUnit: string): number {
  const normalized = normalizeToBaseUnit(fromQuantity, fromUnit);
  const targetNormalized = normalizeToBaseUnit(1, toUnit);
  
  // If units are incompatible (e.g., trying to convert g to ml), return 0
  // This ensures weight and volume units don't accidentally match
  if (normalized.unit !== targetNormalized.unit) {
    return 0;
  }
  
  // Convert from normalized base unit to target unit
  return normalized.quantity / targetNormalized.quantity;
}
