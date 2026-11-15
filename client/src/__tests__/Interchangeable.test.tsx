import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from './test-utils';
import ProductCard from '@/components/ProductCard';
import { getPooledStock, alternativeOf } from '@/lib/productMatching';
import { planWeekAdjustments } from '@/lib/weekAdjustments';
import { computePurchaseRecommendations, getStockWarning } from '@/lib/purchaseRecommendations';
import type { ApplicationDay, WeeklySchedule } from '@shared/schema';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false }) }));

const inv = (productName: string, currentQuantity: string, unit = 'ml') => ({ id: productName, userId: 'u1', productName, currentQuantity, unit, lastUpdated: '' });
const wetter = (quantity = 100, alternativeName: string | null = 'Wetter 3W') => ({ name: 'NZLA Wetter', alternativeName, quantity, unit: 'ml', type: 'liquid' as const, productNotes: null });
const day = (...products: any[]): ApplicationDay => ({ dayLabel: null, dayNotes: null, products });

describe('alternativeOf and getPooledStock', () => {
  it('ignores empty or identical alternatives', () => {
    expect(alternativeOf('NZLA Wetter', null)).toBeNull();
    expect(alternativeOf('NZLA Wetter', 'NZLA Wetter')).toBeNull();
    expect(alternativeOf('NZLA Wetter', 'Wetter 3W')).toBe('Wetter 3W');
  });
  it('pools stock of both products', () => {
    const r = getPooledStock([inv('NZLA Wetter', '60'), inv('Wetter 3W', '1', 'L')], 'NZLA Wetter', 'Wetter 3W', 'ml');
    expect(r).toMatchObject({ total: 1060, primary: 60, alternative: 1000, itemCount: 2 });
  });
  it('is just the primary stock without an alternative', () => {
    expect(getPooledStock([inv('Wetter 3W', '500')], 'NZLA Wetter', null, 'ml').total).toBe(0);
  });
});

describe('planWeekAdjustments', () => {
  it('uses the primary product when it has enough', () => {
    const rows = planWeekAdjustments([day(wetter(100))], [inv('NZLA Wetter', '300'), inv('Wetter 3W', '300')], 1);
    expect(rows).toEqual([{ productName: 'NZLA Wetter', amountToDeduct: 100, unit: 'ml', currentInventory: 300, newInventory: 200, isInsufficient: false }]);
  });

  it('takes the remainder from the alternative after the primary runs out', () => {
    const rows = planWeekAdjustments([day(wetter(100))], [inv('NZLA Wetter', '60'), inv('Wetter 3W', '300')], 1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ productName: 'NZLA Wetter', amountToDeduct: 60, newInventory: 0, isInsufficient: false });
    expect(rows[1]).toMatchObject({ productName: 'Wetter 3W', amountToDeduct: 40, currentInventory: 300, newInventory: 260, isInsufficient: false });
  });

  it('uses only the alternative when the primary has no stock, without a zero row for the primary', () => {
    const rows = planWeekAdjustments([day(wetter(100))], [inv('Wetter 3W', '300')], 1);
    expect(rows.map((r) => [r.productName, r.amountToDeduct])).toEqual([['Wetter 3W', 100]]);
  });

  it('reports the shortfall against the primary when both together are not enough', () => {
    const rows = planWeekAdjustments([day(wetter(100))], [inv('NZLA Wetter', '30'), inv('Wetter 3W', '20')], 1);
    expect(rows[0]).toMatchObject({ productName: 'NZLA Wetter', amountToDeduct: 80, currentInventory: 30, newInventory: -50, isInsufficient: true });
    expect(rows[1]).toMatchObject({ productName: 'Wetter 3W', amountToDeduct: 20, newInventory: 0 });
  });

  it('does not double count stock when a product is used on two days', () => {
    const rows = planWeekAdjustments([day(wetter(100, null)), day(wetter(100, null))], [inv('NZLA Wetter', '150')], 1);
    expect(rows[0]).toMatchObject({ amountToDeduct: 100, newInventory: 50, isInsufficient: false });
    expect(rows[1]).toMatchObject({ amountToDeduct: 100, currentInventory: 50, newInventory: -50, isInsufficient: true });
  });

  it('scales amounts by lawn size and rounds', () => {
    const rows = planWeekAdjustments([day(wetter(25, null))], [inv('NZLA Wetter', '500')], 1.5);
    expect(rows[0].amountToDeduct).toBe(38);
  });
});

describe('Buy with interchangeable products', () => {
  const entry = (weekNumber: number): WeeklySchedule =>
    ({ id: `w${weekNumber}`, weekNumber, month: 'January', weekOfMonth: 1, isRestWeek: 0, generalNotes: null, applicationDays: [day(wetter(100))] }) as unknown as WeeklySchedule;
  const base = { fullSchedule: [entry(1), entry(2)], packageSizes: {}, scaleFactor: 1, currentWeekNumber: 1, weeksToAnalyze: 2 };

  it('counts stock of either product toward the requirement', () => {
    expect(computePurchaseRecommendations({ ...base, inventory: [inv('NZLA Wetter', '100'), inv('Wetter 3W', '100')] })).toEqual([]);
  });

  it('reports one pooled recommendation with the alternative named', () => {
    const recs = computePurchaseRecommendations({ ...base, inventory: [inv('NZLA Wetter', '50'), inv('Wetter 3W', '50')] });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ productName: 'NZLA Wetter', alternativeName: 'Wetter 3W', currentStock: 100, totalNeeded: 200, shortfall: 100 });
  });

  it('warns on both product rows', () => {
    const recs = computePurchaseRecommendations({ ...base, inventory: [inv('Wetter 3W', '50')] });
    expect(getStockWarning(recs, 'NZLA Wetter')).not.toBeNull();
    expect(getStockWarning(recs, 'Wetter 3W')).toMatchObject({ level: 'low' });
  });
});

describe('This Week with an alternative', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/api/inventory') return new Response(JSON.stringify([inv('Wetter 3W', '500')]), { status: 200 });
      return new Response('', { status: 404 });
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows enough stock when only the alternative is stocked', async () => {
    render(<ProductCard applicationDays={[day(wetter(100))]} lawnSize={100} weekNumber={1} isCurrentWeek={false} />);
    expect(await screen.findByText('Enough')).toBeInTheDocument();
    expect(screen.getByTestId('text-current-stock-0-0')).toHaveTextContent('500ml');
  });
});
