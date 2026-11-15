import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import WeekHeader from '@/components/WeekHeader';
import type { WeeklySchedule } from '@shared/schema';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

const week = { id: 'w', weekNumber: 46, month: 'November', weekOfMonth: 2, isRestWeek: 0, applicationDays: [], generalNotes: null } as unknown as WeeklySchedule;

describe('WeekHeader', () => {
  it('shows week, month and current badge', () => {
    render(<WeekHeader selectedWeek={46} currentWeek={46} onWeekChange={() => {}} week={week} lawnSize={120} onLawnSizeClick={() => {}} />);
    expect(screen.getByTestId('text-week-number')).toHaveTextContent('Week 46');
    expect(screen.getByTestId('text-application-period')).toHaveTextContent('November – Week 2');
    expect(screen.getByText('Current week')).toBeInTheDocument();
    expect(screen.getByText('Application')).toBeInTheDocument();
    expect(screen.getByTestId('button-open-lawn-size')).toHaveTextContent('120 m²');
  });

  it('marks rest weeks and non-current weeks', () => {
    render(<WeekHeader selectedWeek={10} currentWeek={46} onWeekChange={() => {}} week={{ ...week, isRestWeek: 1 }} lawnSize={100} onLawnSizeClick={() => {}} />);
    expect(screen.getByText('Rest week')).toBeInTheDocument();
    expect(screen.getByText('Not current')).toBeInTheDocument();
  });

  it('fires week change and lawn size handlers', () => {
    const onWeekChange = vi.fn();
    const onLawn = vi.fn();
    render(<WeekHeader selectedWeek={46} currentWeek={46} onWeekChange={onWeekChange} week={week} lawnSize={100} onLawnSizeClick={onLawn} />);
    fireEvent.click(screen.getByTestId('button-week-next'));
    expect(onWeekChange).toHaveBeenCalledWith(47);
    fireEvent.click(screen.getByTestId('button-open-lawn-size'));
    expect(onLawn).toHaveBeenCalled();
  });
});
