import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { BorrowedApp } from '../data/borrowed-app';

@Injectable({ providedIn: 'root' })
export class CurrentDayTracker implements OnDestroy {
  private readonly app = inject(BorrowedApp);
  private readonly document = inject(DOCUMENT);
  private readonly view = this.document.defaultView;
  private timerId: number | null = null;

  private readonly handleFocus = (): void => this.refreshAndReschedule();
  private readonly handleVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') {
      this.refreshAndReschedule();
    }
  };

  constructor() {
    this.app.refreshCurrentDay();
    this.view?.addEventListener('focus', this.handleFocus);
    this.document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.scheduleNextLocalMidnight();
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      this.view?.clearTimeout(this.timerId);
    }
    this.view?.removeEventListener('focus', this.handleFocus);
    this.document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private refreshAndReschedule(): void {
    this.app.refreshCurrentDay();
    this.scheduleNextLocalMidnight();
  }

  private scheduleNextLocalMidnight(): void {
    if (!this.view) {
      return;
    }
    if (this.timerId !== null) {
      this.view.clearTimeout(this.timerId);
    }
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const delay = Math.max(1_000, nextDay.getTime() - now.getTime());
    this.timerId = this.view.setTimeout(() => this.refreshAndReschedule(), delay);
  }
}
