import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import PurchaseRecommendations from '@/components/PurchaseRecommendations';
import TabBar from '@/components/TabBar';
import { computePurchaseRecommendations, urgencyOf, getStockWarning, describeStockWarning } from '@/lib/purchaseRecommendations';
import type { WeeklySchedule } from '@shared/schema';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false }),
}));
vi.mock('@/lib/LawnSizeContext', () => ({ useLawnSize: () => ({ lawnSize: 100 }) }));
vi.mock('@/hooks/useCurrentWeek', () => ({ useCurrentWeek: () => 1 }));

(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const entry = (weekNumber: number, products: any[]): WeeklySchedule =>
  ({
    id: `w${weekNumber}`, weekNumber, month: 'January', weekOfMonth: weekNumber, isRestWeek: 0,
    applicationDays: [{ dayLabel: null, dayNotes: null, products }], generalNotes: null,
  }) as unknown as WeeklySchedule;

const p = (name: string, quantity: number, unit = 'ml') => ({ name, alternativeName: null, quantity, unit, type: 'liquid', productNotes: null });

const schedule = [entry(1, [p('Liquid Iron', 100), p('Wetting Agent', 100)]), entry(2, [p('Liquid Iron', 100), p('Wetting Agent', 100)])];
const inventory = [
  { id: 'i1', userId: 'u1', productName: 'Wetting Agent', currentQuantity: '150', unit: 'ml', lastUpdated: '' },
];

function seeded(children: ReactNode, inv = inventory) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['/api/schedule'], schedule);
  client.setQueryData(['/api/inventory', 'u1'], inv);
  client.setQueryData(['/api/package-sizes'], {});
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}

describe('computePurchaseRecommendations', () => {
  const base = { fullSchedule: schedule, inventory, packageSizes: {}, scaleFactor: 1, currentWeekNumber: 1 };

  it('finds shortfalls and sorts by weeks until empty', () => {
    const recs = computePurchaseRecommendations({ ...base, weeksToAnalyze: 2 });
    expect(recs.map((r) => r.productName)).toEqual(['Liquid Iron', 'Wetting Agent']);
    expect(recs[0]).toMatchObject({ currentStock: 0, totalNeeded: 200, shortfall: 200, weeksUntilEmpty: 0 });
    expect(recs[1]).toMatchObject({ currentStock: 150, shortfall: 50, weeksUntilEmpty: 1 });
  });

  it('scales with lawn size', () => {
    const recs = computePurchaseRecommendations({ ...base, scaleFactor: 2, weeksToAnalyze: 1 });
    expect(recs.find((r) => r.productName === 'Liquid Iron')?.totalNeeded).toBe(200);
  });

  it('classifies urgency', () => {
    const rec = (weeksUntilEmpty: number) => ({ weeksUntilEmpty }) as any;
    expect([urgencyOf(rec(0)), urgencyOf(rec(3)), urgencyOf(rec(9))]).toEqual(['now', 'soon', 'later']);
  });
});

describe('getStockWarning', () => {
  const rec = (productName: string, currentStock: number, weeksUntilEmpty: number) => ({ productName, currentStock, weeksUntilEmpty }) as any;

  it('returns null for products not short', () => {
    expect(getStockWarning([rec('A', 10, 1)], 'B')).toBeNull();
  });
  it('flags zero stock as out', () => {
    expect(getStockWarning([rec('A', 0, 0)], 'A')).toEqual({ level: 'out', weeksLeft: 0 });
  });
  it('flags short stock as low with weeks left', () => {
    expect(getStockWarning([rec('A', 50, 2)], 'A')).toEqual({ level: 'low', weeksLeft: 2 });
  });
  it('describes each case', () => {
    expect(describeStockWarning({ level: 'out', weeksLeft: 0 })).toBe('Out of stock');
    expect(describeStockWarning({ level: 'low', weeksLeft: 0 })).toBe('Low: under 1 week left');
    expect(describeStockWarning({ level: 'low', weeksLeft: 1 })).toBe('Low: about 1 week left');
    expect(describeStockWarning({ level: 'low', weeksLeft: 3 })).toBe('Low: about 3 weeks left');
  });
});

describe('PurchaseRecommendations', () => {
  it('groups by urgency and keeps the indexed test ids', () => {
    seeded(<PurchaseRecommendations lawnSize={100} />);
    expect(screen.getByTestId('group-now')).toBeInTheDocument();
    expect(screen.getByTestId('purchase-recommendation-0')).toHaveTextContent('Liquid Iron');
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByTestId('group-later')).toHaveTextContent('Wetting Agent');
  });

  it('changes look-ahead with the preset buttons and keeps the slider in the DOM', () => {
    seeded(<PurchaseRecommendations lawnSize={100} />);
    expect(screen.getByTestId('label-weeks-selector')).toHaveTextContent('8 weeks');
    expect(screen.getByTestId('slider-weeks')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('button-weeks-4'));
    expect(screen.getByTestId('label-weeks-selector')).toHaveTextContent('4 weeks');
    expect(screen.getByTestId('button-weeks-4')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the all-good state when nothing is short', () => {
    const big = [
      { id: 'a', userId: 'u1', productName: 'Liquid Iron', currentQuantity: '5000', unit: 'ml', lastUpdated: '' },
      { id: 'b', userId: 'u1', productName: 'Wetting Agent', currentQuantity: '5000', unit: 'ml', lastUpdated: '' },
    ];
    seeded(<PurchaseRecommendations lawnSize={100} />, big);
    expect(screen.getByText('Your inventory looks good!')).toBeInTheDocument();
  });
});

describe('TabBar buy badge', () => {
  it('shows the number of items to buy', () => {
    seeded(<TabBar />);
    expect(screen.getByTestId('badge-buy-count')).toHaveTextContent('2');
  });
});
