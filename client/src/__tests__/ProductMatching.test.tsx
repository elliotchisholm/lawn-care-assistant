import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen } from './test-utils';
import ProductCard from '@/components/ProductCard';
import { sameProduct, getStockInUnit, findByProduct } from '@/lib/productMatching';
import { computePurchaseRecommendations, getStockWarning } from '@/lib/purchaseRecommendations';
import type { ApplicationDay, WeeklySchedule } from '@shared/schema';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false }) }));

const inv = (productName: string, currentQuantity: string, unit: string) => ({ id: productName + unit, userId: 'u1', productName, currentQuantity, unit, lastUpdated: '' });

describe('sameProduct', () => {
  it('treats known variations as the same product', () => {
    expect(sameProduct('Amino+', 'Amino')).toBe(true);
    expect(sameProduct('NZLA Nurture', 'Nurture')).toBe(true);
    expect(sameProduct('Iron Plus', 'Iron+')).toBe(true);
    expect(sameProduct(' Humic+ ', 'Humic+')).toBe(true);
  });
  it('keeps different products apart', () => {
    expect(sameProduct('NZLA Wetter', 'Wetter 3W')).toBe(false);
    expect(sameProduct('Nurture', 'Restore')).toBe(false);
  });
});

describe('getStockInUnit and findByProduct', () => {
  it('sums rows across name variants and units', () => {
    const r = getStockInUnit([inv('Amino', '500', 'ml'), inv('NZLA Amino+', '1', 'L'), inv('Nurture', '999', 'ml')], 'Amino', 'ml');
    expect(r.total).toBe(1500);
    expect(r.itemCount).toBe(2);
  });
  it('reports no rows when nothing matches', () => {
    expect(getStockInUnit([inv('Nurture', '1', 'L')], 'Amino', 'ml')).toEqual({ total: 0, itemCount: 0 });
  });
  it('finds map entries by variant name', () => {
    expect(findByProduct({ Amino: [1] }, 'Amino+')).toEqual([1]);
    expect(findByProduct({ Amino: [1] }, 'Nurture')).toBeUndefined();
  });
});

const entry = (weekNumber: number, name: string): WeeklySchedule =>
  ({ id: `w${weekNumber}`, weekNumber, month: 'January', weekOfMonth: 1, isRestWeek: 0, generalNotes: null,
    applicationDays: [{ dayLabel: null, dayNotes: null, products: [{ name, alternativeName: null, quantity: 100, unit: 'ml', type: 'liquid', productNotes: null }] }] }) as unknown as WeeklySchedule;

describe('Buy maths with name variants', () => {
  const base = { packageSizes: {}, scaleFactor: 1, currentWeekNumber: 1, weeksToAnalyze: 2 };

  it('counts stock held under a different name variant and reports the canonical name', () => {
    const recs = computePurchaseRecommendations({ ...base, fullSchedule: [entry(1, 'NZLA Amino+'), entry(2, 'Amino')], inventory: [inv('Amino', '150', 'ml')] });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ productName: 'Amino', currentStock: 150, totalNeeded: 200, shortfall: 50 });
  });

  it('merges the same product scheduled under different variants', () => {
    const recs = computePurchaseRecommendations({ ...base, fullSchedule: [entry(1, 'Amino+'), entry(2, 'Amino')], inventory: [] });
    expect(recs).toHaveLength(1);
    expect(recs[0].totalNeeded).toBe(200);
  });

  it('stock warnings match across variants', () => {
    const recs = computePurchaseRecommendations({ ...base, fullSchedule: [entry(1, 'Amino'), entry(2, 'Amino')], inventory: [inv('Amino', '50', 'ml')] });
    expect(getStockWarning(recs, 'Amino+')).toMatchObject({ level: 'low' });
  });
});

describe('This Week agrees with Buy', () => {
  const days: ApplicationDay[] = [{ dayLabel: null, dayNotes: null, products: [{ name: 'NZLA Amino+', alternativeName: null, quantity: 100, unit: 'ml', type: 'liquid', productNotes: null }] }];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/api/inventory') return new Response(JSON.stringify([inv('Amino', '500', 'ml')]), { status: 200 });
      return new Response('', { status: 404 });
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows enough stock when inventory uses the canonical name', async () => {
    render(<ProductCard applicationDays={days} lawnSize={100} weekNumber={1} isCurrentWeek={false} />);
    expect(await screen.findByText('Enough')).toBeInTheDocument();
  });
});
