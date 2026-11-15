import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './test-utils';
import InventoryManager from '@/components/InventoryManager';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false }),
}));

const recs = vi.hoisted(() => ({ value: [] as any[] }));
vi.mock('@/lib/LawnSizeContext', () => ({ useLawnSize: () => ({ lawnSize: 100 }) }));
vi.mock('@/hooks/usePurchaseRecommendations', () => ({
  usePurchaseRecommendations: () => ({ recommendations: recs.value, isLoading: false }),
}));

const items = [
  { id: 'i1', userId: 'u1', productName: 'Liquid Iron', currentQuantity: '500', unit: 'ml', notes: 'Bought Oct', lastUpdated: '2026-11-01T00:00:00Z' },
  { id: 'i2', userId: 'u1', productName: 'Granular N', currentQuantity: '2', unit: 'kg', lastUpdated: '2026-11-02T00:00:00Z' },
];

const fetchMock = vi.fn();

describe('InventoryManager', () => {
  beforeEach(() => {
    recs.value = [];
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === '/api/inventory' && !init?.method) return new Response(JSON.stringify(items), { status: 200 });
      return new Response(JSON.stringify({}), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists items with quantities and units', async () => {
    render(<InventoryManager />);
    expect(await screen.findByTestId('inventory-item-liquid-iron')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-item-granular-n')).toHaveTextContent('2 kg');
    expect(screen.getByText('Bought Oct')).toBeInTheDocument();
  });

  it('opens the add sheet from the add button', async () => {
    render(<InventoryManager />);
    await screen.findByTestId('inventory-item-liquid-iron');
    fireEvent.click(screen.getByTestId('button-add-inventory'));
    expect(await screen.findByTestId('sheet-inventory-form')).toBeInTheDocument();
    expect(screen.getByTestId('input-quantity')).toHaveValue(null);
    expect(screen.getByTestId('button-save-inventory')).toHaveTextContent('Add');
  });

  it('edits an item with prefilled values and PUTs the update', async () => {
    render(<InventoryManager />);
    fireEvent.click(await screen.findByTestId('button-edit-liquid-iron'));
    const qty = await screen.findByTestId('input-quantity');
    await waitFor(() => expect(qty).toHaveValue(500));
    fireEvent.change(qty, { target: { value: '450' } });
    fireEvent.click(screen.getByTestId('button-save-inventory'));
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([u, i]) => u === '/api/inventory/i1' && i?.method === 'PUT');
      expect(call).toBeTruthy();
      expect(JSON.parse(call![1].body)).toMatchObject({ productName: 'Liquid Iron', currentQuantity: '450', unit: 'ml' });
    });
  });

  it('asks before deleting and then DELETEs', async () => {
    render(<InventoryManager />);
    fireEvent.click(await screen.findByTestId('button-delete-granular-n'));
    expect(fetchMock.mock.calls.some(([, i]) => i?.method === 'DELETE')).toBe(false);
    fireEvent.click(await screen.findByTestId('button-confirm-delete'));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u, i]) => u === '/api/inventory/i2' && i?.method === 'DELETE')).toBe(true),
    );
  });

  it('cancel keeps the item', async () => {
    render(<InventoryManager />);
    fireEvent.click(await screen.findByTestId('button-delete-granular-n'));
    fireEvent.click(await screen.findByTestId('button-cancel-delete'));
    expect(fetchMock.mock.calls.some(([, i]) => i?.method === 'DELETE')).toBe(false);
  });

  it('flags low and out-of-stock items from the schedule-based recommendations', async () => {
    recs.value = [
      { productName: 'Liquid Iron', unit: 'ml', currentStock: 500, totalNeeded: 800, shortfall: 300, weeksUntilEmpty: 2, suggestedPurchase: 300 },
      { productName: 'Granular N', unit: 'g', currentStock: 0, totalNeeded: 400, shortfall: 400, weeksUntilEmpty: 0, suggestedPurchase: 400 },
    ];
    render(<InventoryManager />);
    expect(await screen.findByTestId('text-stock-warning-liquid-iron')).toHaveTextContent('Low: about 2 weeks left');
    expect(screen.getByTestId('text-stock-warning-granular-n')).toHaveTextContent('Out of stock');
    expect(screen.getByTestId('badge-low-stock-count')).toHaveTextContent('2 low');
  });

  it('shows no warnings when nothing is short', async () => {
    render(<InventoryManager />);
    await screen.findByTestId('inventory-item-liquid-iron');
    expect(screen.queryByTestId('text-stock-warning-liquid-iron')).not.toBeInTheDocument();
    expect(screen.queryByTestId('badge-low-stock-count')).not.toBeInTheDocument();
  });
});
