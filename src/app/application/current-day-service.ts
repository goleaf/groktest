import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy, signal } from '@angular/core';
import {
  calendarDaysBetween,
  todayInTimeZone,
  type CalendarDate,
} from '../domain/calendar-date';
import type { DomainClock } from '../domain/commands';
import type { Loan } from '../domain/types';
import { CLOCK } from '../data/clock';

@Injectable({ providedIn: 'root' })
export class CurrentDayService implements OnDestroy {
  private readonly currentDayState = signal<CalendarDate>('1970-01-01');
  readonly currentDay = this.currentDayState.asReadonly();
  private readonly view: Window | null;
  private timerId: number | null = null;
  private started = false;

  private readonly handleFocus = (): void => this.refreshAndReschedule();
  private readonly handleVisibilityChange = (): void => {
    if (this.document?.visibilityState === 'visible') {
      this.refreshAndReschedule();
    }
  };

  constructor(
    @Inject(CLOCK) private readonly clock: DomainClock,
    @Inject(DOCUMENT) private readonly document: Document | null = null,
  ) {
    this.view = this.document?.defaultView ?? null;
    this.refresh();
    this.start();
  }

  today(): CalendarDate {
    return this.currentDay();
  }

  refresh(): CalendarDate {
    const next = todayInTimeZone(this.clock.now(), this.clock.timeZone());
    if (next !== this.currentDayState()) {
      this.currentDayState.set(next);
    }
    return next;
  }

  daysUntilDue(loan: Loan): number | null {
    return loan.dueOn ? calendarDaysBetween(this.today(), loan.dueOn) : null;
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      this.view?.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.started) {
      this.view?.removeEventListener('focus', this.handleFocus);
      this.document?.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.started = false;
    }
  }

  private start(): void {
    if (this.started || !this.document) {
      return;
    }
    this.started = true;
    this.view?.addEventListener('focus', this.handleFocus);
    this.document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.scheduleNextLocalMidnight();
  }

  private refreshAndReschedule(): void {
    this.refresh();
    this.scheduleNextLocalMidnight();
  }

  private scheduleNextLocalMidnight(): void {
    if (!this.view) {
      return;
    }
    if (this.timerId !== null) {
      this.view.clearTimeout(this.timerId);
    }
    const now = this.clock.now();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const delay = Math.max(1_000, nextDay.getTime() - now.getTime());
    this.timerId = this.view.setTimeout(() => this.refreshAndReschedule(), delay);
  }
}
