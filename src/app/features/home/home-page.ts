import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { HomeSummary } from '../../domain/types';
import { formatMinorUnits } from '../../domain/money';
import { localeOf } from '../../i18n/format';
import { I18n } from '../../i18n/i18n';
import { EmptyState } from '../../ui/empty-state';

@Component({
  selector: 'app-home-page',
  imports: [EmptyState, RouterLink],
  template: `
    <section class="page">
      <h1>{{ i18n.t('home.title') }}</h1>
      @if (summary(); as data) {
        @if (data.activeLentCount === 0 && data.activeBorrowedCount === 0) {
          <p class="lede">{{ i18n.t('app.tagline') }}</p>
          <app-empty-state
            [message]="i18n.t('home.empty')"
            [actionLabel]="i18n.t('home.emptyAction')"
          />
        } @else {
          <ul class="counts" aria-label="Summary">
            <li>{{ i18n.t('home.lentCount', { count: data.activeLentCount }) }}</li>
            <li>{{ i18n.t('home.borrowedCount', { count: data.activeBorrowedCount }) }}</li>
            @if (data.overdueCount) {
              <li>{{ i18n.t('home.overdue', { count: data.overdueCount }) }}</li>
            }
            @if (data.dueSoonCount) {
              <li>{{ i18n.t('home.dueSoon', { count: data.dueSoonCount }) }}</li>
            }
          </ul>
          @if (data.moneyOwedToMe.length) {
            <h2>{{ i18n.t('home.owedToYou') }}</h2>
            <ul>
              @for (total of data.moneyOwedToMe; track total.currencyCode) {
                <li>{{ money(total.currencyCode, total.minorUnits) }}</li>
              }
            </ul>
          }
          @if (data.moneyIOwe.length) {
            <h2>{{ i18n.t('home.youOwe') }}</h2>
            <ul>
              @for (total of data.moneyIOwe; track total.currencyCode) {
                <li>{{ money(total.currencyCode, total.minorUnits) }}</li>
              }
            </ul>
          }
          <ul class="actions">
            @for (action of data.actions; track action.loanId) {
              <li>
                <a [routerLink]="['/loans', action.loanId]">{{
                  i18n.t(action.messageKey, action.params)
                }}</a>
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
})
export class HomePage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  protected readonly summary = signal<HomeSummary | null>(null);

  constructor() {
    effect(() => {
      this.app.revision();
      void this.app.home().then((value) => this.summary.set(value));
    });
  }

  protected money(currency: string, minor: bigint): string {
    return formatMinorUnits(minor, currency, localeOf());
  }
}
