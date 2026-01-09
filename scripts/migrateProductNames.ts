/**
 * Product Name Migration Script
 * 
 * This script migrates existing inventory records to use canonical product names.
 * It's safe to run multiple times (idempotent).
 * 
 * Run with: tsx scripts/migrateProductNames.ts
 */

import { db } from '../server/db';
import { inventory } from '../shared/schema';
import { PRODUCT_NAME_MAPPINGS, normalizeProductName, CANONICAL_PRODUCT_NAMES } from '../shared/canonicalProductNames';
import { sql } from 'drizzle-orm';

async function migrateProductNames() {
  console.log('🔄 Starting product name migration...\n');
  
  try {
    // Get all unique product names from inventory
    const uniqueProductNames = await db
      .selectDistinct({ productName: inventory.productName })
      .from(inventory);
    
    console.log(`Found ${uniqueProductNames.length} unique product names in inventory:`);
    uniqueProductNames.forEach(({ productName }) => {
      console.log(`  - ${productName}`);
    });
    console.log('');
    
    // Build migration map
    const migrations: Map<string, string> = new Map();
    let needsMigration = 0;
    
    for (const { productName } of uniqueProductNames) {
      const canonical = normalizeProductName(productName);
      if (canonical !== productName) {
        migrations.set(productName, canonical);
        needsMigration++;
        console.log(`📝 Will migrate: "${productName}" → "${canonical}"`);
      } else if (CANONICAL_PRODUCT_NAMES.includes(canonical as any)) {
        console.log(`✅ Already canonical: "${productName}"`);
      } else {
        console.log(`⚠️  Unknown product: "${productName}" (no mapping found)`);
      }
    }
    
    console.log('');
    
    if (needsMigration === 0) {
      console.log('✨ No migrations needed! All product names are already canonical.');
      return;
    }
    
    console.log(`\n🔧 Migrating ${needsMigration} product names...\n`);
    
    // Perform migrations
    for (const [oldName, newName] of Array.from(migrations.entries())) {
      console.log(`Updating "${oldName}" → "${newName}"...`);
      
      const result = await db
        .update(inventory)
        .set({ productName: newName })
        .where(sql`${inventory.productName} = ${oldName}`);
      
      console.log(`  ✓ Updated records`);
    }
    
    console.log('\n✅ Migration complete!');
    console.log('\nVerifying results...\n');
    
    // Verify migration
    const afterMigration = await db
      .selectDistinct({ productName: inventory.productName })
      .from(inventory);
    
    console.log(`Product names after migration (${afterMigration.length} unique):`);
    afterMigration.forEach(({ productName }) => {
      const isCanonical = CANONICAL_PRODUCT_NAMES.includes(productName as any);
      const status = isCanonical ? '✅' : '⚠️ ';
      console.log(`  ${status} ${productName}`);
    });
    
    // Check for any non-canonical names
    const nonCanonical = afterMigration.filter(
      ({ productName }) => !CANONICAL_PRODUCT_NAMES.includes(productName as any)
    );
    
    if (nonCanonical.length > 0) {
      console.log('\n⚠️  Warning: Some product names are not in the canonical list:');
      nonCanonical.forEach(({ productName }) => {
        console.log(`  - ${productName}`);
      });
      console.log('\nThese may need to be added to canonicalProductNames.ts or manually corrected.');
    } else {
      console.log('\n✨ All product names are now canonical!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateProductNames()
    .then(() => {
      console.log('\n🎉 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateProductNames };
