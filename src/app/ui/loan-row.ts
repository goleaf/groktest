import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BorrowedApp } from '../data/borrowed-app';
import { formatLoanTitle } from '../i18n/format';
import { I18n } from '../i18n/i18n';
import type { Loan } from '../domain/types';
import { Icon } from './icon';
import { iconForLoan } from './icon-for';
import { DueStatus } from './due-status';

@Component({
  selector: 'app-loan-row',
  imports: [DueStatus, RouterLink, Icon],
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
          <span class="status-with-icon">
            <app-icon name="money" />
            {{ i18n.t('detail.remaining', { amount: remaining()! }) }}
          </span>
        }
        @if (loan().status === 'active' && loan().dueOn) {
          <app-due-status [dueOn]="loan().dueOn" [daysUntilDue]="daysUntilDue()" />
        }
        @if (loan().status === 'completed') {
          <span class="status-with-icon">
            <app-icon name="check" />
            {{ i18n.t('loan.statusCompleted') }}
          </span>
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
  protected readonly title = computed(() => formatLoanTitle(this.loan(), this.i18n.locale()));
  protected readonly daysUntilDue = computed(() => this.app.daysUntilDue(this.loan()));
  protected readonly icon = computed(() => iconForLoan(this.loan()));
  protected readonly directionLabel = computed(() =>
    this.loan().direction === 'lent'
      ? this.i18n.t('home.youLentIt')
      : this.i18n.t('home.youBorrowedIt'),
  );
}
