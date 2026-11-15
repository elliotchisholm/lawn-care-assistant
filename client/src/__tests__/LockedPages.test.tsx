import { describe, it, expect, vi } from 'vitest';
import { render, screen } from './test-utils';
import Stock from '@/pages/Stock';
import Buy from '@/pages/Buy';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, isLoading: false }),
}));
vi.mock('@/lib/LawnSizeContext', () => ({ useLawnSize: () => ({ lawnSize: 100 }) }));

describe('signed-out Stock and Buy pages', () => {
  it('Stock shows the locked state with the existing test id', () => {
    render(<Stock />);
    expect(screen.getByTestId('button-login-inventory')).toBeInTheDocument();
  });

  it('Buy shows the locked state with the existing test id', () => {
    render(<Buy />);
    expect(screen.getByTestId('button-login-purchase')).toBeInTheDocument();
  });
});
