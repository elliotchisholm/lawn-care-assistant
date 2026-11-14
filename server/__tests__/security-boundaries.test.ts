import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import type { Express } from "express";
import request from "supertest";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { createTestApp, createTestUser, createTestInventoryItem, cleanupTestUser, createAuthenticatedRequest, type TestUser } from "./helpers";

describe("User data security boundaries", () => {
  let app: Express;
  let userA: TestUser;
  let userB: TestUser;
  let itemA: Awaited<ReturnType<typeof createTestInventoryItem>>;
  const cleanupIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    userA = await createTestUser(`security-a-${randomUUID()}`);
    cleanupIds.push(userA.id);
    userB = await createTestUser(`security-b-${randomUUID()}`);
    cleanupIds.push(userB.id);
    itemA = await createTestInventoryItem(userA.id, "Nurture", 250, "ml");
    await storage.markWeekAsApplied(userA.id, 3, []);
  });

  afterAll(async () => {
    for (const id of cleanupIds) await cleanupTestUser(id);
  });

  it("denies a second user access to the first user's inventory ID", async () => {
    const headers = createAuthenticatedRequest(userB.id);
    await request(app).put(`/api/inventory/${itemA.id}`).set(headers).send({ currentQuantity: "999" }).expect(404);
    await request(app).delete(`/api/inventory/${itemA.id}`).set(headers).expect(404);
    await request(app).get("/api/inventory/product/Nurture").set(headers).expect(404);
    expect((await storage.getInventoryItem(userA.id, "Nurture"))?.currentQuantity).toBe("250");
  });

  it("ignores a client-supplied identity on inventory creation", async () => {
    const response = await request(app).post("/api/inventory")
      .set(createAuthenticatedRequest(userB.id))
      .send({ userId: userA.id, productName: "Root Health", currentQuantity: "5", unit: "ml" });
    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(userB.id);
    expect(await storage.getInventoryItem(userA.id, "Root Health")).toBeUndefined();
  });

  it("does not allow moving an inventory row to another account", async () => {
    await request(app).put(`/api/inventory/${itemA.id}`)
      .set(createAuthenticatedRequest(userA.id))
      .send({ userId: userB.id, notes: "still owned by A" }).expect(200);
    expect((await storage.getInventoryItem(userA.id, "Nurture"))?.userId).toBe(userA.id);
    expect(await storage.getInventoryItem(userB.id, "Nurture")).toBeUndefined();
  });

  it("isolates applied-week reads and undo operations between users", async () => {
    const headers = createAuthenticatedRequest(userB.id);
    const response = await request(app).get("/api/applied-weeks/3").set(headers);
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
    await request(app).delete("/api/applied-weeks/3").set(headers).expect(404);
    expect(await storage.getAppliedWeek(userA.id, 3)).toBeDefined();
  });

  it("ignores a client-supplied identity when marking a week", async () => {
    const response = await request(app).post("/api/applied-weeks")
      .set(createAuthenticatedRequest(userB.id))
      .send({ userId: userA.id, weekNumber: 6, adjustments: [] });
    expect(response.status).toBe(201);
    expect(response.body.userId).toBe(userB.id);
    expect(await storage.getAppliedWeek(userA.id, 6)).toBeUndefined();
  });

  it.each([
    { productName: "not-a-supported-product", currentQuantity: "1", unit: "ml" },
    { productName: "Nurture", currentQuantity: "-1", unit: "ml" },
    { productName: "Nurture", currentQuantity: "Infinity", unit: "ml" },
    { productName: "Nurture", currentQuantity: "1", unit: "unsupported" },
    { productName: "Nurture", currentQuantity: "1", unit: "ml", notes: "x".repeat(2001) },
  ])("rejects invalid inventory input %#", async input => {
    await request(app).post("/api/inventory").set(createAuthenticatedRequest(userA.id)).send(input).expect(400);
  });

  it("rejects negative deductions before they can increase inventory", async () => {
    await request(app).post("/api/applied-weeks").set(createAuthenticatedRequest(userA.id)).send({
      weekNumber: 8,
      adjustments: [{ productName: "Nurture", amountDeducted: -100, unit: "ml", previousQuantity: 250, newQuantity: 350 }],
    }).expect(400);
    expect((await storage.getInventoryItem(userA.id, "Nurture"))?.currentQuantity).toBe("250");
    expect(await storage.getAppliedWeek(userA.id, 8)).toBeUndefined();
  });

  it("rejects out-of-range lawn sizes and non-integer week numbers", async () => {
    const headers = createAuthenticatedRequest(userA.id);
    await request(app).put("/api/user/lawn-size").set(headers).send({ lawnSize: 1000001 }).expect(400);
    await request(app).get("/api/applied-weeks/3junk").set(headers).expect(400);
    await request(app).delete("/api/applied-weeks/3.5").set(headers).expect(400);
    await request(app).post("/api/applied-weeks").set(headers).send({ weekNumber: 53, adjustments: [] }).expect(400);
  });

  it("lets a distinct OIDC subject sign in despite a reused email, without linking accounts", async () => {
    const id = `test-user-email-collision-${randomUUID()}`;
    cleanupIds.push(id);
    const newUser = await storage.upsertUser({ id, email: userA.email, firstName: "Separate", lastName: "Account" });
    expect(newUser.id).toBe(id);
    expect(newUser.email).toBeFalsy();
    const [stored] = await db.select({ missingEmail: sql`CASE WHEN email IS NULL THEN 1 ELSE 0 END` })
      .from(users).where(eq(users.id, id));
    expect(Number(stored.missingEmail)).toBe(1);
    expect((await storage.getUser(userA.id))?.email).toBe(userA.email);
    expect(await storage.getUserInventory(id)).toEqual([]);
    const anotherId = `test-user-email-collision-${randomUUID()}`;
    cleanupIds.push(anotherId);
    const anotherUser = await storage.upsertUser({ id: anotherId, email: userA.email });
    expect(anotherUser.id).toBe(anotherId);
    expect(anotherUser.email).toBeFalsy();
  });
});
