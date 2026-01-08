import { describe, it, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, cleanupTestUser, createTestInventoryItem, createAuthenticatedRequest, type TestUser } from './helpers';
import type { Express } from 'express';

describe('Inventory API', () => {
  let app: Express;
  let testUser: TestUser;
  let authHeaders: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    testUser = await createTestUser(`inv-${Date.now()}`);
    authHeaders = createAuthenticatedRequest(testUser.id);
  });

  afterEach(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }
  });

  describe('GET /api/inventory', () => {
    it('returns empty array for user with no inventory', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set(authHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/inventory');

      expect(response.status).toBe(401);
    });

    it('returns user inventory items', async () => {
      await createTestInventoryItem(testUser.id, 'NZLA Lawn Fertiliser', 500, 'g');
      await createTestInventoryItem(testUser.id, 'NZLA Liquid Fertiliser', 250, 'ml');

      const response = await request(app)
        .get('/api/inventory')
        .set(authHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((i: any) => i.productName)).toContain('NZLA Lawn Fertiliser');
      expect(response.body.map((i: any) => i.productName)).toContain('NZLA Liquid Fertiliser');
    });
  });

  describe('POST /api/inventory', () => {
    it('creates a new inventory item', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set(authHeaders)
        .send({
          productName: 'NZLA Lawn Kelp',
          currentQuantity: '100',
          unit: 'ml'
        });

      expect(response.status).toBe(201);
      expect(response.body.productName).toBe('NZLA Lawn Kelp');
      expect(response.body.currentQuantity).toBe('100');
      expect(response.body.unit).toBe('ml');
      expect(response.body.userId).toBe(testUser.id);
    });

    it('upserts existing product with same name', async () => {
      await createTestInventoryItem(testUser.id, 'NZLA Lawn Kelp', 100, 'ml');

      const response = await request(app)
        .post('/api/inventory')
        .set(authHeaders)
        .send({
          productName: 'NZLA Lawn Kelp',
          currentQuantity: '200',
          unit: 'ml'
        });

      expect(response.status).toBe(201);
      expect(response.body.currentQuantity).toBe('200');

      const listResponse = await request(app)
        .get('/api/inventory')
        .set(authHeaders);

      const kelpItems = listResponse.body.filter((i: any) => i.productName === 'NZLA Lawn Kelp');
      expect(kelpItems).toHaveLength(1);
    });

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set(authHeaders)
        .send({
          productName: 'NZLA Test Product'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid data');
    });
  });

  describe('PUT /api/inventory/:id', () => {
    it('updates inventory quantity', async () => {
      const item = await createTestInventoryItem(testUser.id, 'NZLA Humic Acid', 500, 'ml');

      const response = await request(app)
        .put(`/api/inventory/${item.id}`)
        .set(authHeaders)
        .send({
          currentQuantity: '750'
        });

      expect(response.status).toBe(200);
      expect(response.body.currentQuantity).toBe('750');
    });

    it('updates inventory unit', async () => {
      const item = await createTestInventoryItem(testUser.id, 'NZLA Humic Acid', 1, 'L');

      const response = await request(app)
        .put(`/api/inventory/${item.id}`)
        .set(authHeaders)
        .send({
          currentQuantity: '1000',
          unit: 'ml'
        });

      expect(response.status).toBe(200);
      expect(response.body.unit).toBe('ml');
      expect(response.body.currentQuantity).toBe('1000');
    });

    it('returns 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/inventory/non-existent-id')
        .set(authHeaders)
        .send({
          currentQuantity: '100'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/inventory/:id', () => {
    it('deletes inventory item', async () => {
      const item = await createTestInventoryItem(testUser.id, 'NZLA Biostimulant', 300, 'ml');

      const response = await request(app)
        .delete(`/api/inventory/${item.id}`)
        .set(authHeaders);

      expect(response.status).toBe(204);

      const listResponse = await request(app)
        .get('/api/inventory')
        .set(authHeaders);

      expect(listResponse.body.find((i: any) => i.id === item.id)).toBeUndefined();
    });

    it('returns 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/inventory/non-existent-id')
        .set(authHeaders);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/inventory/product/:productName', () => {
    it('returns specific inventory item by product name', async () => {
      await createTestInventoryItem(testUser.id, 'NZLA Iron', 200, 'g');

      const response = await request(app)
        .get(`/api/inventory/product/${encodeURIComponent('NZLA Iron')}`)
        .set(authHeaders);

      expect(response.status).toBe(200);
      expect(response.body.productName).toBe('NZLA Iron');
      expect(response.body.currentQuantity).toBe('200');
    });

    it('returns 404 for non-existent product', async () => {
      const response = await request(app)
        .get(`/api/inventory/product/${encodeURIComponent('Non Existent Product')}`)
        .set(authHeaders);

      expect(response.status).toBe(404);
    });
  });
});
