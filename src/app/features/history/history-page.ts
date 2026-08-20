import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { EmptyState } from '../../ui/empty-state';
import { Icon } from '../../ui/icon';
import { LoanRow } from '../../ui/loan-row';

@Component({
  selector: 'app-history-page',
  imports: [EmptyState, LoanRow, Icon, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ i18n.t('history.title') }}</h1>
          <p class="page-intro">{{ i18n.t('history.intro') }}</p>
        </div>
      </header>
      @if (all().length === 0) {
        <app-empty-state [message]="i18n.t('history.empty')" />
      } @else {
        <label class="search-field">
          <app-icon name="search" />
          <input
            type="search"
            [attr.aria-label]="i18n.t('search.title')"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            [placeholder]="i18n.t('search.placeholder')"
            name="history-search"
          />
        </label>
        @if (shown().length === 0) {
          <p class="hint">{{ i18n.t('search.none') }}</p>
        } @else {
          <ul class="loan-list">
            @for (loan of shown(); track loan.id) {
              <li><app-loan-row [loan]="loan" /></li>
            }
          </ul>
        }
      }
    </section>
  `,
})
export class HistoryPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly all = signal<Loan[]>([]);
  protected readonly query = signal('');
  protected readonly shown = computed(() => this.app.filterLoans(this.all(), this.query(), 'all'));

  constructor() {
    effect(() => {
      this.app.revision();
      void this.app.history().then((value) => this.all.set(value));
    });
  }
}
