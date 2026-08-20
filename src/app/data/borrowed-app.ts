import { Inject, Injectable, signal } from '@angular/core';
import { instantFrom, todayInTimeZone } from '../domain/calendar-date';
import {
  addRepayment,
  buildPerson,
  createLoan,
  markItemReturned,
  type CreateLoanInput,
  type DomainClock,
} from '../domain/commands';
import { summarizeHome } from '../domain/home-summary';
import {
  isLoanDueSoon,
  isLoanOverdue,
  outstandingMinorUnits,
  urgencyRank,
} from '../domain/loan-rules';
import { requireCurrency } from '../domain/money';
import type { HomeSummary, Loan, LocalSettings, Person, SyncMutation } from '../domain/types';
import { CLOCK } from './clock';
import { DexieBorrowedStore } from './dexie-store';
import { BorrowedStore } from './store';

export interface CreateRecordInput {
  direction: CreateLoanInput['direction'];
  kind: CreateLoanInput['kind'];
  personName: string;
  personId?: string;
  itemName?: string;
  quantity?: number;
  amount?: string;
  currency?: string;
  dueOn?: string | null;
  note?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BorrowedApp {
  readonly revision = signal(0);

  constructor(
    private readonly store: BorrowedStore,
    @Inject(CLOCK) private readonly clock: DomainClock,
  ) {}

  private touch(): void {
    this.revision.update((value) => value + 1);
  }

  async initialize(): Promise<LocalSettings> {
    return this.store.initialize(this.clock);
  }

  async settings(): Promise<LocalSettings> {
    return this.store.getSettings();
  }

  async setPreferredCurrency(currency: string): Promise<LocalSettings> {
    const code = requireCurrency(currency);
    const current = await this.store.getSettings();
    const next: LocalSettings = {
      ...current,
      preferredCurrency: code,
      updatedAt: instantFrom(this.clock.now()),
    };
    await this.store.saveSettings(next);
    this.touch();
    return next;
  }

  async people(): Promise<Person[]> {
    const list = await this.store.listPeople();
    const loans = await this.store.listLoans();
    const recent = new Map<string, string>();
    for (const loan of loans) {
      const previous = recent.get(loan.personId);
      if (!previous || loan.updatedAt > previous) {
        recent.set(loan.personId, loan.updatedAt);
      }
    }
    return [...list].sort((left, right) =>
      (recent.get(right.id) ?? '').localeCompare(recent.get(left.id) ?? ''),
    );
  }

  async createRecord(input: CreateRecordInput): Promise<Loan> {
    let person: Person | undefined;
    if (input.personId) {
      person = await this.store.findPersonById(input.personId);
    }
    if (!person) {
      person = await this.store.findPersonByName(input.personName);
    }
    if (!person) {
      person = buildPerson(input.personName, this.clock);
    }
    const settings = await this.store.getSettings();
    const { loan, event } = createLoan(
      {
        direction: input.direction,
        kind: input.kind,
        personId: person.id,
        personName: person.displayName,
        itemName: input.itemName,
        quantity: input.quantity,
        amount: input.amount,
        currency: input.currency ?? settings.preferredCurrency,
        dueOn: input.dueOn,
        note: input.note,
      },
      this.clock,
    );
    await this.store.putLoanBundle({ person, loan, event, clock: this.clock });
    this.touch();
    return loan;
  }

  async activeLoans(direction: 'lent' | 'borrowed'): Promise<Loan[]> {
    const today = todayInTimeZone(this.clock.now(), this.clock.timeZone());
    const loans = (await this.store.listLoans()).filter(
      (loan) => loan.status === 'active' && loan.direction === direction,
    );
    return loans.sort((left, right) => urgencyRank(left, today) - urgencyRank(right, today));
  }

  async history(): Promise<Loan[]> {
    const loans = (await this.store.listLoans()).filter((loan) => loan.status === 'completed');
    return loans.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async home(): Promise<HomeSummary> {
    const loans = await this.store.listLoans();
    const repaymentsByLoan = new Map<
      string,
      Awaited<ReturnType<BorrowedStore['listRepayments']>>
    >();
    for (const loan of loans) {
      if (loan.assetKind === 'money') {
        repaymentsByLoan.set(loan.id, await this.store.listRepayments(loan.id));
      }
    }
    const locale = typeof navigator === 'undefined' ? 'en' : navigator.language;
    return summarizeHome(
      loans,
      repaymentsByLoan,
      todayInTimeZone(this.clock.now(), this.clock.timeZone()),
      locale,
    );
  }

  async loanDetail(id: string) {
    return this.store.loadLoanRecord(id);
  }

  async remainingFor(loan: Loan): Promise<bigint | null> {
    if (loan.assetKind !== 'money') {
      return null;
    }
    return outstandingMinorUnits(loan, await this.store.listRepayments(loan.id));
  }

  async markReturned(loanId: string): Promise<Loan> {
    const record = await this.store.loadLoanRecord(loanId);
    if (!record) {
      throw new Error('loan_missing');
    }
    const result = markItemReturned(record.loan, this.clock);
    await this.store.putLoanBundle({
      person: record.person,
      loan: result.loan,
      event: result.event,
      clock: this.clock,
    });
    this.touch();
    return result.loan;
  }

  async repay(loanId: string, amount: string, currency?: string): Promise<Loan> {
    const record = await this.store.loadLoanRecord(loanId);
    if (!record) {
      throw new Error('loan_missing');
    }
    const result = addRepayment(
      record.loan,
      record.repayments,
      { amount, currency: currency ?? record.loan.currencyCode ?? 'EUR' },
      this.clock,
    );
    await this.store.putLoanBundle({
      person: record.person,
      loan: result.loan,
      event: result.event,
      extra: { repayment: result.repayment },
      clock: this.clock,
    });
    this.touch();
    return result.loan;
  }

  async pendingMutations(): Promise<SyncMutation[]> {
    return this.store.listPendingMutations();
  }

  isOverdue(loan: Loan): boolean {
    return isLoanOverdue(loan, todayInTimeZone(this.clock.now(), this.clock.timeZone()));
  }

  isDueSoon(loan: Loan): boolean {
    return isLoanDueSoon(loan, todayInTimeZone(this.clock.now(), this.clock.timeZone()));
  }

  async peopleWithCounts(): Promise<{ person: Person; activeCount: number }[]> {
    const people = await this.people();
    const loans = await this.store.listLoans();
    return people.map((person) => ({
      person,
      activeCount: loans.filter((loan) => loan.personId === person.id && loan.status === 'active')
        .length,
    }));
  }

  async loansForPerson(personId: string): Promise<Loan[]> {
    return (await this.store.listLoans()).filter((loan) => loan.personId === personId);
  }
}

export function provideBorrowedPersistence() {
  return [
    { provide: BorrowedStore, useFactory: () => new DexieBorrowedStore('borrowed') },
    BorrowedApp,
  ];
}
