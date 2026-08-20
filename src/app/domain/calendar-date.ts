import { DomainError } from './errors';

export type CalendarDate = string;
export type Instant = string;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLISECONDS_PER_DAY = 86_400_000;

function calendarDateUtc(value: CalendarDate): number {
  const match = DATE_PATTERN.exec(requireCalendarDate(value));
  if (!match) {
    throw new DomainError('invalid_calendar_date');
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function isCalendarDate(value: string): value is CalendarDate {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}

export function requireCalendarDate(value: string): CalendarDate {
  if (!isCalendarDate(value)) {
    throw new DomainError('invalid_calendar_date');
  }
  return value;
}

export function instantFrom(date: Date): Instant {
  return date.toISOString();
}

/** Today's calendar date in the given IANA time zone. Never uses UTC midnight as a fake local date. */
export function todayInTimeZone(now: Date, timeZone: string): CalendarDate {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return requireCalendarDate(formatted);
}

export function compareCalendarDates(left: CalendarDate, right: CalendarDate): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const utc = calendarDateUtc(date) + days * MILLISECONDS_PER_DAY;
  const shifted = new Date(utc);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Signed calendar days from start to end, independent of local timezone or daylight saving. */
export function calendarDaysBetween(start: CalendarDate, end: CalendarDate): number {
  return (calendarDateUtc(end) - calendarDateUtc(start)) / MILLISECONDS_PER_DAY;
}

export function isOverdueOn(dueOn: CalendarDate | null, today: CalendarDate): boolean {
  if (!dueOn) {
    return false;
  }
  return compareCalendarDates(dueOn, today) < 0;
}

export function isDueSoonOn(
  dueOn: CalendarDate | null,
  today: CalendarDate,
  windowDays: number,
): boolean {
  if (!dueOn || isOverdueOn(dueOn, today)) {
    return false;
  }
  const latest = addCalendarDays(today, windowDays);
  return compareCalendarDates(dueOn, latest) <= 0;
}
