import { Component, effect, inject, input, signal } from '@angular/core';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { EmptyState } from '../../ui/empty-state';
import { LoanRow } from '../../ui/loan-row';

@Component({
  selector: 'app-list-page',
  imports: [EmptyState, LoanRow],
  template: `
    <section class="page">
      <h1>{{ i18n.t(titleKey()) }}</h1>
      @if (loans().length === 0) {
        <app-empty-state [message]="i18n.t(emptyKey())" [actionLabel]="i18n.t(emptyActionKey())" />
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
export class ListPage {
  readonly direction = input.required<'lent' | 'borrowed'>();
  readonly titleKey = input.required<string>();
  readonly emptyKey = input.required<string>();
  readonly emptyActionKey = input.required<string>();

  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly loans = signal<Loan[]>([]);

  constructor() {
    effect(() => {
      this.app.revision();
      const direction = this.direction();
      void this.app.activeLoans(direction).then((value) => this.loans.set(value));
    });
  }
}
