import express, { type Express } from 'express';
import { db } from '../db';
import { users, inventory, appliedWeeks, systemMetrics } from '@shared/schema';
import { eq, like } from 'drizzle-orm';

export const TEST_USER_PREFIX = 'test-user-';

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lawnSize: number;
}

export async function createTestUser(suffix: string = Date.now().toString()): Promise<TestUser> {
  const userId = `${TEST_USER_PREFIX}${suffix}`;
  const email = `test-${suffix}@example.com`;
  
  const [user] = await db.insert(users)
    .values({
      id: userId,
      email,
      firstName: 'Test',
      lastName: 'User',
      lawnSize: 100
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        firstName: 'Test',
        lastName: 'User',
        lawnSize: 100,
        updatedAt: new Date()
      }
    })
    .returning();
  
  return {
    id: user.id,
    email: user.email || email,
    firstName: user.firstName || 'Test',
    lastName: user.lastName || 'User',
    lawnSize: user.lawnSize || 100
  };
}

export async function cleanupTestUser(userId: string): Promise<void> {
  await db.delete(appliedWeeks).where(eq(appliedWeeks.userId, userId));
  await db.delete(inventory).where(eq(inventory.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

export async function cleanupAllTestUsers(): Promise<void> {
  const testUsers = await db.select()
    .from(users)
    .where(like(users.id, `${TEST_USER_PREFIX}%`));
  
  for (const user of testUsers) {
    await cleanupTestUser(user.id);
  }
}

export async function createTestInventoryItem(
  userId: string, 
  productName: string, 
  quantity: number, 
  unit: string
) {
  const [item] = await db.insert(inventory)
    .values({
      userId,
      productName,
      currentQuantity: quantity.toString(),
      unit
    })
    .onConflictDoUpdate({
      target: [inventory.userId, inventory.productName],
      set: {
        currentQuantity: quantity.toString(),
        unit,
        lastUpdated: new Date()
      }
    })
    .returning();
  
  return item;
}

export function createAuthenticatedRequest(userId: string): Record<string, string> {
  return {
    'x-test-user-id': userId,
    'Content-Type': 'application/json'
  };
}

export async function createTestApp(): Promise<Express> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  const { registerRoutes } = await import('../routes');
  await registerRoutes(app);
  
  return app;
}
