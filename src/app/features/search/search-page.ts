import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';
import { LoanRow } from '../../ui/loan-row';

@Component({
  selector: 'app-search-page',
  imports: [FormsModule, Icon, LoanRow],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ i18n.t('search.title') }}</h1>
          <p class="page-intro">{{ i18n.t('search.intro') }}</p>
        </div>
      </header>
      <div class="search-workbench">
        <label class="search-field">
          <app-icon name="search" />
          <input
            type="search"
            [attr.aria-label]="i18n.t('search.ariaLabel')"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            [placeholder]="i18n.t('search.placeholder')"
            name="global-search"
          />
        </label>
      </div>
      @if (!query().trim()) {
        <p class="search-guidance"><app-icon name="info" /> {{ i18n.t('search.hint') }}</p>
      } @else if (results().length === 0) {
        <p class="search-guidance"><app-icon name="search" /> {{ i18n.t('search.none') }}</p>
      } @else {
        <p class="result-count">{{ i18n.t('search.resultCount', { count: results().length }) }}</p>
        <ul class="loan-list">
          @for (loan of results(); track loan.id) {
            <li><app-loan-row [loan]="loan" [remaining]="remainingOf(loan.id)" /></li>
          }
        </ul>
      }
    </section>
  `,
})
export class SearchPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly query = signal('');
  protected readonly results = signal<Loan[]>([]);
  protected readonly remaining = signal<ReadonlyMap<string, string | null>>(new Map());

  constructor() {
    effect(() => {
      this.app.revision();
      const query = this.query();
      void this.app.search(query).then(async (loans) => {
        this.results.set(loans);
        this.remaining.set(await this.app.remainingMap(loans));
      });
    });
  }

  protected remainingOf(id: string): string | null {
    return this.remaining().get(id) ?? null;
  }
}
