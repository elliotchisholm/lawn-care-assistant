import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from './test-utils';
import AppShell from '@/components/AppShell';
import { isActivePath } from '@/lib/navItems';

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
vi.mock('@/lib/LawnSizeContext', () => ({ useLawnSize: () => ({ lawnSize: 100 }) }));

describe('AppShell', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false });
  });

  it('renders header, children, and both navs', () => {
    render(<AppShell><p>Page body</p></AppShell>);
    expect(screen.getByTestId('text-app-title')).toBeInTheDocument();
    expect(screen.getByText('Page body')).toBeInTheDocument();
    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('side-nav')).toBeInTheDocument();
  });

  it('links each tab to its route and marks the active one', () => {
    render(<AppShell><p>x</p></AppShell>);
    expect(screen.getByTestId('tab-nav-this-week')).toHaveAttribute('href', '/');
    expect(screen.getByTestId('tab-nav-schedule')).toHaveAttribute('href', '/schedule');
    expect(screen.getByTestId('tab-nav-stock')).toHaveAttribute('href', '/stock');
    expect(screen.getByTestId('tab-nav-buy')).toHaveAttribute('href', '/buy');
    expect(screen.getByTestId('tab-nav-this-week')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('tab-nav-stock')).not.toHaveAttribute('aria-current');
  });

  it('shows lock on stock and buy when signed out only', () => {
    const { unmount } = render(<AppShell><p>x</p></AppShell>);
    expect(screen.getByTestId('tab-nav-stock').querySelector('[aria-label="Sign in required"]')).not.toBeNull();
    expect(screen.getByTestId('tab-nav-schedule').querySelector('[aria-label="Sign in required"]')).toBeNull();
    unmount();
    mockUseAuth.mockReturnValue({ user: { id: 'u' }, isAuthenticated: true, isLoading: false });
    render(<AppShell><p>x</p></AppShell>);
    expect(screen.getByTestId('tab-nav-stock').querySelector('[aria-label="Sign in required"]')).toBeNull();
  });
});

describe('isActivePath', () => {
  it('matches root exactly and others by prefix', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/stock', '/')).toBe(false);
    expect(isActivePath('/stock', '/stock')).toBe(true);
    expect(isActivePath('/stock/1', '/stock')).toBe(true);
    expect(isActivePath('/stockpile', '/stock')).toBe(false);
  });
});
