import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import WeeklySchedule from '@/components/WeeklySchedule';
import WeekDetailSheet from '@/components/WeekDetailSheet';
import { groupByMonth } from '@/lib/scheduleUtils';
import { parseWeekParam } from '@/lib/week';
import type { WeeklySchedule as Entry } from '@shared/schema';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null, isAuthenticated: false, isLoading: false }) }));

const mk = (weekNumber: number, month: string, weekOfMonth: number, rest = 0, products: any[] = []): Entry =>
  ({
    id: `w${weekNumber}`, weekNumber, month, weekOfMonth, isRestWeek: rest,
    applicationDays: rest ? [] : [{ dayLabel: 'Day 1', dayNotes: 'Water in', products }],
    generalNotes: null,
  }) as unknown as Entry;

const liquid = { name: 'Liquid Iron', alternativeName: 'Iron Plus', quantity: 20, unit: 'ml', type: 'liquid', productNotes: null };
const data = [mk(1, 'January', 1, 0, [liquid]), mk(2, 'January', 2, 1), mk(5, 'February', 1, 0, [liquid])];

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['/api/schedule'], data);
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}

describe('scheduleUtils and week param', () => {
  it('groups consecutive weeks by month', () => {
    expect(groupByMonth(data).map((g) => [g.month, g.weeks.length])).toEqual([['January', 2], ['February', 1]]);
  });
  it('parses valid week params only', () => {
    expect(parseWeekParam('?week=12')).toBe(12);
    expect(parseWeekParam('?week=0')).toBeNull();
    expect(parseWeekParam('?week=53')).toBeNull();
    expect(parseWeekParam('?week=abc')).toBeNull();
    expect(parseWeekParam('')).toBeNull();
  });
});

describe('WeeklySchedule', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders month groups, rest weeks, products and current marker', () => {
    wrap(<WeeklySchedule currentWeek={5} />);
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('February')).toBeInTheDocument();
    expect(screen.getByText('Rest week')).toBeInTheDocument();
    expect(screen.getAllByText('Liquid Iron or Iron Plus')).toHaveLength(2);
    expect(screen.getByTestId('schedule-week-4')).toHaveAttribute('aria-current', 'date');
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('calls onSelectWeek when a row is tapped', () => {
    const onSelect = vi.fn();
    wrap(<WeeklySchedule currentWeek={5} onSelectWeek={onSelect} />);
    fireEvent.click(screen.getByTestId('schedule-week-0'));
    expect(onSelect).toHaveBeenCalledWith(data[0]);
  });
});

describe('WeekDetailSheet', () => {
  it('shows products and opens in This week', () => {
    const onOpen = vi.fn();
    wrap(<WeekDetailSheet entry={data[0]} currentWeek={5} onClose={() => {}} onOpenInThisWeek={onOpen} />);
    expect(screen.getByTestId('sheet-week-detail')).toBeInTheDocument();
    expect(screen.getByText(/Liquid Iron/)).toBeInTheDocument();
    expect(screen.getByText('Water in')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('button-open-in-this-week'));
    expect(onOpen).toHaveBeenCalledWith(1);
  });

  it('shows rest week copy and nothing for a null entry', () => {
    const { unmount } = wrap(<WeekDetailSheet entry={data[1]} currentWeek={5} onClose={() => {}} onOpenInThisWeek={() => {}} />);
    expect(screen.getByText(/No product application/)).toBeInTheDocument();
    unmount();
    wrap(<WeekDetailSheet entry={null} currentWeek={5} onClose={() => {}} onOpenInThisWeek={() => {}} />);
    expect(screen.queryByTestId('sheet-week-detail')).not.toBeInTheDocument();
  });
});
