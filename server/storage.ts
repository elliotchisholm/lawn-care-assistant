import { type User, type UpsertUser, type Inventory, type InsertInventory, type UpdateInventory, users, inventory } from "@shared/schema";
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
          ...userData,
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
    const result = await db.insert(inventory).values(item).returning();
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
}

export const storage = new DatabaseStorage();
