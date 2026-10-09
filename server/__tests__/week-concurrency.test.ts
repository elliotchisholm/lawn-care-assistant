import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import { applyWeek, WeekAlreadyAppliedError } from "../weekApplications";
import { createTestApp, createTestUser, cleanupTestUser, createTestInventoryItem, createAuthenticatedRequest, type TestUser } from "./helpers";
import type { Express } from "express";

describe("Atomic week applications", () => {
  let app: Express;
  let user: TestUser;
  const product = "NZLA All Seasons";
  const adjustment = (amountDeducted = 200, productName = product) => ({
    productName, amountDeducted, unit: "g", previousQuantity: 999999, newQuantity: 0,
  });
  const stock = async () => Number((await storage.getInventoryItem(user.id, product))?.currentQuantity);
  beforeAll(async () => { app = await createTestApp(); });
  beforeEach(async () => {
    user = await createTestUser(`concurrency-${randomUUID()}`);
    await createTestInventoryItem(user.id, product, 1000, "g");
  });
  afterEach(async () => { if (user) await cleanupTestUser(user.id); });

  it("reserves a week once even when requests pass the initial check together", async () => {
    const results = await Promise.allSettled([
      applyWeek(user.id, 7, [adjustment()]),
      applyWeek(user.id, 7, [adjustment()]),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const failure = results.find(r => r.status === "rejected") as PromiseRejectedResult;
    expect(failure.reason).toBeInstanceOf(WeekAlreadyAppliedError);
    expect(await stock()).toBe(800);
    expect((await storage.getAppliedWeek(user.id, 7))?.adjustments).toHaveLength(1);
  });

  it("returns 409 for the losing duplicate API request", async () => {
    const send = () => request(app).post("/api/applied-weeks").set(createAuthenticatedRequest(user.id))
      .send({ weekNumber: 8, adjustments: [adjustment()] });
    const responses = await Promise.all([send(), send()]);
    expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
    expect(await stock()).toBe(800);
  });

  it("serializes different weeks and makes undo idempotent", async () => {
    await Promise.all([applyWeek(user.id, 9, [adjustment(200)]), applyWeek(user.id, 10, [adjustment(100)])]);
    expect(await stock()).toBe(700);
    const results = await Promise.all([storage.undoWeekApplication(user.id, 9), storage.undoWeekApplication(user.id, 9)]);
    expect(results.sort()).toEqual([false, true]);
    expect(await stock()).toBe(900);
    await storage.undoWeekApplication(user.id, 10);
    expect(await stock()).toBe(1000);
  });

  it("restores only consumed stock and preserves purchases after applying", async () => {
    await createTestInventoryItem(user.id, product, 50, "g");
    await applyWeek(user.id, 11, [adjustment(200)]);
    expect(await stock()).toBe(0);
    await createTestInventoryItem(user.id, product, 300, "g");
    expect(await storage.undoWeekApplication(user.id, 11)).toBe(true);
    expect(await stock()).toBe(350);
  });

  it("rolls back earlier deductions if a later adjustment fails", async () => {
    await expect(applyWeek(user.id, 12, [adjustment(), adjustment("invalid-number" as any)])).rejects.toThrow();
    expect(await stock()).toBe(1000);
    expect(await storage.getAppliedWeek(user.id, 12)).toBeUndefined();
  });

  it("handles repeated product adjustments sequentially and restores their combined consumption", async () => {
    await applyWeek(user.id, 13, [adjustment(200), adjustment(100)]);
    expect(await stock()).toBe(700);
    expect(await storage.undoWeekApplication(user.id, 13)).toBe(true);
    expect(await stock()).toBe(1000);
  });

  it("converts restored consumption if the inventory unit changed after applying", async () => {
    await applyWeek(user.id, 14, [adjustment(200)]);
    await createTestInventoryItem(user.id, product, 1.8, "kg");
    expect(await storage.undoWeekApplication(user.id, 14)).toBe(true);
    expect(await stock()).toBe(2);
  });

  it("adds JSON 404 responses without a SPA fallback", async () => {
    for (const method of ["get", "post", "put", "delete"] as const) {
      const response = await request(app)[method]("/api/not-a-real-route");
      expect(response.status).toBe(404);
      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.body).toEqual({ error: "API route not found" });
    }
  });

  it("runs all statements inside a real transaction", async () => {
    const result = await db.batch([
      db.execute(sql`SELECT txid_current() AS id`),
      db.execute(sql`SELECT txid_current() AS id`),
    ]);
    expect(result[0].rows).toEqual(result[1].rows);
  });
});
