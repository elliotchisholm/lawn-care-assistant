import { type User, type UpsertUser, type Inventory, type InsertInventory, type UpdateInventory, type WeeklySchedule, type AppliedWeek, type InventoryAdjustment, users, inventory, weeklySchedule, appliedWeeks } from "@shared/schema";
import { NZLA_PRODUCTS } from "@shared/products";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
    for (const adjustment of adjustments) {
      const { productName, amountDeducted, unit } = adjustment;
      
      // Get current inventory item
      const inventoryItem = await this.getInventoryItem(userId, productName);
      
      if (inventoryItem) {
        // Calculate new quantity (Store Zero: floor at 0)
        const currentQty = parseFloat(inventoryItem.currentQuantity);
        const newQty = Math.max(0, currentQty - amountDeducted);
        
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
      }
    }
    
    // Create applied week record
    const [appliedWeek] = await db.insert(appliedWeeks)
      .values({
        userId,
        weekNumber,
        adjustments: adjustments as any
      })
      .onConflictDoUpdate({
        target: [appliedWeeks.userId, appliedWeeks.weekNumber],
        set: {
          adjustments: adjustments as any,
          appliedAt: new Date()
        }
      })
      .returning();
    
    return appliedWeek;
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
    
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
