import { Component, effect, inject, signal } from '@angular/core';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { EmptyState } from '../../ui/empty-state';
import { LoanRow } from '../../ui/loan-row';

@Component({
  selector: 'app-history-page',
  imports: [EmptyState, LoanRow],
  template: `
    <section class="page">
      <h1>{{ i18n.t('history.title') }}</h1>
      @if (loans().length === 0) {
        <app-empty-state [message]="i18n.t('history.empty')" />
      } @else {
        <ul class="loan-list">
          @for (loan of loans(); track loan.id) {
            <li><app-loan-row [loan]="loan" /></li>
          }
        </ul>
      }
    </section>
  `,
})
export class HistoryPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly loans = signal<Loan[]>([]);

  constructor() {
    effect(() => {
      this.app.revision();
      void this.app.history().then((value) => this.loans.set(value));
    });
  }
}
