import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';
import { LoanRow } from '../../ui/loan-row';
import { PageHeading } from '../../ui/page-heading';

@Component({
  selector: 'app-search-page',
  imports: [FormsModule, Icon, LoanRow, PageHeading],
  template: `
    <section class="page">
      <app-page-heading
        icon="search"
        [title]="i18n.t('search.title')"
        [intro]="i18n.t('search.intro')"
      />
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
      } @else if (loadError(); as message) {
        <p class="error icon-line" role="alert"><app-icon name="warning" /> {{ message }}</p>
      } @else if (loading()) {
        <p class="search-guidance icon-line" role="status">
          <app-icon name="search" /> {{ i18n.t('search.loading') }}
        </p>
      } @else if (results().length === 0) {
        <p class="search-guidance"><app-icon name="search" /> {{ i18n.t('search.none') }}</p>
      } @else {
        <p class="result-count icon-line">
          <app-icon name="records" />
          {{ i18n.t('search.resultCount', { count: results().length }) }}
        </p>
        <ul class="loan-list">
          @for (loan of results(); track loan.id) {
            <li>
              <app-loan-row [loan]="loan" [remainingMinorUnits]="remainingOf(loan.id)" />
            </li>
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
  private readonly searchResource = resource({
    params: () => {
      const query = this.query();
      const revision = this.app.revision();
      return query.trim() ? { query, revision } : undefined;
    },
    loader: async ({ params }) => {
      const loans = await this.app.search(params.query);
      return { loans, remaining: await this.app.remainingMap(loans) };
    },
  });
  protected readonly results = computed<Loan[]>(() => this.searchResource.value()?.loans ?? []);
  protected readonly remaining = computed<ReadonlyMap<string, bigint | null>>(
    () => this.searchResource.value()?.remaining ?? new Map(),
  );
  protected readonly loading = this.searchResource.isLoading;
  protected readonly loadError = computed(() =>
    this.searchResource.error() ? this.i18n.t('search.loadError') : '',
  );

  protected remainingOf(id: string): bigint | null {
    return this.remaining().get(id) ?? null;
  }
}
