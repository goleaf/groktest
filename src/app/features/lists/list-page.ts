import { Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowedApp } from '../../data/borrowed-app';
import type { ListFilter } from '../../domain/query';
import type { Loan } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { EmptyState } from '../../ui/empty-state';
import { Icon, type IconName } from '../../ui/icon';
import { iconForFilter, iconForScope } from '../../ui/icon-for';
import { LoanRow } from '../../ui/loan-row';
import { PageHeading } from '../../ui/page-heading';

@Component({
  selector: 'app-list-page',
  imports: [EmptyState, LoanRow, Icon, FormsModule, PageHeading],
  template: `
    <section class="page">
      <app-page-heading [icon]="icon()" [title]="i18n.t(titleKey())" />
      <div class="scope-switch" role="group" [attr.aria-label]="i18n.t('records.scopeLabel')">
        @for (option of scopes; track option) {
          <button
            type="button"
            [class.on]="scope() === option"
            [attr.aria-pressed]="scope() === option"
            (click)="scope.set(option)"
          >
            <app-icon class="control-icon" [name]="iconForScope(option)" />
            {{ i18n.t('records.' + option) }}
          </button>
        }
      </div>
      @if (all().length === 0) {
        <app-empty-state
          [icon]="icon()"
          [message]="i18n.t(emptyKey())"
          [actionLabel]="i18n.t(emptyActionKey())"
        />
      } @else {
        <label class="search-field">
          <app-icon name="search" />
          <input
            type="search"
            [attr.aria-label]="i18n.t('search.title')"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            [placeholder]="i18n.t('search.placeholder')"
            name="list-search"
          />
        </label>
        <div class="chips" role="group" [attr.aria-label]="i18n.t('filter.label')">
          @for (option of filters; track option) {
            <button
              type="button"
              [class.on]="filter() === option"
              [attr.aria-pressed]="filter() === option"
              (click)="filter.set(option)"
            >
              <app-icon class="control-icon" [name]="iconForFilter(option)" />
              {{ i18n.t('filter.' + option) }}
            </button>
          }
        </div>
        @if (shown().length === 0) {
          <p class="search-guidance"><app-icon name="search" /> {{ i18n.t('search.none') }}</p>
        } @else {
          <ul class="loan-list">
            @for (loan of shown(); track loan.id) {
              <li><app-loan-row [loan]="loan" [remaining]="remainingOf(loan.id)" /></li>
            }
          </ul>
        }
      }
    </section>
  `,
})
export class ListPage {
  readonly direction = input.required<'all' | 'lent' | 'borrowed'>();
  readonly titleKey = input.required<string>();
  readonly emptyKey = input.required<string>();
  readonly emptyActionKey = input.required<string>();
  readonly icon = input.required<IconName>();

  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly all = signal<Loan[]>([]);
  protected readonly scope = linkedSignal<'all' | 'lent' | 'borrowed'>(() => this.direction());
  protected readonly scopes: ('all' | 'lent' | 'borrowed')[] = ['all', 'lent', 'borrowed'];
  protected readonly remaining = signal<ReadonlyMap<string, string | null>>(new Map());
  protected readonly query = signal('');
  protected readonly filter = signal<ListFilter>('all');
  protected readonly filters: ListFilter[] = ['all', 'items', 'money', 'overdue', 'due_soon'];
  protected readonly shown = computed(() =>
    this.app.filterLoans(this.all(), this.query(), this.filter()),
  );
  protected readonly iconForScope = iconForScope;
  protected readonly iconForFilter = iconForFilter;

  constructor() {
    effect(() => {
      this.app.revision();
      const direction = this.scope();
      const locale = this.i18n.locale();
      void this.app.activeLoans(direction === 'all' ? undefined : direction).then(async (value) => {
        this.all.set(value);
        this.remaining.set(await this.app.remainingMap(value, locale));
      });
    });
  }

  protected remainingOf(id: string): string | null {
    return this.remaining().get(id) ?? null;
  }
}
