# Phase 1: URL-Based NZLA Shop Cart Integration
## Implementation Plan & Technical Specification

**Document Version:** 1.0  
**Date:** November 9, 2025  
**Target Shop:** https://www.newzealandlawnaddicts.com/shop/  
**Timeline:** 2 weeks  
**Effort Estimate:** 12 hours  

---

## Executive Summary

This document provides a complete technical implementation plan for Phase 1 of the NZLA shop cart integration. The goal is to add "Add to Cart" buttons to purchase recommendations that generate direct cart URLs, enabling users to seamlessly purchase recommended products from the NZLA shop.

**Key Advantages of Phase 1:**
- ✅ Works immediately without NZLA API access
- ✅ No authentication or CORS requirements
- ✅ Simple URL-based integration
- ✅ Opens shop in new tab (preserves app state)
- ✅ Can be implemented in 2 weeks

---

## Table of Contents

1. [Prerequisites & Research](#1-prerequisites--research)
2. [Technical Architecture](#2-technical-architecture)
3. [Product ID Discovery](#3-product-id-discovery)
4. [Implementation Steps](#4-implementation-steps)
5. [UI/UX Specifications](#5-uiux-specifications)
6. [Testing Procedures](#6-testing-procedures)
7. [Error Handling](#7-error-handling)
8. [Success Metrics](#8-success-metrics)

---

## 1. Prerequisites & Research

### 1.1 Platform Detection

Before implementation, we need to identify NZLA's e-commerce platform to understand URL structure.

#### Method A: Browser Console Detection

Visit https://www.newzealandlawnaddicts.com/shop/ and run:

```javascript
// Detect platform markers
console.log(document.documentElement.outerHTML.match(/woocommerce|shopify|wordpress|woo-/gi));

// Check global objects
console.log({
  wordpress: !!window.wp,
  shopify: !!window.Shopify,
  woocommerce: !!window.wc_add_to_cart_params
});
```

**Expected Result:** Likely WooCommerce (common in NZ)

#### Method B: Network Analysis

1. Open DevTools → Network tab
2. Add any product to cart
3. Observe AJAX endpoint:

**WooCommerce indicators:**
- `?wc-ajax=add_to_cart`
- `/wp-json/wc/`
- POST to `?add-to-cart=123`

**Shopify indicators:**
- `/cart/add.js`
- `/cart/update.js`
- Variant ID patterns

#### Method C: HTML Inspection

View page source and search for:

```html
<!-- WooCommerce -->
<meta name="generator" content="WooCommerce" />
<link rel='stylesheet' href='/wp-content/plugins/woocommerce/' />

<!-- Shopify -->
<meta name="shopify-checkout-api-token" />
<script src="cdn.shopify.com/" />
```

### 1.2 URL Pattern Documentation

Once platform is identified, document URL patterns:

**WooCommerce Expected Patterns:**
```
Single product:
https://www.newzealandlawnaddicts.com/?add-to-cart=PRODUCT_ID&quantity=QTY

With cart redirect:
https://www.newzealandlawnaddicts.com/cart/?add-to-cart=PRODUCT_ID&quantity=QTY

With checkout redirect:
https://www.newzealandlawnaddicts.com/checkout/?add-to-cart=PRODUCT_ID&quantity=QTY
```

**Shopify Expected Patterns:**
```
Single product:
https://www.newzealandlawnaddicts.com/cart/VARIANT_ID:QTY

Multiple products:
https://www.newzealandlawnaddicts.com/cart/VARIANT_ID_1:QTY_1,VARIANT_ID_2:QTY_2

With discount:
https://www.newzealandlawnaddicts.com/cart/VARIANT_ID:QTY?discount=CODE
```

---

## 2. Technical Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Lawn Care Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Purchase Recommendations Component                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Product: NZLA Urea                                  │  │
│  │ Recommendation: Buy 2 bags (10kg each)             │  │
│  │                                                     │  │
│  │ [🛒 Add to NZLA Cart] ← Triggers URL generation    │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│              Cart URL Generator (Client-Side)               │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 1. Lookup product mapping (canonical → NZLA ID)    │  │
│  │ 2. Calculate package quantity                       │  │
│  │ 3. Generate cart URL with parameters                │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│              Open in New Tab (target="_blank")              │
│                          ↓                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              NZLA Shop (External Website)                   │
├─────────────────────────────────────────────────────────────┤
│  https://www.newzealandlawnaddicts.com/cart/               │
│  ?add-to-cart=12345&quantity=2                             │
│                                                             │
│  → Product automatically added to cart                      │
│  → User completes checkout                                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

New files to create:

```
lawn-care-app/
├── shared/
│   └── nzlaProductMapping.ts       # Product ID mappings (NEW)
├── client/src/
│   └── lib/
│       └── nzlaCart.ts              # Cart URL utilities (NEW)
└── phase-1-implementation-plan.md   # This document
```

Modified files:

```
lawn-care-app/
└── client/src/
    └── components/
        └── ProductCard.tsx          # Add cart buttons (MODIFIED)
```

### 2.3 Data Flow

```
User Views Recommendations
         ↓
Clicks "Add to Cart" Button
         ↓
Frontend: generateAddToCartUrl()
         ├─→ Lookup NZLA_PRODUCT_MAP[productName]
         ├─→ Calculate package quantity
         └─→ Build URL with parameters
         ↓
Browser Opens New Tab
         ↓
NZLA Shop Receives Request
         ├─→ Parses URL parameters
         ├─→ Adds product to cart
         └─→ Shows cart page
         ↓
User Completes Checkout (on NZLA)
         ↓
User Returns to App (manually)
```

---

## 3. Product ID Discovery

### 3.1 The 17 NZLA Products to Map

Based on our canonical product names system:

1. NZLA Urea
2. NZLA Maintain
3. NZLA Establish
4. NZLA Sustain
5. NZLA Revive
6. NZLA Renovate
7. NZLA Kickstart
8. NZLA Regen
9. NZLA Forti-K
10. NZLA Forti-Cal
11. NZLA MicroBooster
12. NZLA FeLion
13. NZLA BioActive LiquiSoil Plus
14. NZLA BioActive SoilWetter
15. NZLA BioActive LiquiLife
16. NZLA Grub-Guard
17. NZLA GreenSled

### 3.2 Discovery Method 1: Manual Navigation

**Step-by-step process:**

1. Visit https://www.newzealandlawnaddicts.com/shop/
2. Navigate to each product page
3. Inspect HTML for product ID

**WooCommerce - Finding Product IDs:**

```html
<!-- Method A: Check "Add to Cart" button -->
<button 
  class="single_add_to_cart_button"
  data-product_id="12345"
  data-product_sku="NZLA-UREA-10KG">
  Add to cart
</button>

<!-- Method B: Check hidden form inputs -->
<input type="hidden" name="add-to-cart" value="12345" />

<!-- Method C: Check product meta -->
<div class="product" data-id="12345">
```

**Shopify - Finding Variant IDs:**

```javascript
// Method A: View product as XML
// Visit: https://www.newzealandlawnaddicts.com/products/nzla-urea.xml
// Look for: <id type="integer">70881412</id>

// Method B: Check select dropdown
<select name="id">
  <option value="70881412">10kg - $49.99</option>
  <option value="70881413">20kg - $89.99</option>
</select>

// Method C: Browser console
console.log(ShopifyProductData.variants);
```

**Create spreadsheet to track discoveries:**

| Canonical Name | NZLA Slug | Product ID | Variation ID | Package Size | Price | URL |
|----------------|-----------|------------|--------------|--------------|-------|-----|
| NZLA Urea | nzla-urea | TBD | TBD | 10kg | TBD | TBD |
| NZLA Maintain | nzla-maintain | TBD | TBD | 10kg | TBD | TBD |
| ... | ... | ... | ... | ... | ... | ... |

### 3.3 Discovery Method 2: Cart Network Analysis

**Interactive discovery:**

1. Open DevTools → Network tab
2. Add product to cart on NZLA shop
3. Filter for "cart" or "add" requests
4. Inspect request payload:

```json
// WooCommerce example
{
  "product_id": 12345,
  "quantity": 1,
  "variation_id": 0
}

// Shopify example
{
  "id": 70881412,
  "quantity": 1
}
```

5. Document the ID in your mapping spreadsheet

### 3.4 Discovery Method 3: Automated Scraping (Fallback)

**Only if manual methods are too time-consuming:**

```typescript
// scripts/discoverNZLAProductIds.ts
import puppeteer from 'puppeteer';
import { CANONICAL_PRODUCT_NAMES } from '../shared/canonicalProductNames';

async function discoverProductIds() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const discoveries: any[] = [];

  for (const productName of Object.values(CANONICAL_PRODUCT_NAMES)) {
    try {
      // Navigate to shop
      await page.goto('https://www.newzealandlawnaddicts.com/shop/');
      
      // Search for product
      await page.type('input[type="search"]', productName);
      await page.keyboard.press('Enter');
      await page.waitForSelector('.product', { timeout: 5000 });
      
      // Click first result
      await page.click('.product a');
      await page.waitForSelector('button.single_add_to_cart_button');
      
      // Extract product ID
      const productId = await page.evaluate(() => {
        const btn = document.querySelector('button.single_add_to_cart_button');
        return btn?.getAttribute('data-product_id') || 
               document.querySelector('input[name="add-to-cart"]')?.getAttribute('value');
      });
      
      discoveries.push({
        canonicalName: productName,
        nzlaProductId: productId ? parseInt(productId) : null,
        url: page.url()
      });
      
      console.log(`✓ Found ${productName}: ID ${productId}`);
      
    } catch (error) {
      console.error(`✗ Failed to find ${productName}:`, error.message);
      discoveries.push({
        canonicalName: productName,
        nzlaProductId: null,
        error: error.message
      });
    }
  }

  await browser.close();
  
  // Output results
  console.log('\n=== PRODUCT MAPPING RESULTS ===\n');
  console.log(JSON.stringify(discoveries, null, 2));
  
  // Generate TypeScript code
  console.log('\n=== GENERATED CODE ===\n');
  discoveries.forEach(d => {
    if (d.nzlaProductId) {
      console.log(`"${d.canonicalName}": {`);
      console.log(`  canonicalName: "${d.canonicalName}",`);
      console.log(`  nzlaProductId: ${d.nzlaProductId},`);
      console.log(`  nzlaSlug: "${d.url.split('/').pop()}",`);
      console.log(`},`);
    }
  });
}

// Run: tsx scripts/discoverNZLAProductIds.ts
discoverProductIds();
```

**Note:** Only use automated scraping if you have 50+ products. For 17 products, manual discovery is faster and more reliable.

---

## 4. Implementation Steps

### 4.1 Week 1: Research & Data Collection

#### Day 1-2: Platform Detection & URL Testing

**Tasks:**
- [ ] Visit NZLA shop and run platform detection scripts
- [ ] Document platform type (WooCommerce/Shopify/Custom)
- [ ] Test URL patterns manually:
  - Add product to cart via shop UI
  - Copy cart URL
  - Clear cart
  - Paste URL in new tab
  - Verify product is added automatically
- [ ] Document working URL format

**Deliverable:** Platform documentation file

```markdown
# NZLA Platform Detection Results

**Platform:** WooCommerce v8.2.1 (example)
**Cart URL Format:** `?add-to-cart=PRODUCT_ID&quantity=QTY`
**Redirect Behavior:** Redirects to cart page after addition
**URL Testing Results:**
- ✅ Single product addition works
- ✅ Quantity parameter respected
- ✅ Cart redirect functions correctly
- ⚠️ Multiple products require multiple redirects (not ideal)
```

#### Day 3-5: Product ID Mapping

**Tasks:**
- [ ] Create discovery spreadsheet (Google Sheets/Excel)
- [ ] Navigate to each of 17 NZLA products
- [ ] Extract product IDs using inspection method
- [ ] Document package sizes and prices
- [ ] Verify IDs by testing cart URLs
- [ ] Create backup documentation

**Spreadsheet Template:**

| # | Canonical Name | NZLA Slug | Product ID | Var ID | Size | Price | URL | Tested |
|---|----------------|-----------|------------|--------|------|-------|-----|--------|
| 1 | NZLA Urea | nzla-urea | 12345 | 0 | 10kg | $49 | ... | ✅ |
| 2 | NZLA Maintain | nzla-maintain | 12346 | 0 | 10kg | $52 | ... | ✅ |

**Deliverable:** Complete product mapping data

### 4.2 Week 2: Development & Testing

#### Day 6-7: Data Structure Implementation

**Task 1: Create Product Mapping File**

```typescript
// shared/nzlaProductMapping.ts

/**
 * NZLA Shop Product Mapping
 * Maps canonical product names to NZLA shop product IDs
 * Last updated: [DATE]
 * Platform: WooCommerce (or Shopify)
 */

export interface NZLAProductMapping {
  canonicalName: string;
  nzlaProductId: number | null;      // null if not yet discovered
  nzlaVariationId?: number;           // For variable products
  nzlaSlug: string;                   // URL-safe product identifier
  packageSize: string;                // e.g., "10kg", "2.5L"
  estimatedPrice?: number;            // In cents (optional)
  productUrl: string;                 // Direct product page link
}

export const NZLA_PRODUCT_MAP: Record<string, NZLAProductMapping> = {
  "NZLA Urea": {
    canonicalName: "NZLA Urea",
    nzlaProductId: null,  // TODO: Replace with actual ID from discovery
    nzlaSlug: "nzla-urea",
    packageSize: "10kg",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-urea/"
  },
  "NZLA Maintain": {
    canonicalName: "NZLA Maintain",
    nzlaProductId: null,  // TODO: Replace with actual ID
    nzlaSlug: "nzla-maintain",
    packageSize: "10kg",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-maintain/"
  },
  "NZLA Establish": {
    canonicalName: "NZLA Establish",
    nzlaProductId: null,
    nzlaSlug: "nzla-establish",
    packageSize: "10kg",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-establish/"
  },
  "NZLA Sustain": {
    canonicalName: "NZLA Sustain",
    nzlaProductId: null,
    nzlaSlug: "nzla-sustain",
    packageSize: "10kg",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-sustain/"
  },
  "NZLA Revive": {
    canonicalName: "NZLA Revive",
    nzlaProductId: null,
    nzlaSlug: "nzla-revive",
    packageSize: "10kg",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-revive/"
  },
  "NZLA Renovate": {
    canonicalName: "NZLA Renovate",
    nzlaProductId: null,
    nzlaSlug: "nzla-renovate",
    packageSize: "10kg",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-renovate/"
  },
  "NZLA Kickstart": {
    canonicalName: "NZLA Kickstart",
    nzlaProductId: null,
    nzlaSlug: "nzla-kickstart",
    packageSize: "10kg",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-kickstart/"
  },
  "NZLA Regen": {
    canonicalName: "NZLA Regen",
    nzlaProductId: null,
    nzlaSlug: "nzla-regen",
    packageSize: "10kg",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-regen/"
  },
  "NZLA Forti-K": {
    canonicalName: "NZLA Forti-K",
    nzlaProductId: null,
    nzlaSlug: "nzla-forti-k",
    packageSize: "2.5L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-forti-k/"
  },
  "NZLA Forti-Cal": {
    canonicalName: "NZLA Forti-Cal",
    nzlaProductId: null,
    nzlaSlug: "nzla-forti-cal",
    packageSize: "2.5L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-forti-cal/"
  },
  "NZLA MicroBooster": {
    canonicalName: "NZLA MicroBooster",
    nzlaProductId: null,
    nzlaSlug: "nzla-microbooster",
    packageSize: "2.5L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-microbooster/"
  },
  "NZLA FeLion": {
    canonicalName: "NZLA FeLion",
    nzlaProductId: null,
    nzlaSlug: "nzla-felion",
    packageSize: "2.5L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-felion/"
  },
  "NZLA BioActive LiquiSoil Plus": {
    canonicalName: "NZLA BioActive LiquiSoil Plus",
    nzlaProductId: null,
    nzlaSlug: "nzla-bioactive-liquisoil-plus",
    packageSize: "2.5L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-bioactive-liquisoil-plus/"
  },
  "NZLA BioActive SoilWetter": {
    canonicalName: "NZLA BioActive SoilWetter",
    nzlaProductId: null,
    nzlaSlug: "nzla-bioactive-soilwetter",
    packageSize: "2.5L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-bioactive-soilwetter/"
  },
  "NZLA BioActive LiquiLife": {
    canonicalName: "NZLA BioActive LiquiLife",
    nzlaProductId: null,
    nzlaSlug: "nzla-bioactive-liquilife",
    packageSize: "2.5L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-bioactive-liquilife/"
  },
  "NZLA Grub-Guard": {
    canonicalName: "NZLA Grub-Guard",
    nzlaProductId: null,
    nzlaSlug: "nzla-grub-guard",
    packageSize: "1L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-grub-guard/"
  },
  "NZLA GreenSled": {
    canonicalName: "NZLA GreenSled",
    nzlaProductId: null,
    nzlaSlug: "nzla-greensled",
    packageSize: "2.5L",
    productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-greensled/"
  }
};

/**
 * Helper function to get mapping by canonical name
 */
export function getNZLAMapping(canonicalName: string): NZLAProductMapping | null {
  return NZLA_PRODUCT_MAP[canonicalName] || null;
}

/**
 * Helper function to check if product is mapped
 */
export function isProductMapped(canonicalName: string): boolean {
  const mapping = getNZLAMapping(canonicalName);
  return mapping !== null && mapping.nzlaProductId !== null;
}

/**
 * Get all unmapped products (for discovery tracking)
 */
export function getUnmappedProducts(): string[] {
  return Object.values(NZLA_PRODUCT_MAP)
    .filter(m => m.nzlaProductId === null)
    .map(m => m.canonicalName);
}
```

**Task 2: Populate Mapping with Discovered IDs**

After product ID discovery, update each entry:

```typescript
"NZLA Urea": {
  canonicalName: "NZLA Urea",
  nzlaProductId: 12345,  // ← Updated from discovery
  nzlaSlug: "nzla-urea",
  packageSize: "10kg",
  estimatedPrice: 4999,  // ← $49.99 in cents
  productUrl: "https://www.newzealandlawnaddicts.com/product/nzla-urea/"
},
```

#### Day 8-9: Cart URL Generation Utilities

**Task: Create Cart URL Generator**

```typescript
// client/src/lib/nzlaCart.ts

import { NZLA_PRODUCT_MAP, getNZLAMapping, isProductMapped } from '@shared/nzlaProductMapping';
import { PACKAGE_SIZES } from '@shared/packageSizes';

/**
 * Platform-specific URL generation
 */
const NZLA_SHOP_BASE_URL = 'https://www.newzealandlawnaddicts.com';

/**
 * Platform type (update after discovery)
 */
type Platform = 'woocommerce' | 'shopify' | 'custom';
const NZLA_PLATFORM: Platform = 'woocommerce'; // TODO: Update after detection

/**
 * Generate "Add to Cart" URL for NZLA shop
 * 
 * @param productName - Canonical product name
 * @param quantity - Number of packages to add
 * @param redirectToCart - If true, redirect to cart page after addition
 * @returns Cart URL or null if product not mapped
 */
export function generateAddToCartUrl(
  productName: string,
  quantity: number,
  redirectToCart: boolean = true
): string | null {
  const mapping = getNZLAMapping(productName);
  
  if (!mapping || !mapping.nzlaProductId) {
    console.error(`No NZLA mapping found for: ${productName}`);
    return null;
  }

  // Ensure quantity is positive integer
  const qty = Math.max(1, Math.ceil(quantity));

  if (NZLA_PLATFORM === 'woocommerce') {
    return generateWooCommerceUrl(mapping.nzlaProductId, mapping.nzlaVariationId, qty, redirectToCart);
  } else if (NZLA_PLATFORM === 'shopify') {
    return generateShopifyUrl(mapping.nzlaProductId, qty);
  }
  
  // Fallback: direct product page
  return mapping.productUrl;
}

/**
 * WooCommerce URL generator
 */
function generateWooCommerceUrl(
  productId: number,
  variationId: number | undefined,
  quantity: number,
  redirectToCart: boolean
): string {
  const params = new URLSearchParams();
  params.set('add-to-cart', productId.toString());
  params.set('quantity', quantity.toString());
  
  if (variationId) {
    params.set('variation_id', variationId.toString());
  }

  const basePath = redirectToCart ? '/cart/' : '/';
  return `${NZLA_SHOP_BASE_URL}${basePath}?${params.toString()}`;
}

/**
 * Shopify URL generator
 */
function generateShopifyUrl(
  variantId: number,
  quantity: number
): string {
  return `${NZLA_SHOP_BASE_URL}/cart/${variantId}:${quantity}`;
}

/**
 * Generate product page URL (fallback when ID not available)
 */
export function generateProductPageUrl(productName: string): string | null {
  const mapping = getNZLAMapping(productName);
  return mapping?.productUrl || null;
}

/**
 * Calculate number of packages needed based on quantity in base units
 * 
 * @param productName - Canonical product name
 * @param quantityNeeded - Quantity needed in grams (for granular) or ml (for liquid)
 * @returns Number of packages to purchase
 */
export function calculatePackagesNeeded(
  productName: string,
  quantityNeeded: number
): number {
  const packageSize = PACKAGE_SIZES[productName];
  
  if (!packageSize) {
    console.error(`No package size for ${productName}`);
    return 0;
  }

  // Convert package size to base unit (grams or ml)
  const packageUnitSize = packageSize.unit === 'kg' 
    ? packageSize.size * 1000 
    : packageSize.size;

  // Calculate packages needed (always round up - can't buy partial packages)
  return Math.ceil(quantityNeeded / packageUnitSize);
}

/**
 * Generate cart URL with automatic package calculation
 * 
 * @param productName - Canonical product name
 * @param quantityNeeded - Quantity needed in base units (g or ml)
 * @returns Cart URL with calculated package quantity
 */
export function generateCartUrlFromQuantity(
  productName: string,
  quantityNeeded: number
): string | null {
  const packages = calculatePackagesNeeded(productName, quantityNeeded);
  
  if (packages === 0) {
    return null;
  }
  
  return generateAddToCartUrl(productName, packages, true);
}

/**
 * Generate URLs for multiple products (bulk add)
 * Note: Most platforms don't support multi-product URLs natively
 * This returns an array of individual URLs for sequential addition
 * 
 * @param items - Array of {productName, quantity} objects
 * @returns Array of cart URLs (one per product)
 */
export function generateBulkAddUrls(
  items: Array<{ productName: string; quantity: number }>
): Array<{ productName: string; url: string | null }> {
  return items.map(item => ({
    productName: item.productName,
    url: generateAddToCartUrl(item.productName, item.quantity, true)
  }));
}

/**
 * Validation helper: Check if all recommended products are mapped
 */
export function validateProductMappings(productNames: string[]): {
  allMapped: boolean;
  unmapped: string[];
} {
  const unmapped = productNames.filter(name => !isProductMapped(name));
  
  return {
    allMapped: unmapped.length === 0,
    unmapped
  };
}
```

**Task: Create Unit Tests**

```typescript
// client/src/lib/nzlaCart.test.ts

import { describe, it, expect } from 'vitest';
import { 
  generateAddToCartUrl, 
  calculatePackagesNeeded,
  generateCartUrlFromQuantity 
} from './nzlaCart';

describe('NZLA Cart URL Generator', () => {
  it('should generate WooCommerce cart URL', () => {
    const url = generateAddToCartUrl('NZLA Urea', 2);
    expect(url).toContain('add-to-cart=');
    expect(url).toContain('quantity=2');
    expect(url).toContain('/cart/');
  });

  it('should return null for unmapped product', () => {
    const url = generateAddToCartUrl('Unknown Product', 1);
    expect(url).toBeNull();
  });

  it('should round up quantity to integer', () => {
    const url = generateAddToCartUrl('NZLA Urea', 2.3);
    expect(url).toContain('quantity=3');
  });

  it('should calculate packages correctly', () => {
    // 15kg needed, 10kg per bag = 2 bags
    const packages = calculatePackagesNeeded('NZLA Urea', 15000);
    expect(packages).toBe(2);
  });

  it('should calculate packages with exact fit', () => {
    // Exactly 20kg needed, 10kg per bag = 2 bags
    const packages = calculatePackagesNeeded('NZLA Urea', 20000);
    expect(packages).toBe(2);
  });

  it('should generate URL from quantity in base units', () => {
    const url = generateCartUrlFromQuantity('NZLA Urea', 15000); // 15kg
    expect(url).toContain('quantity=2'); // 2 bags of 10kg
  });
});
```

#### Day 10: UI Integration

**Task: Update ProductCard Component**

```typescript
// client/src/components/ProductCard.tsx

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ExternalLink, AlertCircle } from "lucide-react";
import { generateAddToCartUrl, generateProductPageUrl } from "@/lib/nzlaCart";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  productName: string;
  quantityNeeded: number;
  packageQuantity: number;
  packageSize: string;
  currentStock?: number;
  estimatedPrice?: number;
}

export function ProductCard({
  productName,
  quantityNeeded,
  packageQuantity,
  packageSize,
  currentStock,
  estimatedPrice
}: ProductCardProps) {
  const cartUrl = generateAddToCartUrl(productName, packageQuantity);
  const productPageUrl = generateProductPageUrl(productName);
  
  const hasCartIntegration = cartUrl !== null;

  return (
    <Card className="flex flex-col" data-testid={`card-product-${productName}`}>
      <CardHeader>
        <CardTitle className="text-lg">{productName}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-2">
        <div className="text-sm">
          <p className="font-medium">
            Buy {packageQuantity} {packageQuantity === 1 ? 'package' : 'packages'} ({packageSize} each)
          </p>
          <p className="text-muted-foreground">
            {(quantityNeeded / 1000).toFixed(1)}kg total needed
          </p>
        </div>
        
        {currentStock !== undefined && (
          <div className="text-sm">
            <p className="text-muted-foreground">
              Current stock: {(currentStock / 1000).toFixed(1)}kg
            </p>
          </div>
        )}
        
        {estimatedPrice && (
          <div className="text-sm font-medium">
            Estimated: ${((estimatedPrice * packageQuantity) / 100).toFixed(2)} NZD
          </div>
        )}
        
        {!hasCartIntegration && (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Manual purchase required
          </Badge>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {hasCartIntegration ? (
          <>
            <Button 
              asChild 
              className="flex-1"
              data-testid={`button-add-to-cart-${productName}`}
            >
              <a 
                href={cartUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              asChild
              data-testid={`button-view-product-${productName}`}
            >
              <a 
                href={productPageUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            asChild
            className="flex-1"
            data-testid={`button-view-shop-${productName}`}
          >
            <a 
              href="https://www.newzealandlawnaddicts.com/shop/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit NZLA Shop
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

**Task: Update PurchaseRecommendations Component**

```typescript
// Add to existing PurchaseRecommendations component
import { ProductCard } from "@/components/ProductCard";
import { calculatePackagesNeeded } from "@/lib/nzlaCart";
import { NZLA_PRODUCT_MAP } from "@shared/nzlaProductMapping";

// Inside the component
const recommendations = calculatePurchaseRecommendations(...);

return (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {recommendations.map(rec => {
      const mapping = NZLA_PRODUCT_MAP[rec.productName];
      const packageQty = calculatePackagesNeeded(rec.productName, rec.quantityToBuy);
      
      return (
        <ProductCard
          key={rec.productName}
          productName={rec.productName}
          quantityNeeded={rec.quantityToBuy}
          packageQuantity={packageQty}
          packageSize={mapping?.packageSize || 'unknown'}
          currentStock={rec.currentStock}
          estimatedPrice={mapping?.estimatedPrice}
        />
      );
    })}
  </div>
);
```

#### Day 11-12: Testing & Refinement

See [Section 6: Testing Procedures](#6-testing-procedures)

---

## 5. UI/UX Specifications

### 5.1 Purchase Recommendations Layout

**Before Integration:**
```
┌────────────────────────────────────┐
│ Purchase Recommendations           │
├────────────────────────────────────┤
│ No recommendations yet             │
└────────────────────────────────────┘
```

**After Integration:**
```
┌─────────────────────────────────────────────────────┐
│ Purchase Recommendations                            │
├─────────────────────────────────────────────────────┤
│ ┌───────────────────────┐ ┌───────────────────────┐│
│ │ NZLA Urea            │ │ NZLA Maintain         ││
│ │                       │ │                       ││
│ │ Buy 2 packages       │ │ Buy 1 package         ││
│ │ (10kg each)          │ │ (10kg each)           ││
│ │ 15.0kg total needed  │ │ 8.0kg total needed    ││
│ │                       │ │                       ││
│ │ Current stock: 5.0kg │ │ Current stock: 2.0kg  ││
│ │ Estimated: $99.98 NZD│ │ Estimated: $52.00 NZD ││
│ │                       │ │                       ││
│ │ [🛒 Add to Cart] [🔗]│ │ [🛒 Add to Cart] [🔗]││
│ └───────────────────────┘ └───────────────────────┘│
├─────────────────────────────────────────────────────┤
│ Total Estimated: $151.98 NZD                        │
└─────────────────────────────────────────────────────┘
```

### 5.2 Button States & Interactions

**Primary Action: "Add to Cart" Button**
- Variant: `default` (primary green)
- Icon: `ShoppingCart` from lucide-react
- Behavior: Opens NZLA shop in new tab (`target="_blank"`)
- State: Enabled when product is mapped, otherwise fallback button

**Secondary Action: "View Product" Icon Button**
- Variant: `outline`
- Size: `icon`
- Icon: `ExternalLink` from lucide-react
- Behavior: Opens product page in new tab

**Fallback State: Unmapped Product**
- Shows badge: "Manual purchase required"
- Button changes to: "Visit NZLA Shop" with outline variant
- Links to general shop page

### 5.3 Responsive Design

**Mobile (<768px):**
- Single column layout
- Full-width cards
- Stacked buttons

**Tablet (768px-1024px):**
- 2-column grid
- Cards with fixed aspect ratio

**Desktop (>1024px):**
- 3-column grid
- Hover effects on cards
- Tooltips for additional info

### 5.4 Accessibility

**ARIA Labels:**
```typescript
<Button
  asChild
  aria-label={`Add ${packageQuantity} packages of ${productName} to NZLA cart`}
  data-testid={`button-add-to-cart-${productName}`}
>
  <a href={cartUrl} target="_blank" rel="noopener noreferrer">
    <ShoppingCart className="w-4 h-4 mr-2" />
    Add to Cart
  </a>
</Button>
```

**Keyboard Navigation:**
- All buttons focusable via Tab
- Enter/Space activates buttons
- Visual focus indicators

**Screen Readers:**
- Semantic HTML structure
- Descriptive link text
- Status announcements for loading states

---

## 6. Testing Procedures

### 6.1 Unit Testing

**Cart URL Generation Tests:**

```bash
# Run unit tests
npm test -- nzlaCart.test.ts
```

**Test cases:**
- ✅ URL generation for WooCommerce
- ✅ URL generation for Shopify
- ✅ Package calculation accuracy
- ✅ Null handling for unmapped products
- ✅ Quantity rounding behavior
- ✅ Validation functions

### 6.2 Manual Testing Checklist

**Phase 1: Product ID Verification**

For each of the 17 products:
- [ ] Visit NZLA product page
- [ ] Extract product ID manually
- [ ] Add product to cart via shop UI
- [ ] Verify product added correctly
- [ ] Copy cart URL
- [ ] Clear cart
- [ ] Paste URL in new tab
- [ ] Confirm product re-added automatically
- [ ] Document result in spreadsheet

**Phase 2: Cart URL Testing**

- [ ] Generate cart URL programmatically
- [ ] Test with quantity = 1
- [ ] Test with quantity = 5
- [ ] Test with decimal quantity (should round up)
- [ ] Verify redirect behavior (cart page vs checkout)
- [ ] Test in different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices

**Phase 3: UI Integration Testing**

- [ ] Purchase recommendations display correctly
- [ ] "Add to Cart" buttons render for mapped products
- [ ] Fallback buttons show for unmapped products
- [ ] Package quantities calculate correctly
- [ ] Estimated prices display (if available)
- [ ] Current stock shows when available
- [ ] Buttons open new tabs (don't replace app)
- [ ] Icons display correctly
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Dark mode styling consistent

**Phase 4: User Journey Testing**

Complete user flow:
1. [ ] User views lawn size calculator
2. [ ] Sets lawn size to 500m²
3. [ ] Views current week recommendations
4. [ ] Navigates to Purchase Recommendations
5. [ ] Sees 3-5 products to buy
6. [ ] Clicks "Add to Cart" for first product
7. [ ] New tab opens → NZLA cart page
8. [ ] Product correctly added with right quantity
9. [ ] User returns to app tab
10. [ ] Clicks another "Add to Cart" button
11. [ ] Second product added to cart (cumulative)
12. [ ] User completes checkout on NZLA
13. [ ] Returns to app to update inventory

### 6.3 Edge Case Testing

**Unmapped Products:**
- [ ] Product with no NZLA ID shows fallback
- [ ] Fallback button links to general shop
- [ ] Badge displays "Manual purchase required"

**Quantity Edge Cases:**
- [ ] Zero quantity (should default to 1)
- [ ] Negative quantity (should default to 1)
- [ ] Very large quantity (e.g., 100 bags)
- [ ] Fractional quantity (e.g., 2.7 → rounds to 3)

**Network Issues:**
- [ ] NZLA shop down (URL still generates, but shows error on their end)
- [ ] Slow connection (new tab opens even if slow)

**Browser Compatibility:**
- [ ] Chrome (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & iOS)
- [ ] Edge (Desktop)

### 6.4 Performance Testing

**Metrics to measure:**
- URL generation time: < 1ms
- Product mapping lookup: < 1ms
- Package calculation: < 1ms
- UI render time: < 100ms

**Load testing:**
- Generate 100 URLs in loop
- Verify no memory leaks
- Check console for errors

### 6.5 Regression Testing

After Phase 1 deployment, regularly verify:
- [ ] Product IDs still valid (weekly check)
- [ ] Cart URLs still work (monthly check)
- [ ] Package sizes haven't changed (monthly check)
- [ ] NZLA platform hasn't changed (quarterly check)

---

## 7. Error Handling

### 7.1 Client-Side Error Scenarios

**Scenario 1: Product Not Mapped**

```typescript
// Detection
const cartUrl = generateAddToCartUrl(productName, quantity);
if (cartUrl === null) {
  // Product not mapped
}

// UI Response
<Button variant="outline" asChild>
  <a href="https://www.newzealandlawnaddicts.com/shop/" target="_blank">
    <ExternalLink className="w-4 h-4 mr-2" />
    Visit NZLA Shop
  </a>
</Button>

// User sees
// - Badge: "Manual purchase required"
// - Button: Links to general shop page
// - No cart integration
```

**Scenario 2: Invalid Quantity**

```typescript
// Validation
export function generateAddToCartUrl(productName: string, quantity: number) {
  // Ensure quantity is positive integer
  const qty = Math.max(1, Math.ceil(quantity));
  // ... rest of function
}

// Behavior
// - Negative values → 1
// - Zero → 1
// - Decimals → Rounded up (2.3 → 3)
```

**Scenario 3: Package Size Missing**

```typescript
// Detection
export function calculatePackagesNeeded(productName: string, quantityNeeded: number) {
  const packageSize = PACKAGE_SIZES[productName];
  
  if (!packageSize) {
    console.error(`No package size for ${productName}`);
    return 0; // Fallback: 0 packages
  }
  // ... calculation
}

// UI Response
{packageQuantity === 0 && (
  <p className="text-sm text-destructive">
    Unable to calculate quantity. Please check manually.
  </p>
)}
```

### 7.2 NZLA Shop Error Scenarios

**Scenario 1: Product Out of Stock**

User clicks "Add to Cart" → NZLA shop shows:
> "Sorry, this product is out of stock"

**Our handling:**
- No client-side detection possible (external site)
- User sees NZLA's error message
- User can return to app and try alternatives

**Scenario 2: Product ID Changed**

User clicks "Add to Cart" → NZLA shop shows:
> "Product not found"

**Our handling:**
1. Log error in console
2. Update product mapping file
3. Re-discover correct product ID
4. Deploy updated mapping

**Monitoring:**
```typescript
// Add to mapping file
export const PRODUCT_MAPPING_VERSION = '1.0.0';
export const LAST_VERIFIED_DATE = '2025-11-09';

// Weekly verification script
async function verifyProductMappings() {
  for (const [name, mapping] of Object.entries(NZLA_PRODUCT_MAP)) {
    if (!mapping.nzlaProductId) continue;
    
    const url = generateAddToCartUrl(name, 1);
    const response = await fetch(url);
    
    if (response.status === 404) {
      console.error(`❌ Invalid mapping: ${name} (ID: ${mapping.nzlaProductId})`);
    } else {
      console.log(`✅ Valid: ${name}`);
    }
  }
}
```

### 7.3 User Feedback & Logging

**Console Logging:**
```typescript
// Development: Verbose logging
if (import.meta.env.DEV) {
  console.log('NZLA Cart Debug:', {
    productName,
    quantity,
    cartUrl,
    mapping: getNZLAMapping(productName)
  });
}

// Production: Error logging only
if (cartUrl === null) {
  console.error(`NZLA: Failed to generate cart URL for ${productName}`);
}
```

**User Notifications:**
- No toasts/alerts for normal operation (silent success)
- Only show messages for errors or unmapped products
- Badge indicators for degraded functionality

---

## 8. Success Metrics

### 8.1 Implementation Success Criteria

**Phase 1 Complete When:**
- ✅ All 17 products mapped with valid IDs
- ✅ Cart URLs generate successfully for 100% of mapped products
- ✅ URLs tested manually and work correctly
- ✅ UI integrated with "Add to Cart" buttons
- ✅ Package calculations accurate
- ✅ Responsive design works across devices
- ✅ Error handling implemented for edge cases
- ✅ Documentation complete

### 8.2 User Engagement Metrics

**Track via analytics (optional):**

```typescript
// Example: Google Analytics event
function trackCartClick(productName: string, quantity: number) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'add_to_cart_click', {
      product_name: productName,
      quantity: quantity,
      target: 'nzla_shop'
    });
  }
}
```

**Metrics to monitor:**
- Click-through rate on "Add to Cart" buttons
- Products clicked most frequently
- Average cart additions per user session
- Return visits after cart integration

### 8.3 Business Impact (Long-term)

**If NZLA provides tracking:**
- Revenue driven to NZLA shop
- Conversion rate (clicks → purchases)
- Average order value from app users
- Customer acquisition cost

**For the app:**
- User retention after cart integration
- Feature usage (cart clicks vs manual shop visits)
- User feedback/satisfaction
- Support requests reduction

---

## 9. Deployment & Rollout

### 9.1 Deployment Checklist

**Pre-deployment:**
- [ ] All 17 products mapped and verified
- [ ] Unit tests passing
- [ ] Manual testing complete
- [ ] Product mapping version documented
- [ ] Update replit.md with cart integration info

**Deployment:**
- [ ] Merge feature branch to main
- [ ] Deploy to production
- [ ] Verify cart URLs work in production
- [ ] Monitor for errors in first 24 hours

**Post-deployment:**
- [ ] Announce feature to users (if applicable)
- [ ] Monitor analytics for engagement
- [ ] Collect user feedback
- [ ] Plan Phase 2 improvements

### 9.2 Rollback Plan

**If integration fails:**

```typescript
// Feature flag for quick disable
const ENABLE_CART_INTEGRATION = true; // Set to false to disable

export function generateAddToCartUrl(...) {
  if (!ENABLE_CART_INTEGRATION) {
    return null; // Falls back to "Visit Shop" button
  }
  // ... normal logic
}
```

**Rollback steps:**
1. Set `ENABLE_CART_INTEGRATION = false`
2. Redeploy
3. Users see fallback "Visit Shop" buttons
4. Fix underlying issue
5. Re-enable feature

### 9.3 Communication Plan

**Internal (Development Team):**
- Document all product IDs in spreadsheet
- Share mapping verification schedule
- Set up monitoring alerts

**External (Users - Optional):**
- Changelog entry: "New: Add recommended products to NZLA cart with one click"
- Help documentation: "How to use cart integration"
- FAQ: "Why do some products show 'Manual purchase required'?"

---

## 10. Future Enhancements (Post-Phase 1)

### 10.1 Phase 2 Preview: AJAX Integration

**If NZLA enables CORS:**
- Add products without leaving app
- Show toast notifications
- Display cart item count
- Better error handling

### 10.2 Phase 3 Preview: API Partnership

**If partnering with NZLA:**
- Direct API integration
- Real-time inventory checking
- Multi-product bulk add
- Affiliate tracking
- Automatic order confirmation

### 10.3 Other Improvements

**Price Integration:**
- Scrape or request product prices
- Show total estimated cost
- Price change alerts

**Purchase History:**
- Track what users buy
- Auto-update inventory on purchase
- Purchase analytics

**Smart Recommendations:**
- "Bundle & Save" suggestions
- Free shipping threshold alerts
- Seasonal promotions

---

## 11. Contact & Support

### 11.1 NZLA Partnership Contact

**If you encounter issues or want to collaborate:**

**Contact:** Jon Hicks (Owner)  
**Website:** https://www.newzealandlawnaddicts.com/contact/  
**Subject Line:** "Partnership Inquiry: Lawn Care App Integration"

**Email Template:**
```
Subject: Partnership Opportunity - Lawn Care Application Integration

Hi Jon,

I've developed a lawn care web application that helps users follow the 
NZLA 52-week application guide. The app recommends your products and 
calculates quantities based on lawn size.

I've implemented cart integration using direct product URLs, and I'd like 
to explore a deeper partnership:

1. Confirming product IDs for accuracy
2. Potential API access for better integration
3. Exploring affiliate/referral opportunities

Would you be open to a brief call to discuss?

Best regards,
[Your Name]
[Your Email]
[App URL]
```

### 11.2 Technical Support

**For implementation questions:**
- Review this document
- Check code comments in `nzlaCart.ts`
- Run unit tests for validation
- Consult WooCommerce/Shopify documentation

**For platform changes:**
- Monitor NZLA shop quarterly
- Re-run platform detection
- Verify product IDs still valid
- Update mappings as needed

---

## Appendix A: Quick Reference

### Cart URL Formats

**WooCommerce:**
```
https://www.newzealandlawnaddicts.com/cart/?add-to-cart=12345&quantity=2
```

**Shopify:**
```
https://www.newzealandlawnaddicts.com/cart/70881412:2
```

### Package Calculations

```typescript
// Granular products (kg)
packageSize = 10 (kg)
quantityNeeded = 15000 (g)
packages = Math.ceil(15000 / 10000) = 2

// Liquid products (L)
packageSize = 2.5 (L)
quantityNeeded = 4500 (ml)
packages = Math.ceil(4500 / 2500) = 2
```

### Testing Commands

```bash
# Unit tests
npm test -- nzlaCart.test.ts

# Type checking
npm run typecheck

# Build for production
npm run build

# Database push
npm run db:push
```

### File Locations

```
shared/nzlaProductMapping.ts        # Product ID mappings
client/src/lib/nzlaCart.ts          # Cart utilities
client/src/components/ProductCard.tsx  # UI component
```

---

## Appendix B: Product Discovery Log Template

Use this template to track product ID discoveries:

```markdown
# NZLA Product Discovery Log
Date: YYYY-MM-DD
Platform: [WooCommerce/Shopify/Custom]

## Product 1: NZLA Urea
- Product Page: https://...
- Product ID: 12345
- Variation ID: (none)
- Package Size: 10kg
- Price: $49.99 NZD
- Tested: ✅ / ❌
- Test URL: https://...?add-to-cart=12345&quantity=1
- Notes: [Any issues or observations]

## Product 2: NZLA Maintain
...
```

---

## Appendix C: Troubleshooting Guide

### Issue: Cart URL doesn't add product

**Possible causes:**
1. Product ID incorrect or changed
2. URL format wrong for platform
3. NZLA shop structure changed
4. Product out of stock

**Solution:**
1. Re-verify product ID manually
2. Test URL in incognito window
3. Check NZLA shop for platform changes
4. Contact NZLA support

### Issue: Package calculation wrong

**Possible causes:**
1. Package size incorrect in mapping
2. Unit conversion error
3. Rounding behavior unexpected

**Solution:**
1. Verify package size on NZLA shop
2. Check `PACKAGE_SIZES` in `shared/packageSizes.ts`
3. Review `calculatePackagesNeeded()` logic
4. Add unit test for specific case

### Issue: Fallback button shows for all products

**Possible causes:**
1. Product IDs not populated (all `null`)
2. Import path incorrect
3. Mapping file not deployed

**Solution:**
1. Check `NZLA_PRODUCT_MAP` has actual IDs
2. Verify import: `import { NZLA_PRODUCT_MAP } from '@shared/nzlaProductMapping'`
3. Rebuild and redeploy

---

**End of Phase 1 Implementation Plan**

**Next Steps:**
1. Begin Week 1: Platform detection & product discovery
2. Complete product mapping spreadsheet
3. Implement cart utilities (Week 2)
4. Test thoroughly before deployment
5. Deploy and monitor engagement

**Questions?** Review this document or contact development team.
