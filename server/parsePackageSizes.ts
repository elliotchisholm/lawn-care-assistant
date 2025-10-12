import fs from 'fs';
import path from 'path';

export interface PackageSize {
  amount: number;
  unit: string;
  displayText: string;
}

// Parse package size string like "2kg" or "500ml" to { amount: 2000, unit: 'g' }
function parsePackageSize(sizeStr: string): { amount: number; unit: string } {
  const match = sizeStr.trim().match(/^(\d+(?:\.\d+)?)(ml|L|g|kg)$/i);
  if (!match) {
    throw new Error(`Invalid package size format: ${sizeStr}`);
  }

  let amount = parseFloat(match[1]);
  let unit = match[2].toLowerCase();

  // Normalize to base units (ml for liquids, g for solids)
  if (unit === 'l') {
    amount *= 1000;
    unit = 'ml';
  } else if (unit === 'kg') {
    amount *= 1000;
    unit = 'g';
  }

  return { amount, unit };
}

// Parse the markdown file to extract package sizes
export function parsePackageSizes(): Map<string, PackageSize[]> {
  const filePath = path.join(process.cwd(), 'attached_assets', 'nzla-product-package-sizes.md');
  
  if (!fs.existsSync(filePath)) {
    console.warn('Package sizes file not found:', filePath);
    return new Map();
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const packageMap = new Map<string, PackageSize[]>();

  const lines = content.split('\n');
  let currentProduct: string | null = null;

  for (const line of lines) {
    // Match product headers like "### NZLA Wetter"
    const headerMatch = line.match(/^###\s+(.+?)(?:\s+\(([^)]+)\))?$/);
    if (headerMatch) {
      currentProduct = headerMatch[1].trim();
      continue;
    }

    // Match available sizes like "- Available sizes: 500ml, 1L, 2L, 5L"
    const sizesMatch = line.match(/^-\s+Available sizes:\s*(.+)$/);
    if (sizesMatch && currentProduct) {
      const sizeStrings = sizesMatch[1].split(',').map(s => s.trim());
      const packages: PackageSize[] = [];

      for (const sizeStr of sizeStrings) {
        try {
          const { amount, unit } = parsePackageSize(sizeStr);
          packages.push({
            amount,
            unit,
            displayText: sizeStr
          });
        } catch (error) {
          console.warn(`Skipping invalid package size: ${sizeStr}`);
        }
      }

      // Sort packages by amount (ascending)
      packages.sort((a, b) => a.amount - b.amount);
      
      if (packages.length > 0) {
        packageMap.set(currentProduct, packages);
      }
      currentProduct = null;
    }
  }

  return packageMap;
}
