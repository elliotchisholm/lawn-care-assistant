import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './test-utils';
import ProductCard from '@/components/ProductCard';
import MarkAsAppliedDialog, { AppliedBadge } from '@/components/MarkAsAppliedDialog';
import { Toaster } from '@/components/ui/toaster';
import type { ApplicationDay } from '@shared/schema';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true, isLoading: false }),
}));
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock('@/lib/queryClient', async (orig) => ({ ...(await orig<typeof import('@/lib/queryClient')>()), apiRequest }));

const days: ApplicationDay[] = [
  {
    dayLabel: null,
    dayNotes: null,
    products: [
      { name: 'Liquid Iron', alternativeName: null, quantity: 20, unit: 'ml', type: 'liquid', productNotes: null },
    ],
  },
];

let applied = false;
const fetchMock = vi.fn(async (url: string) => {
  if (url === '/api/inventory') {
    return new Response(
      JSON.stringify([{ id: 'i1', userId: 'u1', productName: 'Liquid Iron', currentQuantity: '500', unit: 'ml', lastUpdated: '' }]),
      { status: 200 },
    );
  }
  if (url.startsWith('/api/applied-weeks/')) {
    return applied
      ? new Response(JSON.stringify({ id: 'a', userId: 'u1', weekNumber: 46, appliedAt: '2026-11-15T00:00:00Z', adjustments: [] }), { status: 200 })
      : new Response('', { status: 404 });
  }
  return new Response('[]', { status: 200 });
});

describe('MarkAsAppliedDialog', () => {
  const base = { isOpen: true, onClose: vi.fn(), weekNumber: 46, onConfirm: vi.fn() };
  const ok = { productName: 'Liquid Iron', amountToDeduct: 20, unit: 'ml', currentInventory: 500, newInventory: 480, isInsufficient: false };
  const short = { ...ok, productName: 'Granular N', currentInventory: 5, newInventory: -15, isInsufficient: true };

  it('confirms with adjustments', () => {
    const onConfirm = vi.fn();
    render(<MarkAsAppliedDialog {...base} adjustments={[ok]} onConfirm={onConfirm} />);
    expect(screen.getByTestId('dialog-mark-applied')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('button-confirm-mark-applied'));
    expect(onConfirm).toHaveBeenCalledWith([ok]);
  });

  it('blocks confirm when stock is short', () => {
    render(<MarkAsAppliedDialog {...base} adjustments={[ok, short]} />);
    expect(screen.getByTestId('alert-insufficient-inventory')).toBeInTheDocument();
    expect(screen.getByTestId('button-confirm-mark-applied')).toBeDisabled();
  });

  it('cancel calls onClose', () => {
    const onClose = vi.fn();
    render(<MarkAsAppliedDialog {...base} adjustments={[ok]} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('button-cancel-mark-applied'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AppliedBadge', () => {
  it('undo fires handler', () => {
    const onUndo = vi.fn();
    render(<AppliedBadge weekNumber={46} appliedDate="Nov 15, 2026" onUndo={onUndo} />);
    fireEvent.click(screen.getByTestId('button-undo-application'));
    expect(onUndo).toHaveBeenCalled();
  });
});

describe('ProductCard apply and undo', () => {
  beforeEach(() => {
    applied = false;
    apiRequest.mockReset();
    apiRequest.mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('posts the applied week with scaled adjustments after confirm', async () => {
    render(<ProductCard applicationDays={days} lawnSize={200} weekNumber={46} isCurrentWeek />);
    fireEvent.click(await screen.findByTestId('button-mark-as-applied'));
    await waitFor(() => expect(screen.getByTestId('button-confirm-mark-applied')).toBeEnabled());
    fireEvent.click(screen.getByTestId('button-confirm-mark-applied'));
    await waitFor(() => expect(apiRequest).toHaveBeenCalled());
    const [method, url, body] = apiRequest.mock.calls[0];
    expect(method).toBe('POST');
    expect(url).toBe('/api/applied-weeks');
    expect(body.weekNumber).toBe(46);
    expect(body.adjustments[0]).toMatchObject({ productName: 'Liquid Iron', amountDeducted: 40, unit: 'ml' });
  });

  it('shows applied state and undoes via DELETE', async () => {
    applied = true;
    render(<ProductCard applicationDays={days} lawnSize={100} weekNumber={46} isCurrentWeek />);
    fireEvent.click(await screen.findByTestId('button-undo-application'));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/applied-weeks/46'));
  });

  it('offers undo in the success toast', async () => {
    render(<><ProductCard applicationDays={days} lawnSize={100} weekNumber={46} isCurrentWeek /><Toaster /></>);
    fireEvent.click(await screen.findByTestId('button-mark-as-applied'));
    await waitFor(() => expect(screen.getByTestId('button-confirm-mark-applied')).toBeEnabled());
    fireEvent.click(screen.getByTestId('button-confirm-mark-applied'));
    const undo = await screen.findByTestId('button-toast-undo');
    fireEvent.click(undo);
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('DELETE', '/api/applied-weeks/46'));
  });
});
