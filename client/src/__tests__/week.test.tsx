import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getCurrentWeekNumber } from '@/lib/week';
import { useCurrentWeek } from '@/hooks/useCurrentWeek';

describe('getCurrentWeekNumber', () => {
  it('returns week 1 on 1 January', () => {
    expect(getCurrentWeekNumber(new Date(2026, 0, 1))).toBe(1);
  });

  it('advances every seven days', () => {
    expect(getCurrentWeekNumber(new Date(2026, 0, 8))).toBe(2);
    expect(getCurrentWeekNumber(new Date(2026, 10, 15))).toBe(46);
  });

  it('never exceeds 52 at year end', () => {
    expect(getCurrentWeekNumber(new Date(2026, 11, 31))).toBe(52);
  });
});

describe('useCurrentWeek', () => {
  it('uses the supplied date', () => {
    const { result } = renderHook(() => useCurrentWeek(new Date(2026, 0, 8)));
    expect(result.current).toBe(2);
  });
});
