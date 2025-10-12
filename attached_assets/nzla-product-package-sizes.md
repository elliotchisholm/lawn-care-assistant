# NZLA Product Package Sizes

This file defines the available package sizes for each NZLA product. The purchase recommendation system will use these sizes to calculate the smallest package needed to cover your shortfall.

## Liquid Products (ml/L)

### NZLA Wetter
- Available sizes: 1L, 5L, 20L

### Nurture
- Available sizes: 1L, 5L, 20L

### Root Health
- Available sizes: 1L, 5L, 20L

### Humic+
- Available sizes: 1L, 5L, 20L

### NZLA Iron+ (Iron+)
- Available sizes: 1L, 5L, 20L

### NZLA Amino (Amino, Amino+)
- Available sizes: 1L, 5L, 20L

### NZLA Restore (Restore)
- Available sizes: 1L, 5L, 20L

### Liquid N
- Available sizes: 1L, 5L, 20L

### Liquid Boost
- Available sizes: 1L, 5L, 20L

### Grub+
- Available sizes: 100ml, 250ml, 1L, 5L

### Charger
- Available sizes: 1L, 5L, 20L

### Liquid Starter
- Available sizes: 1L, 5L, 20L

### Wetter 3W
- Available sizes: 1L, 5L, 20L

## Granular Products (g/kg)

### NZLA All Seasons (All Seasons)
- Available sizes: 4kg, 6kg, 10kg, 20kg

---

## Instructions for Editing

1. Update the available sizes for each product based on actual NZLA product offerings
2. List sizes in ascending order (smallest to largest)
3. For liquid products: use ml or L (convert: 1L = 1000ml)
4. For granular products: use g or kg (convert: 1kg = 1000g)
5. The system will automatically find the smallest package that meets or exceeds your needs

## Format Notes

- Sizes should be numeric values followed by unit (e.g., 500ml, 2kg)
- Separate multiple sizes with commas
- Keep all sizes for a product on the same line after "Available sizes:"

## Purchase Logic

The system uses the following logic to recommend package sizes:

1. **Prefer multiples of smaller packages** over buying one large package with waste
2. **Only jump to a larger package size** when you need MORE than that package size
3. **Example:** If you need 3000ml and packages are [500ml, 1L, 2L, 5L]:
   - Recommend: 3 × 1L bottles (3000ml, no waste)
   - NOT: 1 × 5L bottle (5000ml, 2000ml waste)
   - Only recommend 5L when you need > 5000ml
