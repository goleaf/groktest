import { Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { BorrowedApp, type PersonOverview } from '../../data/borrowed-app';
import type { Loan, MoneyTotal, Person } from '../../domain/types';
import { formatMinorUnits } from '../../domain/money';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';
import { LoanRow } from '../../ui/loan-row';

@Component({
  selector: 'app-person-page',
  imports: [LoanRow, RouterLink, Icon],
  template: `
    <section class="page" [attr.aria-busy]="loading() ? 'true' : null">
      <a routerLink="/people" class="back"><app-icon name="back" /> {{ i18n.t('nav.back') }}</a>
      @if (loadError(); as message) {
        <div class="stack person-load-error">
          <p class="error icon-line" role="alert"><app-icon name="warning" /> {{ message }}</p>
          <button class="button" type="button" (click)="retry()">
            {{ i18n.t('person.retry') }}
          </button>
        </div>
      } @else if (missing()) {
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
                <li>
                  <app-loan-row [loan]="loan" [remainingMinorUnits]="remainingOf(loan.id)" />
                </li>
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
                <li>
                  <app-loan-row [loan]="loan" [remainingMinorUnits]="remainingOf(loan.id)" />
                </li>
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
  private readonly routeParamMap = toSignal(
    this.route.paramMap || of(this.route.snapshot.paramMap),
    { initialValue: this.route.snapshot.paramMap },
  );
  private readonly personResource = resource({
    params: () => {
      const id = this.routeParamMap().get('id');
      return id ? { id, revision: this.app.revision() } : undefined;
    },
    loader: ({ params }) => this.app.personOverview(params.id),
  });
  private readonly overview = computed<PersonOverview | null>(() =>
    this.personResource.hasValue() ? this.personResource.value() : null,
  );
  protected readonly person = computed<Person | null>(() => this.overview()?.person ?? null);
  protected readonly activeLent = computed<readonly Loan[]>(
    () => this.overview()?.activeLent ?? [],
  );
  protected readonly activeBorrowed = computed<readonly Loan[]>(
    () => this.overview()?.activeBorrowed ?? [],
  );
  protected readonly history = computed<readonly Loan[]>(() => this.overview()?.history ?? []);
  protected readonly lentItemCount = computed(() => this.overview()?.lentItemCount ?? 0);
  protected readonly borrowedItemCount = computed(() => this.overview()?.borrowedItemCount ?? 0);
  protected readonly owedToMe = computed<readonly MoneyTotal[]>(
    () => this.overview()?.owedToMe ?? [],
  );
  protected readonly iOwe = computed<readonly MoneyTotal[]>(() => this.overview()?.iOwe ?? []);
  protected readonly remaining = computed<ReadonlyMap<string, bigint | null>>(() => {
    const data = this.overview();
    const balances = new Map<string, bigint | null>();
    if (!data) {
      return balances;
    }
    for (const loan of [...data.activeLent, ...data.activeBorrowed]) {
      const minorUnits = data.remainingMinorUnitsByLoan.get(loan.id);
      balances.set(
        loan.id,
        minorUnits === undefined || minorUnits === loan.originalMinorUnits ? null : minorUnits,
      );
    }
    return balances;
  });
  protected readonly missing = computed(
    () =>
      !this.routeParamMap().get('id') ||
      (this.personResource.status() === 'resolved' && this.person() === null),
  );
  protected readonly loading = this.personResource.isLoading;
  protected readonly loadError = computed(() =>
    this.personResource.error() ? this.i18n.t('person.loadError') : '',
  );

  protected remainingOf(id: string): bigint | null {
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

  protected retry(): void {
    this.personResource.reload();
  }
}
