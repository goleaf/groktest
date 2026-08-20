import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BorrowedApp } from '../data/borrowed-app';
import { CurrentDayTracker } from './current-day-tracker';

describe('CurrentDayTracker', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('refreshes at local midnight and when the window regains focus', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 20, 23, 59, 59));
    const refreshCurrentDay = vi.fn();
    TestBed.configureTestingModule({
      providers: [CurrentDayTracker, { provide: BorrowedApp, useValue: { refreshCurrentDay } }],
    });

    const tracker = TestBed.inject(CurrentDayTracker);
    expect(refreshCurrentDay).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_000);
    expect(refreshCurrentDay).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new Event('focus'));
    expect(refreshCurrentDay).toHaveBeenCalledTimes(3);

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refreshCurrentDay).toHaveBeenCalledTimes(3);

    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refreshCurrentDay).toHaveBeenCalledTimes(4);

    tracker.ngOnDestroy();
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(refreshCurrentDay).toHaveBeenCalledTimes(4);
  });
});
