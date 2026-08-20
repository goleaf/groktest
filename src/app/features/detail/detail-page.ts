import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { LoanRecord } from '../../data/store';
import { DomainError } from '../../domain/errors';
import { outstandingMinorUnits, repaidMinorUnits } from '../../domain/loan-rules';
import { formatMinorUnits, isCurrencyCode } from '../../domain/money';
import type { LoanEvent } from '../../domain/types';
import { formatCalendarDate, formatLoanTitle } from '../../i18n/format';
import { I18n } from '../../i18n/i18n';
import { Icon } from '../../ui/icon';
import { iconForLoan } from '../../ui/icon-for';
import { DueStatus } from '../../ui/due-status';

@Component({
  selector: 'app-detail-page',
  imports: [DueStatus, FormsModule, RouterLink, Icon],
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
          <a class="button" routerLink="/records">
            <app-icon name="records" />
            {{ i18n.t('detail.backToRecords') }}
          </a>
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
        @if (data.loan.status === 'active' && data.loan.dueOn) {
          <div class="status-panel">
            <app-due-status [dueOn]="data.loan.dueOn" [daysUntilDue]="daysUntilDue()" />
          </div>
        }
        @if (moneyBalance(); as balance) {
          <dl class="money-breakdown" [attr.aria-label]="i18n.t('detail.balanceLabel')">
            <div data-balance="original">
              <dt><app-icon name="money" /> {{ i18n.t('detail.original') }}</dt>
              <dd>{{ balance.original }}</dd>
            </div>
            <div data-balance="repaid">
              <dt><app-icon name="history" /> {{ i18n.t('detail.repaid') }}</dt>
              <dd>{{ balance.repaid }}</dd>
            </div>
            <div data-balance="remaining">
              <dt><app-icon name="clock" /> {{ i18n.t('detail.remainingLabel') }}</dt>
              <dd>{{ balance.remaining }}</dd>
            </div>
          </dl>
        }
        @if (data.loan.status === 'active' && data.loan.assetKind === 'physical_item') {
          <button class="button primary-detail-action" type="button" (click)="markReturned()">
            <app-icon name="check" />
            {{ returnAction() }}
          </button>
        }
        @if (data.loan.status === 'active' && data.loan.assetKind === 'money') {
          <form (ngSubmit)="repay()" class="stack">
            <h2 class="section-heading">
              <app-icon name="money" />
              {{ repayPrompt() }}
            </h2>
            <label>
              <span class="icon-line">
                <app-icon name="money" />
                {{ i18n.t('detail.repayAmount') }}
              </span>
              <input name="repay" inputmode="decimal" [(ngModel)]="repayAmount" />
            </label>
            <button class="button" type="submit">
              <app-icon name="money" />
              {{ repayAction() }}
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
                  ? formatCalendarDate(data.loan.dueOn, i18n.locale())
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
        @if (data.loan.status === 'active') {
          <details class="due-editor">
            <summary>
              <span class="icon-line">
                <app-icon name="calendar" />
                {{ i18n.t('detail.changeDueDate') }}
              </span>
              <app-icon class="disclosure-chevron" name="chevron" />
            </summary>
            <form class="due-date-form" (ngSubmit)="saveDueDate()">
              <label>
                <span class="icon-line">
                  <app-icon name="calendar" />
                  {{ i18n.t('detail.newDueDate') }}
                </span>
                <input
                  type="date"
                  name="dueDate"
                  required
                  [min]="data.loan.occurredOn"
                  [(ngModel)]="dueDateDraft"
                />
              </label>
              <button
                class="button"
                type="submit"
                [disabled]="savingDueDate() || !dueDateDraft || dueDateDraft === data.loan.dueOn"
                [attr.aria-busy]="savingDueDate()"
              >
                <app-icon name="calendar" />
                {{ i18n.t(savingDueDate() ? 'detail.savingDueDate' : 'detail.saveDueDate') }}
              </button>
            </form>
          </details>
        }
        @if (error()) {
          <p class="error icon-line" role="alert">
            <app-icon name="warning" />
            {{ error() }}
          </p>
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
                <span>{{ eventCopy(event) }}</span>
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
  protected readonly record = signal<LoanRecord | null>(null);
  protected readonly missing = signal(false);
  protected readonly error = signal('');
  protected readonly savingDueDate = signal(false);
  protected repayAmount = '';
  protected dueDateDraft = '';
  protected readonly formatCalendarDate = formatCalendarDate;
  protected readonly iconForLoan = iconForLoan;

  protected readonly title = computed(() => {
    const record = this.record();
    return record ? formatLoanTitle(record.loan, this.i18n.locale()) : '';
  });
  protected readonly moneyBalance = computed(() => {
    const record = this.record();
    if (
      !record ||
      record.loan.assetKind !== 'money' ||
      !record.loan.currencyCode ||
      record.loan.originalMinorUnits === null
    ) {
      return null;
    }
    const currency = record.loan.currencyCode;
    const locale = this.i18n.locale();
    return {
      original: formatMinorUnits(record.loan.originalMinorUnits, currency, locale),
      repaid: formatMinorUnits(repaidMinorUnits(record.loan, record.repayments), currency, locale),
      remaining: formatMinorUnits(
        outstandingMinorUnits(record.loan, record.repayments),
        currency,
        locale,
      ),
    };
  });
  protected readonly daysUntilDue = computed(() => {
    const record = this.record();
    return record ? this.app.daysUntilDue(record.loan) : null;
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
  protected readonly returnAction = computed(() =>
    this.i18n.t(
      this.record()?.loan.direction === 'borrowed'
        ? 'detail.returnedBorrowed'
        : 'detail.returnedLent',
    ),
  );
  protected readonly repayPrompt = computed(() =>
    this.i18n.t(
      this.record()?.loan.direction === 'borrowed' ? 'detail.repayBorrowed' : 'detail.repayLent',
    ),
  );
  protected readonly repayAction = computed(() =>
    this.i18n.t(
      this.record()?.loan.direction === 'borrowed'
        ? 'detail.repayActionBorrowed'
        : 'detail.repayActionLent',
    ),
  );

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
        this.dueDateDraft = value?.loan.dueOn ?? '';
      });
    });
  }

  protected back(): void {
    this.location.back();
  }

  protected eventDate(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), { day: 'numeric', month: 'short' }).format(
      new Date(value),
    );
  }

  protected eventCopy(event: LoanEvent): string {
    const params = { ...event.summaryParams };
    const amount = params['amount'];
    const currency = params['currency'];
    if (
      event.type === 'repayment_added' &&
      amount !== undefined &&
      /^\d+$/.test(amount) &&
      currency !== undefined &&
      isCurrencyCode(currency)
    ) {
      params['amount'] = formatMinorUnits(BigInt(amount), currency, this.i18n.locale());
    }
    const date = params['date'];
    if (event.type === 'due_date_changed' && date !== undefined) {
      params['date'] = formatCalendarDate(date, this.i18n.locale());
    }
    return this.i18n.t(event.summaryKey, params);
  }

  protected async saveDueDate(): Promise<void> {
    const id = this.record()?.loan.id;
    if (
      !id ||
      !this.dueDateDraft ||
      this.dueDateDraft === this.record()?.loan.dueOn ||
      this.savingDueDate()
    ) {
      return;
    }
    this.error.set('');
    this.savingDueDate.set(true);
    try {
      await this.app.changeDueDate(id, this.dueDateDraft);
    } catch (caught) {
      this.error.set(
        caught instanceof DomainError
          ? this.i18n.t(`errors.${caught.code}`)
          : this.i18n.t('add.error'),
      );
    } finally {
      this.savingDueDate.set(false);
    }
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
