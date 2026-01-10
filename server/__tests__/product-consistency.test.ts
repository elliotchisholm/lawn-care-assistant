import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from './helpers';
import type { Express } from 'express';
import { CANONICAL_PRODUCT_NAMES } from '../../shared/canonicalProductNames';

describe('Product Consistency', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('all schedule products exist in canonical product list', async () => {
    const response = await request(app).get('/api/schedule');
    expect(response.status).toBe(200);

    const scheduleProducts = new Set<string>();

    for (const week of response.body) {
      if (week.applicationDays && Array.isArray(week.applicationDays)) {
        for (const day of week.applicationDays) {
          if (day.products && Array.isArray(day.products)) {
            for (const product of day.products) {
              scheduleProducts.add(product.name);
            }
          }
        }
      }
    }

    const invalidProducts: string[] = [];
    for (const productName of scheduleProducts) {
      if (!CANONICAL_PRODUCT_NAMES.includes(productName as any)) {
        invalidProducts.push(productName);
      }
    }

    expect(invalidProducts).toEqual([]);
  });

  it('identifies orphaned canonical products not used in schedule (informational)', async () => {
    const response = await request(app).get('/api/schedule');
    expect(response.status).toBe(200);

    const scheduleProducts = new Set<string>();

    for (const week of response.body) {
      if (week.applicationDays && Array.isArray(week.applicationDays)) {
        for (const day of week.applicationDays) {
          if (day.products && Array.isArray(day.products)) {
            for (const product of day.products) {
              scheduleProducts.add(product.name);
            }
          }
        }
      }
    }

    const orphanedProducts: string[] = [];
    for (const canonicalName of CANONICAL_PRODUCT_NAMES) {
      if (!scheduleProducts.has(canonicalName)) {
        orphanedProducts.push(canonicalName);
      }
    }

    const knownOrphanedProducts = ['Wetter 3W'];
    expect(orphanedProducts.sort()).toEqual(knownOrphanedProducts.sort());
  });
});
