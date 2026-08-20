import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BorrowedApp } from '../data/borrowed-app';
import { formatCalendarDate, formatLoanTitle, localeOf } from '../i18n/format';
import { I18n } from '../i18n/i18n';
import type { Loan } from '../domain/types';

@Component({
  selector: 'app-loan-row',
  imports: [RouterLink],
  template: `
    <a class="loan-row" [routerLink]="['/loans', loan().id]">
      <span class="dir">{{ directionLabel() }}</span>
      <span class="body">
        <strong>{{ loan().personNameSnapshot }}</strong>
        <span>{{ title() }}</span>
      </span>
      <span class="meta">
        @if (overdue()) {
          <span class="pill">{{ i18n.t('detail.overdue') }}</span>
        } @else if (dueSoon()) {
          <span class="pill quiet">{{ i18n.t('detail.dueSoon') }}</span>
        } @else if (loan().dueOn) {
          <span>{{ i18n.t('detail.dueOn', { date: dueLabel() }) }}</span>
        }
        @if (loan().status === 'completed') {
          <span>{{ i18n.t('loan.statusCompleted') }}</span>
        }
      </span>
    </a>
  `,
})
export class LoanRow {
  readonly loan = input.required<Loan>();
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly locale = localeOf();

  protected readonly title = computed(() => formatLoanTitle(this.loan(), this.locale));
  protected readonly overdue = computed(() => this.app.isOverdue(this.loan()));
  protected readonly dueSoon = computed(() => this.app.isDueSoon(this.loan()));
  protected readonly dueLabel = computed(() => {
    const dueOn = this.loan().dueOn;
    return dueOn ? formatCalendarDate(dueOn, this.locale) : '';
  });
  protected readonly directionLabel = computed(() =>
    this.loan().direction === 'lent' ? this.i18n.t('add.lent') : this.i18n.t('add.borrowed'),
  );
}
