# Product Name Migration - Production Instructions

## ✅ Development Database Migration Complete

The migration has been successfully tested on the development database with these results:
- **3 product names migrated**: NZLA Restore → Restore, NZLA Amino → Amino, NZLA Iron+ → Iron+
- **13 unique products** now using canonical names
- **All inventory quantities preserved** ✓

## 📋 Production Database Migration Steps

### Option 1: Run from Replit Database Tab (Recommended)

1. **Open the Database tab** in your Replit workspace
2. **Switch to Production** environment (top dropdown)
3. **Run this SQL directly**:

```sql
-- Product Name Migration
UPDATE inventory SET product_name = 'Restore' WHERE product_name = 'NZLA Restore';
UPDATE inventory SET product_name = 'Amino' WHERE product_name = 'NZLA Amino';
UPDATE inventory SET product_name = 'Iron+' WHERE product_name = 'NZLA Iron+';

-- Verify migration
SELECT product_name, COUNT(*) as count 
FROM inventory 
GROUP BY product_name 
ORDER BY product_name;
```

### Option 2: Run Migration Script

1. **SSH/Shell access to production**
2. **Set environment** to production:
   ```bash
   export NODE_ENV=production
   export DATABASE_URL="your-production-database-url"
   ```
3. **Run migration**:
   ```bash
   tsx server/migrateProductNames.ts
   ```

### Verification Checklist

After running the migration, verify:

- [ ] All product names match canonical list (no "NZLA" prefixes except for "NZLA Wetter" and "NZLA All Seasons")
- [ ] Inventory quantities unchanged
- [ ] No duplicate products created
- [ ] Purchase recommendations now show consistent names

### Rollback (if needed)

If something goes wrong, you can rollback with:

```sql
UPDATE inventory SET product_name = 'NZLA Restore' WHERE product_name = 'Restore';
UPDATE inventory SET product_name = 'NZLA Amino' WHERE product_name = 'Amino';
UPDATE inventory SET product_name = 'NZLA Iron+' WHERE product_name = 'Iron+';
```

## 📊 Expected Results

**Before Migration:**
- NZLA Restore
- NZLA Amino  
- NZLA Iron+

**After Migration:**
- Restore
- Amino
- Iron+

All other product names remain unchanged.

## ⚠️ Important Notes

- This migration is **safe** and **idempotent** (can be run multiple times)
- **No data loss** - only product names are changed
- **Quantities preserved** - all inventory amounts remain intact
- The migration script automatically verifies results

## 🎯 What This Fixes

After migration, product names will be consistent across:
- ✅ Product Inventory
- ✅ Weekly Applications  
- ✅ Purchase Recommendations
- ✅ Package Sizes

Users will see the same product names everywhere in the app!
