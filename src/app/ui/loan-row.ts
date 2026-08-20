import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BorrowedApp } from '../data/borrowed-app';
import { formatCalendarDate, formatLoanTitle, localeOf } from '../i18n/format';
import { I18n } from '../i18n/i18n';
import type { Loan } from '../domain/types';
import { Icon } from './icon';
import { iconForLoan } from './icon-for';

@Component({
  selector: 'app-loan-row',
  imports: [RouterLink, Icon],
  template: `
    <a class="loan-row" [routerLink]="['/loans', loan().id]">
      <span class="row-leading" aria-hidden="true"><app-icon [name]="icon()" /></span>
      <span class="body record-row__identity">
        <strong>{{ loan().personNameSnapshot }}</strong>
        <span>{{ title() }}</span>
        <small class="record-row__direction">{{ directionLabel() }}</small>
      </span>
      <span class="meta">
        @if (remaining()) {
          <span>{{ i18n.t('detail.remaining', { amount: remaining()! }) }}</span>
        }
        @if (overdue()) {
          <span class="pill">{{ i18n.t('detail.overdue') }}</span>
        } @else if (dueSoon()) {
          <span class="pill quiet">{{ i18n.t('detail.dueSoon') }}</span>
        } @else if (loan().dueOn) {
          <span>{{ dueLabel() }}</span>
        }
        @if (loan().status === 'completed') {
          <span>{{ i18n.t('loan.statusCompleted') }}</span>
        }
      </span>
      <span class="row-chevron" aria-hidden="true"><app-icon name="chevron" /></span>
    </a>
  `,
})
export class LoanRow {
  readonly loan = input.required<Loan>();
  readonly remaining = input<string | null>(null);
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly locale = localeOf();

  protected readonly title = computed(() => formatLoanTitle(this.loan(), this.locale));
  protected readonly overdue = computed(() => this.app.isOverdue(this.loan()));
  protected readonly dueSoon = computed(() => this.app.isDueSoon(this.loan()));
  protected readonly icon = computed(() => iconForLoan(this.loan()));
  protected readonly dueLabel = computed(() => {
    const dueOn = this.loan().dueOn;
    return dueOn ? formatCalendarDate(dueOn, this.locale) : '';
  });
  protected readonly directionLabel = computed(() =>
    this.loan().direction === 'lent'
      ? this.i18n.t('home.youLentIt')
      : this.i18n.t('home.youBorrowedIt'),
  );
}
