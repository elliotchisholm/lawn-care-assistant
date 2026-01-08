import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

vi.mock('../replitAuth', () => ({
  setupAuth: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: (req: any, res: any, next: any) => {
    if (req.headers['x-test-user-id']) {
      req.user = {
        claims: {
          sub: req.headers['x-test-user-id']
        }
      };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}));

beforeAll(async () => {
  console.log('Test suite starting...');
});

afterAll(async () => {
  console.log('Test suite complete.');
});
