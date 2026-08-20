import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan, MoneyTotal, Person } from '../../domain/types';
import { formatMinorUnits } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';
import { LoanRow } from '../../ui/loan-row';

@Component({
  selector: 'app-person-page',
  imports: [LoanRow, RouterLink, Icon],
  template: `
    <section class="page">
      <a routerLink="/people" class="back"><app-icon name="back" /> {{ i18n.t('nav.back') }}</a>
      @if (missing()) {
        <div class="missing-state">
          <app-icon name="info" />
          <h1>{{ i18n.t('person.missingTitle') }}</h1>
          <p>{{ i18n.t('person.missing') }}</p>
          <a class="button" routerLink="/people">
            <app-icon name="people" />
            {{ i18n.t('person.backToPeople') }}
          </a>
        </div>
      } @else if (loading()) {
        <p class="loading-row icon-line" role="status">
          <app-icon name="clock" />
          {{ i18n.t('person.loading') }}
        </p>
      } @else if (person(); as data) {
        <header class="person-hero">
          <span class="person-avatar person-avatar-large" aria-hidden="true">{{
            data.displayName.charAt(0)
          }}</span>
          <div class="person-hero__identity">
            <p class="icon-line">
              <app-icon name="people" />
              {{ i18n.t('person.personLabel') }}
            </p>
            <h1>{{ data.displayName }}</h1>
            <p class="person-private-note">{{ i18n.t('person.privateLocal') }}</p>
          </div>
          <a class="button person-add" routerLink="/add" [queryParams]="{ personId: data.id }">
            <app-icon name="add" />
            {{ i18n.t('person.addRecord', { person: data.displayName }) }}
          </a>
        </header>
        <section class="person-relationship" aria-labelledby="relationship-heading">
          <h2 id="relationship-heading" class="section-heading">
            <app-icon name="records" />
            {{ i18n.t('person.relationship') }}
          </h2>
          <ul class="relationship-summary">
            <li data-summary="mine-with-them">
              <span class="relationship-icon"><app-icon name="lent" /></span>
              <span>{{ i18n.t('person.mineWithThem', { person: data.displayName }) }}</span>
              <strong>{{ i18n.t('person.items', { count: lentItemCount() }) }}</strong>
            </li>
            <li data-summary="theirs-with-me">
              <span class="relationship-icon"><app-icon name="borrowed" /></span>
              <span>{{ i18n.t('person.theirsWithMe', { person: data.displayName }) }}</span>
              <strong>{{ i18n.t('person.items', { count: borrowedItemCount() }) }}</strong>
            </li>
            <li data-summary="they-owe-me">
              <span class="relationship-icon"><app-icon name="money" /></span>
              <span>{{ i18n.t('person.theyOweMe', { person: data.displayName }) }}</span>
              <strong>{{ moneyTotals(owedToMe()) }}</strong>
            </li>
            <li data-summary="i-owe-them">
              <span class="relationship-icon"><app-icon name="money" /></span>
              <span>{{ i18n.t('person.iOweThem', { person: data.displayName }) }}</span>
              <strong>{{ moneyTotals(iOwe()) }}</strong>
            </li>
          </ul>
        </section>
        @if (activeLent().length) {
          <section class="person-section person-active-lent">
            <h2 class="section-heading">
              <app-icon name="lent" />
              {{ i18n.t('person.withPerson', { person: data.displayName }) }}
            </h2>
            <ul class="loan-list">
              @for (loan of activeLent(); track loan.id) {
                <li><app-loan-row [loan]="loan" [remaining]="remainingOf(loan.id)" /></li>
              }
            </ul>
          </section>
        }
        @if (activeBorrowed().length) {
          <section class="person-section person-active-borrowed">
            <h2 class="section-heading">
              <app-icon name="borrowed" />
              {{ i18n.t('person.fromPerson', { person: data.displayName }) }}
            </h2>
            <ul class="loan-list">
              @for (loan of activeBorrowed(); track loan.id) {
                <li><app-loan-row [loan]="loan" [remaining]="remainingOf(loan.id)" /></li>
              }
            </ul>
          </section>
        }
        @if (!activeLent().length && !activeBorrowed().length) {
          <p class="person-no-active icon-line">
            <app-icon name="check" />
            {{ i18n.t('person.noActive', { person: data.displayName }) }}
          </p>
        }
        @if (history().length) {
          <section class="person-section person-history">
            <h2 class="section-heading">
              <app-icon name="history" />
              {{ i18n.t('history.title') }}
            </h2>
            <ul class="loan-list">
              @for (loan of history(); track loan.id) {
                <li><app-loan-row [loan]="loan" /></li>
              }
            </ul>
          </section>
        }
      }
    </section>
  `,
})
export class PersonPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly route = inject(ActivatedRoute);
  protected readonly person = signal<Person | null>(null);
  protected readonly activeLent = signal<readonly Loan[]>([]);
  protected readonly activeBorrowed = signal<readonly Loan[]>([]);
  protected readonly history = signal<Loan[]>([]);
  protected readonly lentItemCount = signal(0);
  protected readonly borrowedItemCount = signal(0);
  protected readonly owedToMe = signal<MoneyTotal[]>([]);
  protected readonly iOwe = signal<MoneyTotal[]>([]);
  protected readonly remaining = signal<ReadonlyMap<string, string | null>>(new Map());
  protected readonly missing = signal(false);
  protected readonly loading = signal(true);

  constructor() {
    effect(() => {
      this.app.revision();
      const id = this.route.snapshot.paramMap.get('id');
      const locale = this.i18n.locale();
      if (!id) {
        this.missing.set(true);
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      void this.app.personOverview(id, locale).then((overview) => {
        this.person.set(overview.person ?? null);
        this.activeLent.set(overview.activeLent);
        this.activeBorrowed.set(overview.activeBorrowed);
        this.history.set(overview.history);
        this.lentItemCount.set(overview.lentItemCount);
        this.borrowedItemCount.set(overview.borrowedItemCount);
        this.owedToMe.set([...overview.owedToMe]);
        this.iOwe.set([...overview.iOwe]);
        this.missing.set(!overview.person);
        this.remaining.set(overview.remainingByLoan);
        this.loading.set(false);
      });
    });
  }

  protected remainingOf(id: string): string | null {
    return this.remaining().get(id) ?? null;
  }

  protected money(total: MoneyTotal): string {
    return formatMinorUnits(total.minorUnits, total.currencyCode, this.i18n.locale());
  }

  protected moneyTotals(totals: readonly MoneyTotal[]): string {
    return totals.length
      ? totals.map((total) => this.money(total)).join(' · ')
      : this.i18n.t('person.none');
  }
}
