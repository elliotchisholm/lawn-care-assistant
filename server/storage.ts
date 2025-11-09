import { type User, type UpsertUser, type Inventory, type InsertInventory, type UpdateInventory, type WeeklySchedule, type AppliedWeek, type InventoryAdjustment, users, inventory, weeklySchedule, appliedWeeks, systemMetrics } from "@shared/schema";
import { NZLA_PRODUCTS } from "@shared/products";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, count, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLawnSize(userId: string, lawnSize: number): Promise<User | undefined>;
  
  // Inventory management methods
  getUserInventory(userId: string): Promise<Inventory[]>;
  getInventoryItem(userId: string, productName: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, userId: string, item: UpdateInventory): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string, userId: string): Promise<boolean>;
  initializeUserInventory(userId: string): Promise<void>;
  
  // Weekly schedule methods
  getAllWeeklySchedule(): Promise<WeeklySchedule[]>;
  getWeeklyScheduleByWeek(weekNumber: number): Promise<WeeklySchedule | undefined>;
  getScheduleCount(): Promise<number>;
  
  // Applied weeks methods
  getAppliedWeek(userId: string, weekNumber: number): Promise<AppliedWeek | undefined>;
  markWeekAsApplied(userId: string, weekNumber: number, adjustments: InventoryAdjustment[]): Promise<AppliedWeek>;
  undoWeekApplication(userId: string, weekNumber: number): Promise<boolean>;
  
  // Metrics methods
  getTotalUsers(): Promise<number>;
  getTotalInventoryItems(): Promise<number>;
  getTotalApplicationsMarked(): Promise<number>;
  getTotalUndoOperations(): Promise<number>;
  getAverageLawnSize(): Promise<number>;
  
  // Internal metrics tracking
  incrementMetric(metricKey: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserLawnSize(userId: string, lawnSize: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ lawnSize, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Inventory methods - use database for persistent storage
  async getUserInventory(userId: string): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.userId, userId));
  }

  async getInventoryItem(userId: string, productName: string): Promise<Inventory | undefined> {
    const items = await db.select().from(inventory)
      .where(and(
        eq(inventory.userId, userId),
        eq(inventory.productName, productName)
      ));
    return items[0];
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    // Upsert: update if product exists for this user, create if not
    const result = await db.insert(inventory)
      .values(item)
      .onConflictDoUpdate({
        target: [inventory.userId, inventory.productName],
        set: {
          currentQuantity: item.currentQuantity,
          unit: item.unit,
          notes: item.notes,
          purchaseDate: item.purchaseDate,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async updateInventoryItem(id: string, userId: string, item: UpdateInventory): Promise<Inventory | undefined> {
    const result = await db.update(inventory)
      .set({ ...item, lastUpdated: new Date() })
      .where(and(
        eq(inventory.id, id),
        eq(inventory.userId, userId)
      ))
      .returning();
    return result[0];
  }

  async deleteInventoryItem(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(inventory)
      .where(and(
        eq(inventory.id, id),
        eq(inventory.userId, userId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async initializeUserInventory(userId: string): Promise<void> {
    const inventoryItems = NZLA_PRODUCTS.map(product => ({
      userId,
      productName: product.name,
      currentQuantity: "0",
      unit: product.unit
    }));
    
    await db.insert(inventory).values(inventoryItems).onConflictDoNothing();
  }

  // Weekly schedule methods
  async getAllWeeklySchedule(): Promise<WeeklySchedule[]> {
    return await db.select().from(weeklySchedule);
  }

  async getWeeklyScheduleByWeek(weekNumber: number): Promise<WeeklySchedule | undefined> {
    const [week] = await db.select().from(weeklySchedule).where(eq(weeklySchedule.weekNumber, weekNumber));
    return week;
  }

  async getScheduleCount(): Promise<number> {
    const schedules = await db.select().from(weeklySchedule);
    return schedules.length;
  }

  // Applied weeks methods
  async getAppliedWeek(userId: string, weekNumber: number): Promise<AppliedWeek | undefined> {
    const [appliedWeek] = await db.select().from(appliedWeeks)
      .where(and(
        eq(appliedWeeks.userId, userId),
        eq(appliedWeeks.weekNumber, weekNumber)
      ));
    return appliedWeek;
  }

  async markWeekAsApplied(userId: string, weekNumber: number, adjustments: InventoryAdjustment[]): Promise<AppliedWeek> {
    // Apply inventory deductions - Store Zero logic: if inventory goes negative, set to 0
    // Create corrected adjustments with actual inventory values (not converted)
    const correctedAdjustments: InventoryAdjustment[] = [];
    
    for (const adjustment of adjustments) {
      const { productName, amountDeducted, unit } = adjustment;
      
      // Get current inventory item
      const inventoryItem = await this.getInventoryItem(userId, productName);
      
      if (inventoryItem) {
        // Store the ACTUAL inventory values before any modifications
        const actualPreviousQty = parseFloat(inventoryItem.currentQuantity);
        const actualUnit = inventoryItem.unit;
        
        // Convert amountDeducted to inventory's unit for calculation
        const convertedAmount = this.convertQuantity(amountDeducted, unit, actualUnit);
        const newQty = Math.max(0, actualPreviousQty - convertedAmount);
        
        // Store the corrected adjustment with actual inventory unit
        correctedAdjustments.push({
          productName,
          amountDeducted: convertedAmount,
          unit: actualUnit,  // Use actual inventory unit
          previousQuantity: actualPreviousQty,  // Use actual previous quantity
          newQuantity: newQty
        });
        
        // Update inventory
        await db.update(inventory)
          .set({ 
            currentQuantity: newQty.toString(),
            lastUpdated: new Date()
          })
          .where(and(
            eq(inventory.userId, userId),
            eq(inventory.productName, productName)
          ));
      } else {
        // Create inventory item at 0 if it doesn't exist
        await this.createInventoryItem({
          userId,
          productName,
          currentQuantity: "0",
          unit
        });
        
        correctedAdjustments.push({
          productName,
          amountDeducted,
          unit,
          previousQuantity: 0,
          newQuantity: 0
        });
      }
    }
    
    // Create applied week record with corrected adjustments
    const [appliedWeek] = await db.insert(appliedWeeks)
      .values({
        userId,
        weekNumber,
        adjustments: correctedAdjustments as any
      })
      .onConflictDoUpdate({
        target: [appliedWeeks.userId, appliedWeeks.weekNumber],
        set: {
          adjustments: correctedAdjustments as any,
          appliedAt: new Date()
        }
      })
      .returning();
    
    return appliedWeek;
  }

  // Helper method to convert between units
  private convertQuantity(amount: number, fromUnit: string, toUnit: string): number {
    // Normalize units to lowercase
    const from = fromUnit.toLowerCase();
    const to = toUnit.toLowerCase();
    
    if (from === to) return amount;
    
    // Weight conversions (g <-> kg)
    if (from === 'g' && to === 'kg') return amount / 1000;
    if (from === 'kg' && to === 'g') return amount * 1000;
    
    // Volume conversions (ml <-> l)
    if (from === 'ml' && to === 'l') return amount / 1000;
    if (from === 'l' && to === 'ml') return amount * 1000;
    
    // If no conversion found, return original amount
    return amount;
  }

  async undoWeekApplication(userId: string, weekNumber: number): Promise<boolean> {
    // Get the applied week to retrieve adjustments
    const appliedWeek = await this.getAppliedWeek(userId, weekNumber);
    
    if (!appliedWeek) {
      return false;
    }
    
    // Restore inventory by adding back the deducted amounts
    const adjustments = appliedWeek.adjustments as unknown as InventoryAdjustment[];
    for (const adjustment of adjustments) {
      const { productName, previousQuantity } = adjustment;
      
      // Restore to previous quantity
      await db.update(inventory)
        .set({ 
          currentQuantity: previousQuantity.toString(),
          lastUpdated: new Date()
        })
        .where(and(
          eq(inventory.userId, userId),
          eq(inventory.productName, productName)
        ));
    }
    
    // Delete the applied week record
    const result = await db.delete(appliedWeeks)
      .where(and(
        eq(appliedWeeks.userId, userId),
        eq(appliedWeeks.weekNumber, weekNumber)
      ));
    
    const success = result.rowCount !== null && result.rowCount > 0;
    
    // Track undo operation for observability metrics
    if (success) {
      await this.incrementMetric('total_undo_operations');
    }
    
    return success;
  }
  
  // Metrics methods - using efficient COUNT queries
  async getTotalUsers(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return Number(result[0]?.count) || 0;
  }
  
  async getTotalInventoryItems(): Promise<number> {
    const result = await db.select({ count: count() }).from(inventory);
    return Number(result[0]?.count) || 0;
  }
  
  async getTotalApplicationsMarked(): Promise<number> {
    const result = await db.select({ count: count() }).from(appliedWeeks);
    return Number(result[0]?.count) || 0;
  }
  
  async getTotalUndoOperations(): Promise<number> {
    const [metric] = await db.select()
      .from(systemMetrics)
      .where(eq(systemMetrics.metricKey, 'total_undo_operations'));
    return metric?.metricValue || 0;
  }
  
  async getAverageLawnSize(): Promise<number> {
    // Note: Average requires fetching data since we need to filter null/zero values
    const allUsers = await db.select({ lawnSize: users.lawnSize }).from(users);
    if (allUsers.length === 0) return 0;
    
    const usersWithLawnSize = allUsers.filter(user => user.lawnSize !== null && user.lawnSize > 0);
    if (usersWithLawnSize.length === 0) return 0;
    
    const totalLawnSize = usersWithLawnSize.reduce((sum, user) => sum + (user.lawnSize || 0), 0);
    return Math.round(totalLawnSize / usersWithLawnSize.length);
  }
  
  // Internal metrics tracking
  async incrementMetric(metricKey: string): Promise<void> {
    await db.insert(systemMetrics)
      .values({ metricKey, metricValue: 1 })
      .onConflictDoUpdate({
        target: systemMetrics.metricKey,
        set: {
          metricValue: sql`${systemMetrics.metricValue} + 1`,
          updatedAt: new Date()
        }
      });
  }
}

export const storage = new DatabaseStorage();
