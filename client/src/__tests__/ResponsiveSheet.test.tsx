import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResponsiveSheet from '@/components/ResponsiveSheet';
import WeekPicker from '@/components/WeekPicker';

const mobile = vi.hoisted(() => ({ value: false }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mobile.value }));

describe('ResponsiveSheet', () => {
  beforeEach(() => {
    mobile.value = false;
  });

  it.each([false, true])('renders title and children when open (mobile=%s)', (isMobile) => {
    mobile.value = isMobile;
    render(
      <ResponsiveSheet open onOpenChange={() => {}} title="Sheet title" data-testid="sheet">
        <p>Body</p>
      </ResponsiveSheet>,
    );
    expect(screen.getByText('Sheet title')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByTestId('sheet')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(
      <ResponsiveSheet open={false} onOpenChange={() => {}} title="Hidden">
        <p>Body</p>
      </ResponsiveSheet>,
    );
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });
});

describe('WeekPicker', () => {
  it('steps and picks weeks', () => {
    const onChange = vi.fn();
    render(<WeekPicker value={46} currentWeek={46} onChange={onChange} />);
    expect(screen.getByTestId('button-week-open')).toHaveTextContent('Week 46 (current)');
    fireEvent.click(screen.getByTestId('button-week-prev'));
    expect(onChange).toHaveBeenCalledWith(45);
    fireEvent.click(screen.getByTestId('button-week-next'));
    expect(onChange).toHaveBeenCalledWith(47);
    fireEvent.click(screen.getByTestId('button-week-open'));
    fireEvent.click(screen.getByTestId('week-option-12'));
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it('disables stepper at the ends', () => {
    render(<WeekPicker value={1} currentWeek={46} onChange={() => {}} />);
    expect(screen.getByTestId('button-week-prev')).toBeDisabled();
  });
});
