import { Component, computed, inject, input } from '@angular/core';
import { DUE_SOON_DAYS } from '../domain/config';
import type { CalendarDate } from '../domain/calendar-date';
import { formatCalendarDate } from '../i18n/format';
import { I18n } from '../i18n/i18n';
import { Icon, type IconName } from './icon';

@Component({
  selector: 'app-due-status',
  imports: [Icon],
  template: `
    @if (copy(); as label) {
      <span
        class="due-status status-with-icon"
        [class.is-overdue]="isOverdue()"
        [class.is-due-soon]="isDueSoon()"
      >
        <app-icon [name]="icon()" />
        <span>{{ label }}</span>
      </span>
    }
  `,
})
export class DueStatus {
  readonly dueOn = input<CalendarDate | null>(null);
  readonly daysUntilDue = input<number | null>(null);
  private readonly i18n = inject(I18n);

  protected readonly isOverdue = computed(() => (this.daysUntilDue() ?? 0) < 0);
  protected readonly isDueSoon = computed(() => {
    const days = this.daysUntilDue();
    return days !== null && days >= 0 && days <= DUE_SOON_DAYS;
  });
  protected readonly icon = computed<IconName>(() =>
    this.isOverdue() ? 'overdue' : this.isDueSoon() ? 'clock' : 'calendar',
  );
  protected readonly copy = computed(() => {
    const dueOn = this.dueOn();
    const days = this.daysUntilDue();
    if (!dueOn || days === null) {
      return '';
    }
    if (days < 0) {
      return this.i18n.t('reminder.overdueBy', { count: Math.abs(days) });
    }
    if (days === 0) {
      return this.i18n.t('reminder.dueToday');
    }
    if (days === 1) {
      return this.i18n.t('reminder.dueTomorrow');
    }
    if (days <= DUE_SOON_DAYS) {
      return this.i18n.t('reminder.dueInDays', { count: days });
    }
    return this.i18n.t('reminder.dueOn', {
      date: formatCalendarDate(dueOn, this.i18n.locale()),
    });
  });
}
