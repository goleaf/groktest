import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BorrowedApp } from '../../data/borrowed-app';
import type { LoanRecord } from '../../data/store';
import { DomainError } from '../../domain/errors';
import { formatCalendarDate, formatLoanTitle, formatRemaining, localeOf } from '../../i18n/format';
import { I18n } from '../../i18n/i18n';

@Component({
  selector: 'app-detail-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <button type="button" class="back" (click)="back()">{{ i18n.t('nav.back') }}</button>
      @if (missing()) {
        <p>{{ i18n.t('detail.missing') }}</p>
      } @else if (record(); as data) {
        <p class="dir">{{ directionCopy() }}</p>
        <h1>{{ title() }}</h1>
        <p>
          <a [routerLink]="['/people', data.person.id]">{{ data.person.displayName }}</a>
        </p>
        @if (overdue()) {
          <p class="pill">{{ i18n.t('detail.overdue') }}</p>
        }
        @if (remaining()) {
          <p>{{ i18n.t('detail.remaining', { amount: remaining()! }) }}</p>
        }
        <p>
          {{
            data.loan.dueOn
              ? i18n.t('detail.dueOn', { date: formatCalendarDate(data.loan.dueOn, locale) })
              : i18n.t('detail.noDue')
          }}
        </p>
        @if (data.loan.note) {
          <p>{{ data.loan.note }}</p>
        }
        @if (data.loan.status === 'active' && data.loan.assetKind === 'physical_item') {
          <button class="button" type="button" (click)="markReturned()">
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
            <button class="button" type="submit">{{ i18n.t('detail.repayAction') }}</button>
          </form>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <h2>{{ i18n.t('detail.historyHeading') }}</h2>
        <ol class="timeline">
          @for (event of data.events; track event.id) {
            <li>{{ i18n.t(event.summaryKey, event.summaryParams) }}</li>
          }
        </ol>
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
        ? this.i18n.t('detail.lentItem')
        : this.i18n.t('detail.borrowedItem');
    }
    return loan.direction === 'lent'
      ? this.i18n.t('detail.lentMoney')
      : this.i18n.t('detail.borrowedMoney');
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
