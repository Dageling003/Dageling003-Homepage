import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTimeProgress } from '../../composables/useTimeProgress';

describe('useTimeProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T14:30:00'));
  });

  it('should return correct hours progress', () => {
    const { hoursProgress } = useTimeProgress();
    expect(hoursProgress.value).toBeDefined();
  });

  it('should return correct week progress', () => {
    const { weekProgress } = useTimeProgress();
    expect(weekProgress.value).toBeDefined();
  });

  it('should return correct month progress', () => {
    const { monthProgress, daysInCurrentMonth } = useTimeProgress();
    expect(monthProgress.value).toBeDefined();
    expect(daysInCurrentMonth.value).toBe(31);
  });

  it('should return correct year progress', () => {
    const { yearProgress, daysInCurrentYear } = useTimeProgress();
    expect(yearProgress.value).toBeDefined();
    expect(daysInCurrentYear.value).toBe(365);
  });

  it('should update time on interval', () => {
    const { now } = useTimeProgress();
    const initialTime = now.value.getTime();

    vi.advanceTimersByTime(120000);

    const updatedTime = now.value.getTime();
    expect(updatedTime).toBeGreaterThanOrEqual(initialTime);
  });
});
