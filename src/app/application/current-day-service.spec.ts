import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLoan, type DomainClock } from '../domain/commands';
import { CLOCK } from '../data/clock';
import { CurrentDayService } from './current-day-service';

describe('CurrentDayService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('owns the reactive day and refreshes at midnight, focus and visible-page restoration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 20, 23, 59, 59));
    const clock: DomainClock = {
      now: () => new Date(),
      timeZone: () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };
    TestBed.configureTestingModule({
      providers: [CurrentDayService, { provide: CLOCK, useValue: clock }],
    });

    const currentDay = TestBed.inject(CurrentDayService);
    const refresh = vi.spyOn(currentDay, 'refresh');
    const loan = createLoan(
      {
        direction: 'lent',
        kind: 'physical_item',
        personId: 'person-1',
        personName: 'Peter',
        itemName: 'drill',
        dueOn: '2026-08-21',
      },
      clock,
    ).loan;

    expect(currentDay.today()).toBe('2026-08-20');
    expect(currentDay.daysUntilDue(loan)).toBe(1);

    vi.advanceTimersByTime(2_000);
    expect(currentDay.today()).toBe('2026-08-21');
    expect(currentDay.daysUntilDue(loan)).toBe(0);
    expect(refresh).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('focus'));
    expect(refresh).toHaveBeenCalledTimes(2);

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(2);

    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(3);

    currentDay.ngOnDestroy();
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refresh).toHaveBeenCalledTimes(3);
  });
});
