import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApplicationRevision } from '../../application/application-revision';
import { PeopleQueryService, type PersonListRow } from '../../application/people-query-service';
import { I18n } from '../../i18n/i18n';
import { EmptyState } from '../../ui/empty-state';
import { Icon } from '../../ui/icon';
import { PageHeading } from '../../ui/page-heading';

@Component({
  selector: 'app-people-page',
  imports: [EmptyState, FormsModule, RouterLink, Icon, PageHeading],
  template: `
    <section class="page">
      <app-page-heading
        icon="people"
        [title]="i18n.t('people.title')"
        [intro]="i18n.t('people.intro')"
      />
      @if (loadError(); as message) {
        <p class="error icon-line" role="alert"><app-icon name="warning" /> {{ message }}</p>
      } @else if (loading()) {
        <p class="loading-row icon-line" role="status">
          <app-icon name="clock" /> {{ i18n.t('people.loading') }}
        </p>
      } @else if (rows().length === 0) {
        <app-empty-state icon="people" [message]="i18n.t('people.empty')" />
      } @else {
        <section class="people-overview" [attr.aria-label]="i18n.t('people.summary')">
          <div>
            <span>{{ i18n.t('people.peopleLabel') }}</span>
            <strong>{{ rows().length }}</strong>
          </div>
          <div>
            <span>{{ i18n.t('people.openLabel') }}</span>
            <strong>{{ activeTotal() }}</strong>
          </div>
          <div>
            <span>{{ i18n.t('nav.lent') }}</span>
            <strong>{{ lentTotal() }}</strong>
          </div>
          <div>
            <span>{{ i18n.t('nav.borrowed') }}</span>
            <strong>{{ borrowedTotal() }}</strong>
          </div>
        </section>
        <label class="people-search" for="people-search">
          <span class="icon-line"
            ><app-icon name="search" /> {{ i18n.t('people.searchLabel') }}</span
          >
          <input
            id="people-search"
            type="search"
            name="people-search"
            autocomplete="off"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            [placeholder]="i18n.t('people.searchPlaceholder')"
          />
        </label>
        @if (visibleRows().length === 0) {
          <app-empty-state icon="search" [message]="i18n.t('people.none')" />
        } @else {
          <ul class="loan-list">
            @for (row of visibleRows(); track row.person.id) {
              <li>
                <a class="loan-row" [routerLink]="['/people', row.person.id]">
                  <span class="person-avatar" aria-hidden="true">{{
                    row.person.displayName.charAt(0)
                  }}</span>
                  <span class="body record-row__identity">
                    <strong>{{ row.person.displayName }}</strong>
                    <span class="icon-line">
                      <app-icon name="records" />
                      {{ i18n.t('people.active', { count: row.activeCount }) }}
                    </span>
                    <small class="person-row-meta">
                      @if (row.lentActiveCount) {
                        <span
                          ><app-icon name="lent" />
                          {{ i18n.t('people.lentActive', { count: row.lentActiveCount }) }}</span
                        >
                      }
                      @if (row.borrowedActiveCount) {
                        <span
                          ><app-icon name="borrowed" />
                          {{
                            i18n.t('people.borrowedActive', { count: row.borrowedActiveCount })
                          }}</span
                        >
                      }
                      @if (row.historyCount) {
                        <span
                          ><app-icon name="history" />
                          {{ i18n.t('people.historyCount', { count: row.historyCount }) }}</span
                        >
                      }
                    </small>
                  </span>
                  <span class="row-chevron" aria-hidden="true"><app-icon name="chevron" /></span>
                </a>
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
})
export class PeoplePage {
  protected readonly i18n = inject(I18n);
  private readonly queries = inject(PeopleQueryService);
  private readonly revision = inject(ApplicationRevision);
  private readonly rowsResource = resource({
    params: () => ({ revision: this.revision.value() }),
    loader: () => this.queries.peopleWithCounts(),
  });
  protected readonly rows = computed<PersonListRow[]>(() => this.rowsResource.value() ?? []);
  protected readonly loading = this.rowsResource.isLoading;
  protected readonly loadError = computed(() =>
    this.rowsResource.error() ? this.i18n.t('people.loadError') : '',
  );
  protected readonly query = signal('');
  protected readonly activeTotal = computed(() =>
    this.rows().reduce((total, row) => total + row.activeCount, 0),
  );
  protected readonly lentTotal = computed(() =>
    this.rows().reduce((total, row) => total + row.lentActiveCount, 0),
  );
  protected readonly borrowedTotal = computed(() =>
    this.rows().reduce((total, row) => total + row.borrowedActiveCount, 0),
  );
  protected readonly visibleRows = computed(() => {
    const query = this.query().trim().toLocaleLowerCase(this.i18n.locale());
    if (!query) {
      return this.rows();
    }
    return this.rows().filter((row) =>
      row.person.displayName.toLocaleLowerCase(this.i18n.locale()).includes(query),
    );
  });
}
