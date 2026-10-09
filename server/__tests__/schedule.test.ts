import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, cleanupTestUser, createAuthenticatedRequest, cleanupAllTestUsers } from './helpers';
import type { Express } from 'express';

describe('Schedule API', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('GET /api/schedule', () => {
    it('returns all 52 weeks of schedule data', async () => {
      const response = await request(app)
        .get('/api/schedule');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(52);
    });

    it('each week has required fields', async () => {
      const response = await request(app)
        .get('/api/schedule');

      expect(response.status).toBe(200);
      
      const firstWeek = response.body.find((w: any) => w.weekNumber === 1);
      expect(firstWeek).toBeDefined();
      expect(firstWeek).toHaveProperty('weekNumber');
      expect(firstWeek).toHaveProperty('month');
      expect(firstWeek).toHaveProperty('weekOfMonth');
      expect(firstWeek).toHaveProperty('applicationDays');
    });

    it('is publicly accessible (no auth required)', async () => {
      const response = await request(app)
        .get('/api/schedule');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/schedule/:weekNumber', () => {
    it('returns specific week data', async () => {
      const response = await request(app)
        .get('/api/schedule/1');

      expect(response.status).toBe(200);
      expect(response.body.weekNumber).toBe(1);
    });

    it('returns correct month and week info', async () => {
      const response = await request(app)
        .get('/api/schedule/1');

      expect(response.status).toBe(200);
      expect(response.body.month).toBe('January');
      expect(response.body.weekOfMonth).toBe(1);
    });

    it('returns 400 for week number 0', async () => {
      const response = await request(app)
        .get('/api/schedule/0');

      expect(response.status).toBe(400);
    });

    it('returns 400 for week number 53', async () => {
      const response = await request(app)
        .get('/api/schedule/53');

      expect(response.status).toBe(400);
    });

    it('returns 404 for non-existent week', async () => {
      const response = await request(app)
        .get('/api/schedule/99');

      expect(response.status).toBe(400);
    });

    it('is publicly accessible (no auth required)', async () => {
      const response = await request(app)
        .get('/api/schedule/10');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/package-sizes', () => {
    it('returns package sizes for products', async () => {
      const response = await request(app)
        .get('/api/package-sizes');

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
    });

    it('is publicly accessible (no auth required)', async () => {
      const response = await request(app)
        .get('/api/package-sizes');

      expect(response.status).toBe(200);
    });
  });
});

describe('Auth Guard Tests', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('Protected routes require authentication', () => {
    it('GET /api/auth/user returns 401 without auth', async () => {
      const response = await request(app)
        .get('/api/auth/user');

      expect(response.status).toBe(401);
    });

    it('GET /api/inventory returns 401 without auth', async () => {
      const response = await request(app)
        .get('/api/inventory');

      expect(response.status).toBe(401);
    });

    it('POST /api/inventory returns 401 without auth', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({ productName: 'Test', currentQuantity: '100', unit: 'g' });

      expect(response.status).toBe(401);
    });

    it('GET /api/applied-weeks/:weekNumber returns 401 without auth', async () => {
      const response = await request(app)
        .get('/api/applied-weeks/1');

      expect(response.status).toBe(401);
    });

    it('POST /api/applied-weeks returns 401 without auth', async () => {
      const response = await request(app)
        .post('/api/applied-weeks')
        .send({ weekNumber: 1, adjustments: [] });

      expect(response.status).toBe(401);
    });

    it('GET /api/metrics returns 401 without auth', async () => {
      const response = await request(app)
        .get('/api/metrics');

      expect(response.status).toBe(401);
    });

    it('PUT /api/user/lawn-size returns 401 without auth', async () => {
      const response = await request(app)
        .put('/api/user/lawn-size')
        .send({ lawnSize: 200 });

      expect(response.status).toBe(401);
    });
  });

  describe('Public routes are accessible', () => {
    it('GET /api/health is accessible', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
    });

    it('GET /api/schedule is accessible', async () => {
      const response = await request(app)
        .get('/api/schedule');

      expect(response.status).toBe(200);
    });

    it('GET /api/schedule/:weekNumber is accessible', async () => {
      const response = await request(app)
        .get('/api/schedule/1');

      expect(response.status).toBe(200);
    });

    it('GET /api/package-sizes is accessible', async () => {
      const response = await request(app)
        .get('/api/package-sizes');

      expect(response.status).toBe(200);
    });
  });
});

describe('Health and Metrics Endpoints', () => {
  let app: Express;
  let testUser: any;
  let authHeaders: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await createTestUser(`health-${Date.now()}`);
    authHeaders = createAuthenticatedRequest(testUser.id);
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }
  });

  describe('GET /api/health', () => {
    it('returns health status with expected fields', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toEqual({ status: 'healthy' });
    });

    it('does not disclose database diagnostics publicly', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).not.toHaveProperty('database');
    });

    it('does not disclose memory usage or uptime publicly', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body).not.toHaveProperty('memoryUsage');
      expect(response.body).not.toHaveProperty('uptime');
    });
  });

  describe('GET /api/metrics (authenticated)', () => {
    it('rejects ordinary authenticated users', async () => {
      vi.stubEnv('ADMIN_USER_IDS', '');
      const response = await request(app).get('/api/metrics').set(authHeaders);
      expect(response.status).toBe(403);
      expect(response.body).not.toHaveProperty('totalUsers');
      vi.unstubAllEnvs();
    });

    it('returns metrics only for an explicitly allowed administrator', async () => {
      vi.stubEnv('ADMIN_USER_IDS', testUser.id);
      const response = await request(app)
        .get('/api/metrics')
        .set(authHeaders);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalInventoryItems');
      expect(response.body).toHaveProperty('totalApplicationsMarked');
      expect(response.body).toHaveProperty('totalUndoOperations');
      expect(response.body).toHaveProperty('averageLawnSize');
      expect(response.body).toHaveProperty('timestamp');
      vi.unstubAllEnvs();
    });

    it('returns numeric values for all metrics', async () => {
      vi.stubEnv('ADMIN_USER_IDS', testUser.id);
      const response = await request(app)
        .get('/api/metrics')
        .set(authHeaders);

      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.totalInventoryItems).toBe('number');
      expect(typeof response.body.totalApplicationsMarked).toBe('number');
      expect(typeof response.body.totalUndoOperations).toBe('number');
      expect(typeof response.body.averageLawnSize).toBe('number');
      vi.unstubAllEnvs();
    });
  });
});

describe('User Lawn Size API', () => {
  let app: Express;
  let testUser: any;
  let authHeaders: Record<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
    testUser = await createTestUser(`lawn-${Date.now()}`);
    authHeaders = createAuthenticatedRequest(testUser.id);
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.id);
    }
  });

  describe('PUT /api/user/lawn-size', () => {
    it('updates lawn size for authenticated user', async () => {
      const response = await request(app)
        .put('/api/user/lawn-size')
        .set(authHeaders)
        .send({ lawnSize: 250 });

      expect(response.status).toBe(200);
      expect(response.body.lawnSize).toBe(250);
    });

    it('validates lawn size is positive integer', async () => {
      const response = await request(app)
        .put('/api/user/lawn-size')
        .set(authHeaders)
        .send({ lawnSize: -100 });

      expect(response.status).toBe(400);
    });

    it('validates lawn size is not zero', async () => {
      const response = await request(app)
        .put('/api/user/lawn-size')
        .set(authHeaders)
        .send({ lawnSize: 0 });

      expect(response.status).toBe(400);
    });

    it('validates lawn size is integer', async () => {
      const response = await request(app)
        .put('/api/user/lawn-size')
        .set(authHeaders)
        .send({ lawnSize: 150.5 });

      expect(response.status).toBe(400);
    });
  });
});
