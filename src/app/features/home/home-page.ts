import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { HomeAction, HomeSummary } from '../../domain/types';
import { I18n } from '../../i18n/i18n';
import { DueStatus } from '../../ui/due-status';
import { EmptyState } from '../../ui/empty-state';
import { HandoffLine } from '../../ui/handoff-line';
import { Icon } from '../../ui/icon';
import { iconForAction } from '../../ui/icon-for';
import { PageHeading } from '../../ui/page-heading';

@Component({
  selector: 'app-home-page',
  imports: [DueStatus, EmptyState, HandoffLine, RouterLink, Icon, PageHeading],
  template: `
    <section class="page home-page">
      <app-page-heading
        icon="home"
        [title]="i18n.t('home.heading')"
        [intro]="i18n.t('home.intro')"
      />
      @if (loadError(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      } @else if (summary(); as data) {
        @if (data.actions.length === 0) {
          <app-empty-state
            icon="home"
            [message]="i18n.t('home.empty')"
            [actionLabel]="i18n.t('home.emptyAction')"
          />
        } @else {
          <section class="overview-ribbon" [attr.aria-label]="i18n.t('home.summary')">
            <a class="overview-stat record-count" routerLink="/records">
              <span>{{ i18n.t('home.openLabel') }}</span>
              <strong>{{ openCount(data) }}</strong>
              <small>{{ i18n.t('home.openCount', { count: openCount(data) }) }}</small>
            </a>
            <a class="overview-stat" routerLink="/lent">
              <span>{{ i18n.t('nav.lent') }}</span>
              <strong>{{ data.activeLentCount }}</strong>
              <small>{{ i18n.t('home.lentCount', { count: data.activeLentCount }) }}</small>
            </a>
            <a class="overview-stat" routerLink="/borrowed">
              <span>{{ i18n.t('nav.borrowed') }}</span>
              <strong>{{ data.activeBorrowedCount }}</strong>
              <small>{{ i18n.t('home.borrowedCount', { count: data.activeBorrowedCount }) }}</small>
            </a>
            <a class="overview-stat is-overdue" routerLink="/records">
              <span>{{ i18n.t('home.overdueLabel') }}</span>
              <strong>{{ data.overdueCount }}</strong>
              <small>{{ i18n.t('home.overdue', { count: data.overdueCount }) }}</small>
            </a>
          </section>

          <div class="home-workspace">
            <section class="home-ledger" aria-labelledby="open-records-title">
              <div class="section-bar">
                <div>
                  <p class="section-kicker">{{ i18n.t('home.needsAttention') }}</p>
                  <h2 id="open-records-title" class="section-heading">
                    {{ i18n.t('home.openRecords') }}
                  </h2>
                </div>
                <a class="icon-link" routerLink="/records">
                  {{ i18n.t('home.viewAll') }}
                  <app-icon name="chevron" />
                </a>
              </div>
              <ul class="home-ledger-list">
                @for (action of data.actions; track action.loanId) {
                  <li class="home-ledger-row" [class.is-overdue]="action.urgency === 'overdue'">
                    <span class="ledger-icon" aria-hidden="true">
                      <app-icon [name]="iconForAction(action.messageKey)" />
                    </span>
                    <a class="ledger-record" [routerLink]="['/loans', action.loanId]">
                      <app-handoff-line
                        [direction]="action.direction"
                        [personName]="action.personName"
                      />
                      <strong>{{ action.subject }}</strong>
                      <small>{{ i18n.t(action.messageKey, action.params) }}</small>
                    </a>
                    <span class="ledger-due">
                      @if (action.dueOn) {
                        <app-due-status
                          [dueOn]="action.dueOn"
                          [daysUntilDue]="action.daysUntilDue"
                        />
                      } @else {
                        <small>{{ i18n.t('home.noDueDate') }}</small>
                      }
                    </span>
                    @if (action.assetKind === 'physical_item') {
                      <button
                        class="ledger-return-action"
                        type="button"
                        [attr.aria-label]="i18n.t('home.markReturned')"
                        [disabled]="busyLoanId() === action.loanId"
                        (click)="markReturned(action)"
                      >
                        <app-icon name="check" />
                        <span>{{ i18n.t('home.markReturned') }}</span>
                      </button>
                    } @else {
                      <a
                        class="ledger-open-action"
                        [routerLink]="['/loans', action.loanId]"
                        [attr.aria-label]="i18n.t('home.openRecord')"
                      >
                        <app-icon name="chevron" />
                      </a>
                    }
                  </li>
                }
              </ul>
            </section>

            <aside class="home-context-rail">
              <section class="due-rail" aria-labelledby="due-rail-title">
                <div class="rail-heading">
                  <app-icon name="calendar" />
                  <h2 id="due-rail-title">{{ i18n.t('home.dueNext') }}</h2>
                </div>
                <ol>
                  @for (action of data.dueNext; track action.loanId) {
                    <li>
                      <a [routerLink]="['/loans', action.loanId]">
                        <span>{{ action.personName }}</span>
                        <strong>{{ action.subject }}</strong>
                        <app-due-status
                          [dueOn]="action.dueOn"
                          [daysUntilDue]="action.daysUntilDue"
                        />
                      </a>
                    </li>
                  }
                </ol>
              </section>

              <section class="people-rail" aria-labelledby="people-rail-title">
                <div class="rail-heading">
                  <app-icon name="people" />
                  <h2 id="people-rail-title">{{ i18n.t('home.people') }}</h2>
                </div>
                <ul>
                  @for (person of data.recentPeople; track person.personId) {
                    <li>
                      <a [routerLink]="['/people', person.personId]">
                        <span class="person-avatar" aria-hidden="true">{{
                          person.personName.charAt(0)
                        }}</span>
                        <span>
                          <strong>{{ person.personName }}</strong>
                          <small>{{
                            i18n.t('home.personOpen', { count: person.activeCount })
                          }}</small>
                        </span>
                        <app-icon name="chevron" />
                      </a>
                    </li>
                  }
                </ul>
              </section>
            </aside>
          </div>
        }
      }
    </section>
  `,
})
export class HomePage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly summaryResource = resource({
    params: () => ({
      revision: this.app.revision(),
      currentDay: this.app.currentDay(),
      locale: this.i18n.locale(),
    }),
    loader: ({ params }) => this.app.home(params.locale),
  });
  protected readonly summary = computed(() => this.summaryResource.value() ?? null);
  protected readonly loadError = computed(() =>
    this.summaryResource.error() ? this.i18n.t('home.loadError') : '',
  );
  protected readonly busyLoanId = signal<string | null>(null);
  protected readonly iconForAction = iconForAction;

  protected openCount(summary: HomeSummary): number {
    return summary.activeLentCount + summary.activeBorrowedCount;
  }

  protected async markReturned(action: HomeAction): Promise<void> {
    if (action.assetKind !== 'physical_item' || this.busyLoanId()) {
      return;
    }
    this.busyLoanId.set(action.loanId);
    try {
      await this.app.markReturned(action.loanId);
    } finally {
      this.busyLoanId.set(null);
    }
  }
}
