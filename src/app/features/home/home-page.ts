import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { HomeAction, HomeSummary } from '../../domain/types';
import { formatMinorUnits } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import { DueStatus } from '../../ui/due-status';
import { EmptyState } from '../../ui/empty-state';
import { Icon } from '../../ui/icon';
import { iconForAction } from '../../ui/icon-for';
import { PageHeading } from '../../ui/page-heading';

@Component({
  selector: 'app-home-page',
  imports: [DueStatus, EmptyState, RouterLink, Icon, PageHeading],
  template: `
    <section class="page home-page">
      <app-page-heading
        icon="home"
        [title]="i18n.t('home.heading')"
        [intro]="i18n.t('home.intro')"
      />
      @if (summary(); as data) {
        @if (data.actions.length === 0) {
          <app-empty-state
            icon="home"
            [message]="i18n.t('home.empty')"
            [actionLabel]="i18n.t('home.emptyAction')"
          />
        } @else {
          @if (lead(); as first) {
            <section class="attention-band" [class.is-overdue]="first.urgency === 'overdue'">
              <a class="lead-record" [routerLink]="['/loans', first.loanId]">
                <span class="lead-record-icon" aria-hidden="true">
                  <app-icon [name]="iconForAction(first.messageKey)" />
                </span>
                <span class="attention-copy">
                  <h2>{{ i18n.t(first.messageKey, first.params) }}</h2>
                  <app-due-status
                    class="attention-meta"
                    [dueOn]="first.dueOn"
                    [daysUntilDue]="first.daysUntilDue"
                  />
                </span>
                <app-icon class="lead-chevron" name="chevron" />
              </a>
              @if (first.assetKind === 'physical_item') {
                <button
                  class="lead-inline-action"
                  type="button"
                  [disabled]="busyLoanId() === first.loanId"
                  (click)="markReturned(first)"
                >
                  <app-icon name="check" />
                  {{ i18n.t('home.markReturned') }}
                </button>
              } @else {
                <a class="lead-inline-action" [routerLink]="['/loans', first.loanId]">
                  <app-icon name="records" />
                  {{ i18n.t('home.openRecord') }}
                </a>
              }
            </section>
          }
          <a class="record-count" routerLink="/records">
            <app-icon name="records" />
            <strong>{{ i18n.t('home.openCount', { count: openCount(data) }) }}</strong>
            <app-icon name="chevron" />
          </a>
          <div class="home-workspace">
            <section class="home-records" aria-labelledby="open-records-title">
              <div class="section-bar">
                <h2 id="open-records-title" class="section-heading">
                  <app-icon name="records" />
                  {{ i18n.t('home.openRecords') }}
                </h2>
                <a class="icon-link" routerLink="/records">
                  {{ i18n.t('home.viewAll') }}
                  <app-icon name="chevron" />
                </a>
              </div>
              <ul class="action-list open-list">
                @for (action of remainingActions(); track action.loanId) {
                  <li>
                    <a [routerLink]="['/loans', action.loanId]">
                      <app-icon [name]="iconForAction(action.messageKey)" />
                      <span class="action-copy">
                        <strong>{{ i18n.t(action.messageKey, action.params) }}</strong>
                        @if (action.dueOn) {
                          <small>
                            <app-due-status
                              [dueOn]="action.dueOn"
                              [daysUntilDue]="action.daysUntilDue"
                            />
                          </small>
                        } @else {
                          <small>{{ directionLabel(action) }}</small>
                        }
                      </span>
                      <app-icon name="chevron" />
                    </a>
                  </li>
                }
              </ul>
            </section>
            <aside class="home-aside" aria-labelledby="home-aside-title">
              <h2 id="home-aside-title" class="section-heading">
                <app-icon name="info" />
                {{ i18n.t('home.atAGlance') }}
              </h2>
              <dl class="glance-list">
                <div>
                  <dt><app-icon name="records" /> {{ i18n.t('home.openLabel') }}</dt>
                  <dd>{{ openCount(data) }}</dd>
                </div>
                <div class="overdue-glance">
                  <dt><app-icon name="overdue" /> {{ i18n.t('home.overdueLabel') }}</dt>
                  <dd>{{ data.overdueCount }}</dd>
                </div>
              </dl>
              <nav class="direction-links" [attr.aria-label]="i18n.t('home.byDirection')">
                <a routerLink="/lent"><app-icon name="lent" /> {{ i18n.t('nav.lent') }}</a>
                <a routerLink="/borrowed"
                  ><app-icon name="borrowed" /> {{ i18n.t('nav.borrowed') }}</a
                >
              </nav>
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
  protected readonly summary = signal<HomeSummary | null>(null);
  protected readonly lead = computed(() => this.summary()?.actions[0] ?? null);
  protected readonly remainingActions = computed(
    () => this.summary()?.actions.filter((action) => action.loanId !== this.lead()?.loanId) ?? [],
  );
  protected readonly busyLoanId = signal<string | null>(null);
  protected readonly iconForAction = iconForAction;

  constructor() {
    effect(() => {
      this.app.revision();
      this.app.currentDay();
      const locale = this.i18n.locale();
      void this.app.home(locale).then((value) => this.summary.set(value));
    });
  }

  protected money(currency: string, minor: bigint): string {
    return formatMinorUnits(minor, currency, this.i18n.locale());
  }

  protected openCount(summary: HomeSummary): string {
    return String(summary.activeLentCount + summary.activeBorrowedCount);
  }

  protected directionLabel(action: HomeAction): string {
    return this.i18n.t(action.direction === 'lent' ? 'home.youLentIt' : 'home.youBorrowedIt');
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
