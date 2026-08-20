import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { Loan, MoneyTotal, Person } from '../../domain/types';
import { formatMinorUnits } from '../../domain/money';
import { localeOf } from '../../i18n/format';
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
          <a class="button" routerLink="/people">{{ i18n.t('person.backToPeople') }}</a>
        </div>
      } @else if (person(); as data) {
        <header class="person-hero">
          <span class="person-avatar person-avatar-large" aria-hidden="true">{{
            data.displayName.charAt(0)
          }}</span>
          <div>
            <p>{{ i18n.t('person.personLabel') }}</p>
            <h1>{{ data.displayName }}</h1>
          </div>
        </header>
        @if (owedToMe().length || iOwe().length) {
          <p class="tally">
            @for (total of owedToMe(); track total.currencyCode) {
              <span>
                <app-icon name="lent" />
                {{ i18n.t('home.owedToYou') }} {{ money(total) }}
              </span>
            }
            @for (total of iOwe(); track total.currencyCode) {
              <span>
                <app-icon name="borrowed" />
                {{ i18n.t('home.youOwe') }} {{ money(total) }}
              </span>
            }
          </p>
        }
        @if (active().length) {
          <h2 class="section-heading">{{ i18n.t('person.active') }}</h2>
          <ul class="loan-list">
            @for (loan of active(); track loan.id) {
              <li><app-loan-row [loan]="loan" [remaining]="remainingOf(loan.id)" /></li>
            }
          </ul>
        }
        @if (history().length) {
          <h2 class="section-heading">{{ i18n.t('history.title') }}</h2>
          <ul class="loan-list">
            @for (loan of history(); track loan.id) {
              <li><app-loan-row [loan]="loan" /></li>
            }
          </ul>
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
  protected readonly active = signal<Loan[]>([]);
  protected readonly history = signal<Loan[]>([]);
  protected readonly owedToMe = signal<MoneyTotal[]>([]);
  protected readonly iOwe = signal<MoneyTotal[]>([]);
  protected readonly remaining = signal<ReadonlyMap<string, string | null>>(new Map());
  protected readonly missing = signal(false);

  constructor() {
    effect(() => {
      this.app.revision();
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        this.missing.set(true);
        return;
      }
      void this.app.personOverview(id).then(async (overview) => {
        this.person.set(overview.person ?? null);
        this.active.set(overview.active);
        this.history.set(overview.history);
        this.owedToMe.set([...overview.owedToMe]);
        this.iOwe.set([...overview.iOwe]);
        this.missing.set(!overview.person);
        this.remaining.set(await this.app.remainingMap(overview.active));
      });
    });
  }

  protected remainingOf(id: string): string | null {
    return this.remaining().get(id) ?? null;
  }

  protected money(total: MoneyTotal): string {
    return formatMinorUnits(total.minorUnits, total.currencyCode, localeOf());
  }
}
