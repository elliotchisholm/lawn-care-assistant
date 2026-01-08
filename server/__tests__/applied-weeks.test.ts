import { describe, it, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, cleanupTestUser, createTestInventoryItem, createAuthenticatedRequest, type TestUser } from './helpers';
import type { Express } from 'express';

describe('Applied Weeks API', () => {
  let app: Express;
  let testUser: TestUser;
  let authHeaders: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    testUser = await createTestUser(`aw-${Date.now()}`);
    authHeaders = createAuthenticatedRequest(testUser.id);
  });

  afterEach(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }
  });

  describe('GET /api/applied-weeks/:weekNumber', () => {
    it('returns null for unapplied week', async () => {
      const response = await request(app)
        .get('/api/applied-weeks/1')
        .set(authHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });

    it('returns 400 for invalid week number', async () => {
      const response = await request(app)
        .get('/api/applied-weeks/0')
        .set(authHeaders);

      expect(response.status).toBe(400);
    });

    it('returns 400 for week number > 52', async () => {
      const response = await request(app)
        .get('/api/applied-weeks/53')
        .set(authHeaders);

      expect(response.status).toBe(400);
    });

    it('returns 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/applied-weeks/1');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/applied-weeks', () => {
    it('marks week as applied and deducts inventory', async () => {
      await createTestInventoryItem(testUser.id, 'NZLA Lawn Fertiliser', 1000, 'g');

      const response = await request(app)
        .post('/api/applied-weeks')
        .set(authHeaders)
        .send({
          weekNumber: 5,
          adjustments: [
            {
              productName: 'NZLA Lawn Fertiliser',
              amountDeducted: 200,
              unit: 'g',
              previousQuantity: 1000,
              newQuantity: 800
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.weekNumber).toBe(5);
      expect(response.body.userId).toBe(testUser.id);

      const inventoryResponse = await request(app)
        .get('/api/inventory')
        .set(authHeaders);

      const fertilizer = inventoryResponse.body.find((i: any) => i.productName === 'NZLA Lawn Fertiliser');
      expect(parseFloat(fertilizer.currentQuantity)).toBe(800);
    });

    it('applies Store Zero logic when inventory goes negative', async () => {
      await createTestInventoryItem(testUser.id, 'NZLA Lawn Kelp', 50, 'ml');

      const response = await request(app)
        .post('/api/applied-weeks')
        .set(authHeaders)
        .send({
          weekNumber: 10,
          adjustments: [
            {
              productName: 'NZLA Lawn Kelp',
              amountDeducted: 100,
              unit: 'ml',
              previousQuantity: 50,
              newQuantity: 0
            }
          ]
        });

      expect(response.status).toBe(201);

      const inventoryResponse = await request(app)
        .get('/api/inventory')
        .set(authHeaders);

      const kelp = inventoryResponse.body.find((i: any) => i.productName === 'NZLA Lawn Kelp');
      expect(parseFloat(kelp.currentQuantity)).toBe(0);
    });

    it('handles unit conversion when deducting (g to kg)', async () => {
      await createTestInventoryItem(testUser.id, 'NZLA Lawn Fertiliser', 2, 'kg');

      const response = await request(app)
        .post('/api/applied-weeks')
        .set(authHeaders)
        .send({
          weekNumber: 15,
          adjustments: [
            {
              productName: 'NZLA Lawn Fertiliser',
              amountDeducted: 500,
              unit: 'g',
              previousQuantity: 2000,
              newQuantity: 1500
            }
          ]
        });

      expect(response.status).toBe(201);

      const inventoryResponse = await request(app)
        .get('/api/inventory')
        .set(authHeaders);

      const fertilizer = inventoryResponse.body.find((i: any) => i.productName === 'NZLA Lawn Fertiliser');
      expect(parseFloat(fertilizer.currentQuantity)).toBe(1.5);
    });

    it('validates adjustments structure', async () => {
      const response = await request(app)
        .post('/api/applied-weeks')
        .set(authHeaders)
        .send({
          weekNumber: 20,
          adjustments: [
            {
              productName: 'NZLA Test',
            }
          ]
        });

      expect(response.status).toBe(400);
    });

    it('allows re-applying same week (upsert behavior)', async () => {
      await createTestInventoryItem(testUser.id, 'NZLA Lawn Fertiliser', 1000, 'g');

      const firstApply = await request(app)
        .post('/api/applied-weeks')
        .set(authHeaders)
        .send({
          weekNumber: 35,
          adjustments: [
            {
              productName: 'NZLA Lawn Fertiliser',
              amountDeducted: 100,
              unit: 'g',
              previousQuantity: 1000,
              newQuantity: 900
            }
          ]
        });

      expect(firstApply.status).toBe(201);

      const secondApply = await request(app)
        .post('/api/applied-weeks')
        .set(authHeaders)
        .send({
          weekNumber: 35,
          adjustments: [
            {
              productName: 'NZLA Lawn Fertiliser',
              amountDeducted: 100,
              unit: 'g',
              previousQuantity: 900,
              newQuantity: 800
            }
          ]
        });

      expect(secondApply.status).toBe(201);
      expect(secondApply.body.weekNumber).toBe(35);

      const inventoryCheck = await request(app)
        .get('/api/inventory')
        .set(authHeaders);
      const fertilizer = inventoryCheck.body.find((i: any) => i.productName === 'NZLA Lawn Fertiliser');
      expect(parseFloat(fertilizer.currentQuantity)).toBe(800);
    });
  });

  describe('DELETE /api/applied-weeks/:weekNumber (Undo)', () => {
    it('undoes week application and restores inventory', async () => {
      await createTestInventoryItem(testUser.id, 'NZLA Iron', 500, 'g');

      await request(app)
        .post('/api/applied-weeks')
        .set(authHeaders)
        .send({
          weekNumber: 25,
          adjustments: [
            {
              productName: 'NZLA Iron',
              amountDeducted: 100,
              unit: 'g',
              previousQuantity: 500,
              newQuantity: 400
            }
          ]
        });

      let inventoryCheck = await request(app)
        .get('/api/inventory')
        .set(authHeaders);
      expect(parseFloat(inventoryCheck.body.find((i: any) => i.productName === 'NZLA Iron').currentQuantity)).toBe(400);

      const undoResponse = await request(app)
        .delete('/api/applied-weeks/25')
        .set(authHeaders);

      expect(undoResponse.status).toBe(204);

      inventoryCheck = await request(app)
        .get('/api/inventory')
        .set(authHeaders);
      expect(parseFloat(inventoryCheck.body.find((i: any) => i.productName === 'NZLA Iron').currentQuantity)).toBe(500);

      const weekCheck = await request(app)
        .get('/api/applied-weeks/25')
        .set(authHeaders);
      expect(weekCheck.body).toBeNull();
    });

    it('returns 404 for unapplied week', async () => {
      const response = await request(app)
        .delete('/api/applied-weeks/30')
        .set(authHeaders);

      expect(response.status).toBe(404);
    });

    it('returns 400 for invalid week number', async () => {
      const response = await request(app)
        .delete('/api/applied-weeks/0')
        .set(authHeaders);

      expect(response.status).toBe(400);
    });
  });
});
