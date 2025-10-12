export interface PackageSize {
  amount: number;
  unit: string;
  displayText: string;
}

export interface PackagePurchase {
  quantity: number;
  packageSize: PackageSize;
  totalAmount: number;
}

// Calculate recommended purchase using smart package logic
// Strategy: Buy multiples of smaller packages rather than one large package with waste
// Only use a larger package when needed amount exceeds that package size
export function calculatePackagePurchase(
  neededAmount: number,
  unit: string,
  packages: PackageSize[]
): PackagePurchase | null {
  
  if (!packages || packages.length === 0) {
    return null;
  }

  // Filter packages that match the unit type
  const matchingPackages = packages.filter(p => p.unit === unit);
  if (matchingPackages.length === 0) {
    return null;
  }

  // Sort packages by amount ascending
  const sortedPackages = [...matchingPackages].sort((a, b) => a.amount - b.amount);

  // Strategy:
  // 1. Find the largest package size where needed > package size
  // 2. Buy multiples of that package
  // 3. Only use the next larger package if needed amount exceeds it
  
  // Example: Need 3000ml, packages [500ml, 1L, 2L, 5L]
  // - Largest package where 3000 > package is 2L (2000ml)
  // - Buy ceil(3000/2000) = 2 × 2L = 4000ml
  
  // Find the largest package that is < needed amount
  let selectedPackage = sortedPackages[sortedPackages.length - 1]; // Default to largest
  
  for (let i = sortedPackages.length - 1; i >= 0; i--) {
    const pkg = sortedPackages[i];
    
    if (neededAmount > pkg.amount) {
      // Found the largest package smaller than needed
      selectedPackage = pkg;
      break;
    } else if (i === 0) {
      // Even the smallest package is larger than needed
      selectedPackage = pkg;
    }
  }

  // Calculate how many packages we need
  const quantity = Math.ceil(neededAmount / selectedPackage.amount);
  const totalAmount = quantity * selectedPackage.amount;

  // Optimization: If total amount matches a larger single package exactly, use that instead
  // Example: 5 × 1L = 5L, so recommend 1 × 5L instead
  if (quantity > 1) {
    const exactMatchPackage = sortedPackages.find(pkg => pkg.amount === totalAmount);
    if (exactMatchPackage) {
      return {
        quantity: 1,
        packageSize: exactMatchPackage,
        totalAmount: exactMatchPackage.amount
      };
    }
  }

  return {
    quantity,
    packageSize: selectedPackage,
    totalAmount
  };
}

// Format package recommendation for display
export function formatPackageRecommendation(purchase: PackagePurchase): string {
  if (purchase.quantity === 1) {
    return purchase.packageSize.displayText;
  }
  return `${purchase.quantity} × ${purchase.packageSize.displayText}`;
}
