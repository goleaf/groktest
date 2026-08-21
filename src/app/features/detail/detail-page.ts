import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
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
import { HandoffLine } from '../../ui/handoff-line';

@Component({
  selector: 'app-detail-page',
  imports: [DueStatus, FormField, HandoffLine, RouterLink, Icon],
  template: `
    <section class="page detail-page">
      <button type="button" class="back" (click)="back()">
        <app-icon name="back" /> {{ i18n.t('nav.back') }}
      </button>
      @if (loadError(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      } @else if (missing()) {
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
              <app-handoff-line
                [direction]="data.loan.direction"
                [personName]="data.loan.personNameSnapshot"
              />
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
        <div class="detail-workspace">
          <div class="detail-main">
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
                  <span class="icon-line"
                    ><app-icon name="note" /> {{ i18n.t('detail.note') }}</span
                  >
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
                <form class="due-date-form" (submit)="saveDueDate($event)" novalidate>
                  <label>
                    <span class="icon-line">
                      <app-icon name="calendar" />
                      {{ i18n.t('detail.newDueDate') }}
                    </span>
                    <input
                      type="date"
                      [min]="data.loan.occurredOn"
                      [formField]="dueDateForm.dueOn"
                      [attr.aria-invalid]="
                        dueDateForm.dueOn().touched() && dueDateForm.dueOn().invalid()
                      "
                      [attr.aria-describedby]="
                        dueDateForm.dueOn().touched() && dueDateForm.dueOn().invalid()
                          ? 'due-date-error'
                          : null
                      "
                    />
                  </label>
                  @if (dueDateForm.dueOn().touched() && dueDateForm.dueOn().invalid()) {
                    <small class="field-error" id="due-date-error">{{
                      dueDateForm.dueOn().errors()[0]?.message
                    }}</small>
                  }
                  <button
                    class="button"
                    type="submit"
                    [disabled]="savingDueDate()"
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
            <p class="sr-only" role="status" aria-live="polite">{{ actionStatus() }}</p>
            <section class="section-block">
              <h2 class="section-heading">
                <app-icon name="history" /> {{ i18n.t('detail.historyHeading') }}
              </h2>
              <ol class="timeline">
                @for (event of data.events; track event.id) {
                  <li>
                    <time [attr.datetime]="event.occurredAt">{{
                      eventDate(event.occurredAt)
                    }}</time>
                    <span class="timeline-marker" aria-hidden="true"></span>
                    <span>{{ eventCopy(event) }}</span>
                  </li>
                }
              </ol>
            </section>
          </div>
          <aside class="detail-action-rail" [attr.aria-label]="i18n.t('detail.nextStep')">
            <p class="section-kicker">{{ i18n.t('detail.actionsKicker') }}</p>
            <h2>{{ i18n.t('detail.nextStep') }}</h2>
            @if (data.loan.status === 'active' && data.loan.assetKind === 'physical_item') {
              <button
                class="button primary-detail-action"
                type="button"
                [disabled]="savingReturned()"
                [attr.aria-busy]="savingReturned()"
                (click)="markReturned()"
              >
                <app-icon name="check" />
                {{
                  savingReturned()
                    ? i18n.t('detail.savingReturned', { action: returnAction() })
                    : returnAction()
                }}
              </button>
            }
            @if (data.loan.status === 'active' && data.loan.assetKind === 'money') {
              <form (submit)="repay($event)" class="stack repayment-form" novalidate>
                <h3 class="section-heading">
                  <app-icon name="money" />
                  {{ repayPrompt() }}
                </h3>
                <label>
                  <span class="icon-line">
                    <app-icon name="money" />
                    {{ i18n.t('detail.repayAmount') }}
                  </span>
                  <input
                    inputmode="decimal"
                    [formField]="repaymentForm.amount"
                    [attr.aria-invalid]="
                      repaymentForm.amount().touched() && repaymentForm.amount().invalid()
                    "
                    [attr.aria-describedby]="
                      repaymentForm.amount().touched() && repaymentForm.amount().invalid()
                        ? 'repayment-error'
                        : null
                    "
                  />
                </label>
                @if (repaymentForm.amount().touched() && repaymentForm.amount().invalid()) {
                  <small class="field-error" id="repayment-error">{{
                    repaymentForm.amount().errors()[0]?.message
                  }}</small>
                }
                <button class="button" type="submit" [disabled]="savingRepayment()">
                  <app-icon name="money" />
                  {{ repayAction() }}
                </button>
              </form>
            }
            @if (data.loan.status !== 'active') {
              <p class="detail-completed">
                <app-icon name="check" /> {{ i18n.t('loan.statusCompleted') }}
              </p>
            }
            <p class="detail-local-note">
              <app-icon name="info" /> {{ i18n.t('detail.localHint') }}
            </p>
          </aside>
        </div>
      }
    </section>
  `,
})
export class DetailPage {
  protected readonly i18n = inject(I18n);
  private readonly app = inject(BorrowedApp);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly routeParamMap = toSignal(
    this.route.paramMap || of(this.route.snapshot.paramMap),
    { initialValue: this.route.snapshot.paramMap },
  );
  private readonly recordResource = resource({
    params: () => ({
      id: this.routeParamMap().get('id'),
      revision: this.app.revision(),
    }),
    loader: ({ params }) =>
      params.id ? this.app.loanDetail(params.id) : Promise.resolve(undefined),
  });
  protected readonly record = computed<LoanRecord | null>(() =>
    this.recordResource.hasValue() ? (this.recordResource.value() ?? null) : null,
  );
  protected readonly missing = computed(
    () =>
      !this.routeParamMap().get('id') ||
      (this.recordResource.status() === 'resolved' && this.recordResource.value() === undefined),
  );
  protected readonly loadError = computed(() =>
    this.recordResource.error() ? this.i18n.t('detail.loadError') : '',
  );
  protected readonly error = signal('');
  protected readonly actionStatus = signal('');
  protected readonly savingDueDate = signal(false);
  protected readonly savingRepayment = signal(false);
  protected readonly savingReturned = signal(false);
  private readonly dueDateModel = signal({ dueOn: '' });
  protected readonly dueDateForm = form(this.dueDateModel, (dueDate) => {
    required(dueDate.dueOn, { message: this.i18n.t('detail.dueDateRequired') });
    validate(dueDate.dueOn, ({ value }) => {
      const next = value();
      const current = this.record()?.loan;
      if (!next || !current) {
        return undefined;
      }
      if (next < current.occurredOn) {
        return { kind: 'date-before-record', message: this.i18n.t('detail.dueDateTooEarly') };
      }
      return next === current.dueOn
        ? { kind: 'date-unchanged', message: this.i18n.t('detail.dueDateUnchanged') }
        : undefined;
    });
  });
  private readonly repaymentModel = signal({ amount: '' });
  protected readonly repaymentForm = form(this.repaymentModel, (repayment) => {
    required(repayment.amount, { message: this.i18n.t('detail.repayAmountRequired') });
  });
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
      this.dueDateModel.set({ dueOn: this.record()?.loan.dueOn ?? '' });
      this.repaymentModel.set({ amount: '' });
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

  protected async saveDueDate(event?: Event): Promise<void> {
    event?.preventDefault();
    const id = this.record()?.loan.id;
    if (!id || this.savingDueDate()) {
      return;
    }
    this.error.set('');
    try {
      await submit(this.dueDateForm, {
        action: async (field) => {
          this.savingDueDate.set(true);
          try {
            const changed = await this.app.changeDueDate(id, field().value().dueOn);
            this.dueDateForm().reset({ dueOn: changed.dueOn ?? '' });
            return undefined;
          } finally {
            this.savingDueDate.set(false);
          }
        },
        onInvalid: () => this.dueDateForm.dueOn().focusBoundControl(),
      });
    } catch (caught) {
      this.error.set(
        caught instanceof DomainError
          ? this.i18n.t(`errors.${caught.code}`)
          : this.i18n.t('add.error'),
      );
    }
  }

  protected async markReturned(): Promise<void> {
    const loan = this.record()?.loan;
    if (!loan || this.savingReturned()) {
      return;
    }
    this.error.set('');
    this.actionStatus.set('');
    this.savingReturned.set(true);
    try {
      await this.app.markReturned(loan.id);
      this.actionStatus.set(
        this.i18n.t('detail.returnedStatus', {
          subject: formatLoanTitle(loan, this.i18n.locale()),
        }),
      );
    } catch (caught) {
      this.error.set(
        caught instanceof DomainError
          ? this.i18n.t(`errors.${caught.code}`)
          : this.i18n.t('detail.actionError'),
      );
    } finally {
      this.savingReturned.set(false);
    }
  }

  protected async repay(event?: Event): Promise<void> {
    event?.preventDefault();
    const id = this.record()?.loan.id;
    if (!id || this.savingRepayment()) {
      return;
    }
    this.error.set('');
    try {
      await submit(this.repaymentForm, {
        action: async (field) => {
          this.savingRepayment.set(true);
          try {
            await this.app.repay(id, field().value().amount);
            this.repaymentForm().reset({ amount: '' });
            return undefined;
          } finally {
            this.savingRepayment.set(false);
          }
        },
        onInvalid: () => this.repaymentForm.amount().focusBoundControl(),
      });
    } catch (caught) {
      this.error.set(
        caught instanceof DomainError
          ? this.i18n.t(`errors.${caught.code}`)
          : this.i18n.t('add.error'),
      );
    }
  }
}
