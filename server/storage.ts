import { type User, type InsertUser, type Inventory, type InsertInventory, type UpdateInventory, inventory } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Inventory management methods
  getUserInventory(userId: string): Promise<Inventory[]>;
  getInventoryItem(userId: string, productName: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, userId: string, item: UpdateInventory): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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

export const storage = new MemStorage();
