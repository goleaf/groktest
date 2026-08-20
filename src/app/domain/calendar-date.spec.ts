import { describe, expect, it } from 'vitest';
import {
    addCalendarDays,
    isCalendarDate,
    isDueSoonOn,
    isOverdueOn,
    todayInTimeZone,
} from './calendar-date';

describe('calendar dates', () => {
    it('accepts real calendar dates only', () => {
        expect(isCalendarDate('2026-08-20')).toBe(true);
        expect(isCalendarDate('2026-02-29')).toBe(false);
        expect(isCalendarDate('2026-8-20')).toBe(false);
        expect(isCalendarDate('2026-08-20T00:00:00.000Z')).toBe(false);
    });

    it('does not mark a due date overdue on that local calendar day', () => {
        expect(isOverdueOn('2026-08-20', '2026-08-20')).toBe(false);
        expect(isOverdueOn('2026-08-20', '2026-08-21')).toBe(true);
        expect(isOverdueOn(null, '2026-08-21')).toBe(false);
    });

    it('treats due today through the window as due soon, not overdue', () => {
        expect(isDueSoonOn('2026-08-20', '2026-08-20', 3)).toBe(true);
        expect(isDueSoonOn('2026-08-23', '2026-08-20', 3)).toBe(true);
        expect(isDueSoonOn('2026-08-24', '2026-08-20', 3)).toBe(false);
        expect(isDueSoonOn('2026-08-19', '2026-08-20', 3)).toBe(false);
    });

    it('adds calendar days without timezone midnight tricks', () => {
        expect(addCalendarDays('2026-08-20', 1)).toBe('2026-08-21');
        expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('reads today in the given time zone, not UTC', () => {
        const lateEveningUtc = new Date('2026-08-20T22:30:00.000Z');
        expect(todayInTimeZone(lateEveningUtc, 'Pacific/Auckland')).toBe('2026-08-21');
        expect(todayInTimeZone(lateEveningUtc, 'UTC')).toBe('2026-08-20');
    });
});
