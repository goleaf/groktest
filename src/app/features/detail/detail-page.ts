import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { LoanRecord } from '../../data/store';
import { DomainError } from '../../domain/errors';
import { formatCalendarDate, formatLoanTitle, formatRemaining, localeOf } from '../../i18n/format';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';
import { iconForLoan } from '../../ui/icon-for';

@Component({
  selector: 'app-detail-page',
  imports: [FormsModule, RouterLink, Icon],
  template: `
    <section class="page detail-page">
      <button type="button" class="back" (click)="back()">
        <app-icon name="back" /> {{ i18n.t('nav.back') }}
      </button>
      @if (missing()) {
        <div class="missing-state">
          <app-icon name="info" />
          <h1>{{ i18n.t('detail.missingTitle') }}</h1>
          <p>{{ i18n.t('detail.missing') }}</p>
          <a class="button" routerLink="/records">{{ i18n.t('detail.backToRecords') }}</a>
        </div>
      } @else if (record(); as data) {
        <header class="detail-hero">
          <div class="detail-identity">
            <span class="detail-icon" aria-hidden="true">
              <app-icon [name]="iconForLoan(data.loan)" />
            </span>
            <div>
              <p class="record-label">{{ i18n.t('detail.recordLabel') }}</p>
              <h1>{{ title() }}</h1>
              <p class="detail-context">{{ directionCopy() }}</p>
            </div>
          </div>
          <a class="person-link" [routerLink]="['/people', data.person.id]">
            <span class="person-avatar" aria-hidden="true">{{
              data.person.displayName.charAt(0)
            }}</span>
            <span>{{ data.person.displayName }}</span>
            <app-icon name="chevron" />
          </a>
        </header>
        <div class="status-panel">
          @if (overdue()) {
            <p class="status-line overdue-line">
              <app-icon name="overdue" />
              <strong>{{ i18n.t('detail.overdue') }}</strong>
            </p>
          }
          @if (remaining()) {
            <p class="remaining icon-line">
              <app-icon name="money" />
              {{ i18n.t('detail.remaining', { amount: remaining()! }) }}
            </p>
          }
        </div>
        @if (data.loan.status === 'active' && data.loan.assetKind === 'physical_item') {
          <button class="button primary-detail-action" type="button" (click)="markReturned()">
            <app-icon name="check" />
            {{ i18n.t('detail.returned') }}
          </button>
        }
        @if (data.loan.status === 'active' && data.loan.assetKind === 'money') {
          <form (ngSubmit)="repay()" class="stack">
            <h2>{{ i18n.t('detail.repay') }}</h2>
            <label>
              {{ i18n.t('detail.repayAmount') }}
              <input name="repay" inputmode="decimal" [(ngModel)]="repayAmount" />
            </label>
            <button class="button" type="submit">
              <app-icon name="money" />
              {{ i18n.t('detail.repayAction') }}
            </button>
          </form>
        }
        <section class="detail-summary" [attr.aria-label]="i18n.t('detail.details')">
          <div class="detail-row">
            <span class="icon-line"
              ><app-icon name="calendar" /> {{ i18n.t('detail.dueDate') }}</span
            >
            <strong>
              {{
                data.loan.dueOn
                  ? formatCalendarDate(data.loan.dueOn, locale)
                  : i18n.t('detail.noDue')
              }}
            </strong>
          </div>
          @if (data.loan.note) {
            <div class="detail-row">
              <span class="icon-line"><app-icon name="note" /> {{ i18n.t('detail.note') }}</span>
              <strong>{{ data.loan.note }}</strong>
            </div>
          }
        </section>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <section class="section-block">
          <h2 class="section-heading">
            <app-icon name="history" /> {{ i18n.t('detail.historyHeading') }}
          </h2>
          <ol class="timeline">
            @for (event of data.events; track event.id) {
              <li>
                <time [attr.datetime]="event.occurredAt">{{ eventDate(event.occurredAt) }}</time>
                <span class="timeline-marker" aria-hidden="true"></span>
                <span>{{ i18n.t(event.summaryKey, event.summaryParams) }}</span>
              </li>
            }
          </ol>
        </section>
      }
    </section>
  `,
})
export class DetailPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  protected readonly locale = localeOf();
  protected readonly record = signal<LoanRecord | null>(null);
  protected readonly missing = signal(false);
  protected readonly error = signal('');
  protected repayAmount = '';
  protected readonly formatCalendarDate = formatCalendarDate;
  protected readonly iconForLoan = iconForLoan;

  protected readonly title = computed(() => {
    const record = this.record();
    return record ? formatLoanTitle(record.loan, this.locale) : '';
  });
  protected readonly remaining = computed(() => {
    const record = this.record();
    return record ? formatRemaining(record.loan, record.repayments, this.locale) : null;
  });
  protected readonly overdue = computed(() => {
    const record = this.record();
    return record ? this.app.isOverdue(record.loan) : false;
  });
  protected readonly directionCopy = computed(() => {
    const loan = this.record()?.loan;
    if (!loan) {
      return '';
    }
    if (loan.assetKind === 'physical_item') {
      return loan.direction === 'lent'
        ? this.i18n.t('detail.lentItemWithPerson', { person: loan.personNameSnapshot })
        : this.i18n.t('detail.borrowedItemWithPerson', { person: loan.personNameSnapshot });
    }
    return loan.direction === 'lent'
      ? this.i18n.t('detail.lentMoneyWithPerson', { person: loan.personNameSnapshot })
      : this.i18n.t('detail.borrowedMoneyWithPerson', { person: loan.personNameSnapshot });
  });

  constructor() {
    effect(() => {
      this.app.revision();
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        this.missing.set(true);
        return;
      }
      void this.app.loanDetail(id).then((value) => {
        this.record.set(value ?? null);
        this.missing.set(!value);
      });
    });
  }

  protected back(): void {
    this.location.back();
  }

  protected eventDate(value: string): string {
    return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short' }).format(
      new Date(value),
    );
  }

  protected async markReturned(): Promise<void> {
    const id = this.record()?.loan.id;
    if (!id) {
      return;
    }
    this.error.set('');
    try {
      await this.app.markReturned(id);
    } catch (caught) {
      this.error.set(
        caught instanceof DomainError
          ? this.i18n.t(`errors.${caught.code}`)
          : this.i18n.t('add.error'),
      );
    }
  }

  protected async repay(): Promise<void> {
    const id = this.record()?.loan.id;
    if (!id) {
      return;
    }
    this.error.set('');
    try {
      await this.app.repay(id, this.repayAmount);
      this.repayAmount = '';
    } catch (caught) {
      this.error.set(
        caught instanceof DomainError
          ? this.i18n.t(`errors.${caught.code}`)
          : this.i18n.t('add.error'),
      );
    }
  }
}
