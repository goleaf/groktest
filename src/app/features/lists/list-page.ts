import { Component, computed, inject, input, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationRevision } from '../../application/application-revision';
import { RecordsQueryService } from '../../application/records-query-service';
import type { ListFilter } from '../../domain/query';
import { I18n } from '../../i18n/i18n';
import { EmptyState } from '../../ui/empty-state';
import { Icon, type IconName } from '../../ui/icon';
import { iconForFilter, iconForScope } from '../../ui/icon-for';
import { LoanRow } from '../../ui/loan-row';
import { PageHeading } from '../../ui/page-heading';
import {
  parseRecordListState,
  recordListQueryParams,
  type RecordListScope,
  type RecordListState,
} from './record-list-state';

@Component({
  selector: 'app-list-page',
  imports: [EmptyState, LoanRow, Icon, FormsModule, PageHeading],
  template: `
    <section class="page records-page">
      <app-page-heading [icon]="icon()" [title]="i18n.t(titleKey())" />
      <div class="scope-switch" role="group" [attr.aria-label]="i18n.t('records.scopeLabel')">
        @for (option of scopes; track option) {
          <button
            type="button"
            [class.on]="scope() === option"
            [attr.aria-pressed]="scope() === option"
            (click)="setScope(option)"
          >
            <app-icon class="control-icon" [name]="iconForScope(option)" />
            {{ i18n.t('records.' + option) }}
          </button>
        }
      </div>
      @if (loadError(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      } @else if (loading() && all().length === 0) {
        <p class="search-guidance" role="status">{{ i18n.t('records.loading') }}</p>
      } @else if (all().length === 0) {
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
            (ngModelChange)="setQuery($event)"
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
              (click)="setFilter(option)"
            >
              <app-icon class="control-icon" [name]="iconForFilter(option)" />
              {{ i18n.t('filter.' + option) }}
            </button>
          }
        </div>
        <div class="results-bar" role="status" aria-live="polite">
          <strong>{{ i18n.t('records.showing', { count: shown().length }) }}</strong>
          <span>{{ i18n.t('records.localOnly') }}</span>
        </div>
        @if (shown().length === 0) {
          <p class="search-guidance"><app-icon name="search" /> {{ i18n.t('search.none') }}</p>
        } @else {
          <div class="ledger-columns" aria-hidden="true">
            <span>{{ i18n.t('records.handoff') }}</span>
            <span>{{ i18n.t('records.asset') }}</span>
            <span>{{ i18n.t('records.status') }}</span>
          </div>
          <ul class="loan-list">
            @for (loan of shown(); track loan.id) {
              <li>
                <app-loan-row [loan]="loan" [remainingMinorUnits]="remainingOf(loan.id)" />
              </li>
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
  private readonly queries = inject(RecordsQueryService);
  private readonly revision = inject(ApplicationRevision);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly urlState = computed(() =>
    parseRecordListState(this.queryParamMap(), this.direction()),
  );
  protected readonly scope = computed(() => this.urlState().scope);
  protected readonly scopes: RecordListScope[] = ['all', 'lent', 'borrowed'];
  protected readonly query = computed(() => this.urlState().query);
  protected readonly filter = computed(() => this.urlState().filter);
  protected readonly filters: ListFilter[] = ['all', 'items', 'money', 'overdue', 'due_soon'];
  private readonly recordsResource = resource({
    params: () => ({
      revision: this.revision.value(),
      scope: this.scope(),
    }),
    loader: async ({ params }) => {
      const loans = await this.queries.activeLoans(
        params.scope === 'all' ? undefined : params.scope,
      );
      return {
        loans,
        remaining: await this.queries.remainingMap(loans),
      };
    },
  });
  protected readonly all = computed(() => this.recordsResource.value()?.loans ?? []);
  protected readonly remaining = computed(
    () => this.recordsResource.value()?.remaining ?? new Map<string, bigint | null>(),
  );
  protected readonly loading = this.recordsResource.isLoading;
  protected readonly loadError = computed(() =>
    this.recordsResource.error() ? this.i18n.t('records.loadError') : '',
  );
  protected readonly shown = computed(() =>
    this.queries.filterLoans(this.all(), this.query(), this.filter()),
  );
  protected readonly iconForScope = iconForScope;
  protected readonly iconForFilter = iconForFilter;

  protected remainingOf(id: string): bigint | null {
    return this.remaining().get(id) ?? null;
  }

  protected setScope(scope: RecordListScope): void {
    this.navigateWithState({ ...this.urlState(), scope });
  }

  protected setFilter(filter: ListFilter): void {
    this.navigateWithState({ ...this.urlState(), filter });
  }

  protected setQuery(query: string): void {
    this.navigateWithState({ ...this.urlState(), query }, true);
  }

  private navigateWithState(state: RecordListState, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: recordListQueryParams(state, this.direction(), this.route.snapshot.queryParams),
      replaceUrl,
    });
  }
}
