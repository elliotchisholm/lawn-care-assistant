import { type User, type UpsertUser, type Inventory, type InsertInventory, type UpdateInventory, type WeeklySchedule, type AppliedWeek, type InventoryAdjustment, users, inventory, weeklySchedule, appliedWeeks, systemMetrics } from "@shared/schema";
import { NZLA_PRODUCTS } from "@shared/products";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, count, sql } from "drizzle-orm";
import { insertInventorySchema } from "@shared/schema";
import { applyWeek, undoWeek } from "./weekApplications";

function isEmptyNeonResultError(error: unknown): boolean {
  if (!(error instanceof Error) || !("cause" in error)) {
    return false;
  }

  const cause = error.cause;
  return cause instanceof TypeError &&
    cause.message === "Cannot read properties of null (reading 'map')";
}

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
    try {
      return await this.persistUser(userData);
    } catch (error) {
      let cause: any = error;
      while (cause?.cause) cause = cause.cause;
      if (userData.email && cause?.code === "23505"
        && ["users_email_key", "users_email_unique"].includes(cause?.constraint)) {
        // Email is profile information, not identity. Never link two distinct OIDC subjects.
        return this.persistUser({ ...userData, email: null });
      }
      throw error;
    }
  }

  private async persistUser(userData: UpsertUser): Promise<User> {
    // This endpoint can coerce a bound null to "". A SQL literal preserves nullable uniqueness.
    const email = userData.email == null ? sql`NULL` : userData.email;
    const [user] = await db
      .insert(users)
      .values({ ...userData, email })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (user) {
      return user;
    }

    if (!userData.id) {
      throw new Error("Unable to load user after upsert");
    }

    const persistedUser = await this.getUser(userData.id);
    if (!persistedUser) {
      throw new Error("Unable to load user after upsert");
    }

    return persistedUser;
  }

  async updateUserLawnSize(userId: string, lawnSize: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ lawnSize, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0] ?? this.getUser(userId);
  }

  // Inventory methods - use database for persistent storage
  async getUserInventory(userId: string): Promise<Inventory[]> {
    try {
      return await db.select().from(inventory).where(eq(inventory.userId, userId));
    } catch (error) {
      if (isEmptyNeonResultError(error)) {
        return [];
      }
      throw error;
    }
  }

  async getInventoryItem(userId: string, productName: string): Promise<Inventory | undefined> {
    try {
      const items = await db.select().from(inventory)
        .where(and(
          eq(inventory.userId, userId),
          eq(inventory.productName, productName)
        ));
      return items[0];
    } catch (error) {
      if (isEmptyNeonResultError(error)) {
        return undefined;
      }
      throw error;
    }
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
    const persistedItem = result[0] ?? await this.getInventoryItem(item.userId, item.productName);
    if (!persistedItem) {
      throw new Error("Unable to load inventory item after upsert");
    }

    return persistedItem;
  }

  async updateInventoryItem(id: string, userId: string, item: UpdateInventory): Promise<Inventory | undefined> {
    const result = await db.update(inventory)
      .set({ ...item, lastUpdated: new Date() })
      .where(and(
        eq(inventory.id, id),
        eq(inventory.userId, userId)
      ))
      .returning();
    if (result[0]) {
      return result[0];
    }

    try {
      const [persistedItem] = await db.select().from(inventory)
        .where(and(
          eq(inventory.id, id),
          eq(inventory.userId, userId)
        ));
      return persistedItem;
    } catch (error) {
      if (isEmptyNeonResultError(error)) {
        return undefined;
      }
      throw error;
    }
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
    try {
      const [appliedWeek] = await db.select().from(appliedWeeks)
        .where(and(
          eq(appliedWeeks.userId, userId),
          eq(appliedWeeks.weekNumber, weekNumber)
        ));
      return appliedWeek;
    } catch (error) {
      if (isEmptyNeonResultError(error)) {
        return undefined;
      }
      throw error;
    }
  }

  async markWeekAsApplied(userId: string, weekNumber: number, adjustments: InventoryAdjustment[]): Promise<AppliedWeek> {
    return applyWeek(userId, weekNumber, adjustments);
  }

  async undoWeekApplication(userId: string, weekNumber: number): Promise<boolean> {
    return undoWeek(userId, weekNumber);
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
