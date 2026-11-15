import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from './test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ProductCard from '@/components/ProductCard';
import Login from '@/pages/Login';
import type { ApplicationDay } from '@shared/schema';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null, isAuthenticated: false, isLoading: false }) }));

const days: ApplicationDay[] = [
  { dayLabel: null, dayNotes: null, products: [{ name: 'Liquid Iron', alternativeName: null, quantity: 20, unit: 'ml', type: 'liquid', productNotes: null }] },
];

describe('ProductCard when signed out', () => {
  it('shows the quantity needed but no stock status', () => {
    render(<ProductCard applicationDays={days} lawnSize={100} weekNumber={46} isCurrentWeek />);
    expect(screen.getByTestId('text-quantity-0-0')).toHaveTextContent('20ml');
    expect(screen.queryByTestId('badge-stock-0-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('text-current-stock-0-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('button-mark-as-applied')).not.toBeInTheDocument();
  });
});

describe('Login password toggle', () => {
  it('is positioned absolutely inside the field wrapper (not overridden by button styles)', () => {
    render(<Login />);
    expect(screen.getByTestId('button-toggle-password').className).toContain('!absolute');
  });
});

describe('theme-init.js', () => {
  const script = readFileSync(resolve(__dirname, '../../public/theme-init.js'), 'utf8');
  const run = () => new Function(script)();

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('applies dark when saved as dark', () => {
    localStorage.setItem('theme', 'dark');
    run();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('stays light when saved as light even if the system prefers dark', () => {
    localStorage.setItem('theme', 'light');
    (window.matchMedia as any).mockImplementation(() => ({ matches: true }));
    run();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('follows the system preference when nothing is saved', () => {
    (window.matchMedia as any).mockImplementation(() => ({ matches: true }));
    run();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
