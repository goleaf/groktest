import { Inject, Injectable, signal } from '@angular/core';
import {
  calendarDaysBetween,
  instantFrom,
  todayInTimeZone,
  type CalendarDate,
} from '../domain/calendar-date';
import {
  addRepayment,
  buildPerson,
  changeLoanDueDate,
  createLoan,
  markItemReturned,
  type CreateLoanInput,
  type DomainClock,
} from '../domain/commands';
import { summarizeHome } from '../domain/home-summary';
import { DomainError } from '../domain/errors';
import { compareLoansByAttention, outstandingMinorUnits } from '../domain/loan-rules';
import { requireCurrency } from '../domain/money';
import {
  summarizePersonRelationships,
  type PersonRelationshipSummary,
} from '../domain/person-summary';
import type { ListFilter } from '../domain/query';
import { visibleLoans } from '../domain/query';
import type {
  HomeSummary,
  Loan,
  LocalSettings,
  Person,
  RecordDraft,
  Repayment,
  SyncMutation,
  SupportedLanguage,
} from '../domain/types';
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
  occurredOn?: string;
  dueOn?: string | null;
  note?: string | null;
}

export interface PersonListRow {
  readonly person: Person;
  readonly activeCount: number;
  readonly lentActiveCount: number;
  readonly borrowedActiveCount: number;
  readonly historyCount: number;
}

export interface PersonOverview extends PersonRelationshipSummary {
  readonly person: Person | undefined;
}

@Injectable({ providedIn: 'root' })
export class BorrowedApp {
  readonly revision = signal(0);
  private readonly currentDayState = signal<CalendarDate>('1970-01-01');
  readonly currentDay = this.currentDayState.asReadonly();

  constructor(
    private readonly store: BorrowedStore,
    @Inject(CLOCK) private readonly clock: DomainClock,
  ) {
    this.refreshCurrentDay();
  }

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
      version: current.version + 1,
    };
    await this.store.saveSettings(next, this.clock);
    this.touch();
    return next;
  }

  async setPreferredLanguage(language: SupportedLanguage): Promise<LocalSettings> {
    const current = await this.store.getSettings();
    const next: LocalSettings = {
      ...current,
      preferredLanguage: language,
      updatedAt: instantFrom(this.clock.now()),
      version: current.version + 1,
    };
    await this.store.saveSettings(next, this.clock);
    return next;
  }

  async people(): Promise<Person[]> {
    const [list, loans] = await Promise.all([this.store.listPeople(), this.store.listLoans()]);
    return this.sortPeopleByRecent(list, loans);
  }

  private sortPeopleByRecent(list: readonly Person[], loans: readonly Loan[]): Person[] {
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
      if (!person) {
        throw new DomainError('person_missing');
      }
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
        occurredOn: input.occurredOn,
        dueOn: input.dueOn,
        note: input.note,
      },
      this.clock,
    );
    await this.store.putLoanBundle({ person, loan, event, clock: this.clock });
    this.touch();
    return loan;
  }

  async activeLoans(direction?: 'lent' | 'borrowed'): Promise<Loan[]> {
    const today = this.today();
    const loans = await this.store.listActiveLoans(direction);
    return loans.sort((left, right) => compareLoansByAttention(left, right, today));
  }

  async history(): Promise<Loan[]> {
    const loans = await this.store.listCompletedLoans();
    return loans.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async home(locale = 'en-GB'): Promise<HomeSummary> {
    const loans = await this.store.listLoans();
    const repaymentsByLoan = await this.repaymentsByLoan();
    return summarizeHome(loans, repaymentsByLoan, this.today(), locale);
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
    const loan = await this.store.updateLoan({
      loanId,
      clock: this.clock,
      apply: (current) => markItemReturned(current, this.clock),
    });
    this.touch();
    return loan;
  }

  async changeDueDate(loanId: string, dueOn: string): Promise<Loan> {
    const loan = await this.store.updateLoan({
      loanId,
      clock: this.clock,
      apply: (current) => changeLoanDueDate(current, dueOn, this.clock),
    });
    this.touch();
    return loan;
  }

  async repay(loanId: string, amount: string, currency?: string): Promise<Loan> {
    const loan = await this.store.updateLoan({
      loanId,
      clock: this.clock,
      apply: (current, repayments) => {
        const result = addRepayment(
          current,
          repayments,
          { amount, currency: currency ?? current.currencyCode ?? 'EUR' },
          this.clock,
        );
        return { ...result, repayment: result.repayment };
      },
    });
    this.touch();
    return loan;
  }

  async recordDraft(): Promise<RecordDraft | undefined> {
    return this.store.getRecordDraft();
  }

  async saveRecordDraft(draft: Omit<RecordDraft, 'id' | 'updatedAt'>): Promise<RecordDraft> {
    const saved: RecordDraft = {
      ...draft,
      id: 'add-record',
      updatedAt: instantFrom(this.clock.now()),
    };
    await this.store.saveRecordDraft(saved);
    return saved;
  }

  async clearRecordDraft(): Promise<void> {
    await this.store.clearRecordDraft();
  }

  async pendingMutations(): Promise<SyncMutation[]> {
    return this.store.listPendingMutations();
  }

  daysUntilDue(loan: Loan): number | null {
    return loan.dueOn ? calendarDaysBetween(this.today(), loan.dueOn) : null;
  }

  refreshCurrentDay(): CalendarDate {
    const next = todayInTimeZone(this.clock.now(), this.clock.timeZone());
    if (next !== this.currentDayState()) {
      this.currentDayState.set(next);
    }
    return next;
  }

  async peopleWithCounts(): Promise<PersonListRow[]> {
    const [people, loans] = await Promise.all([this.store.listPeople(), this.store.listLoans()]);
    const activeCounts = new Map<string, number>();
    const lentActiveCounts = new Map<string, number>();
    const borrowedActiveCounts = new Map<string, number>();
    const historyCounts = new Map<string, number>();
    for (const loan of loans) {
      if (loan.status === 'active') {
        activeCounts.set(loan.personId, (activeCounts.get(loan.personId) ?? 0) + 1);
        const directionCounts = loan.direction === 'lent' ? lentActiveCounts : borrowedActiveCounts;
        directionCounts.set(loan.personId, (directionCounts.get(loan.personId) ?? 0) + 1);
      } else if (loan.status === 'completed') {
        historyCounts.set(loan.personId, (historyCounts.get(loan.personId) ?? 0) + 1);
      }
    }
    return this.sortPeopleByRecent(people, loans).map((person) => ({
      person,
      activeCount: activeCounts.get(person.id) ?? 0,
      lentActiveCount: lentActiveCounts.get(person.id) ?? 0,
      borrowedActiveCount: borrowedActiveCounts.get(person.id) ?? 0,
      historyCount: historyCounts.get(person.id) ?? 0,
    }));
  }

  async loansForPerson(personId: string): Promise<Loan[]> {
    return this.store.listLoansForPerson(personId);
  }

  today(): CalendarDate {
    return this.currentDay();
  }

  filterLoans(loans: readonly Loan[], query: string, filter: ListFilter): Loan[] {
    return visibleLoans(loans, query, filter, this.today());
  }

  async remainingMap(loans: readonly Loan[]): Promise<ReadonlyMap<string, bigint | null>> {
    const map = new Map<string, bigint | null>();
    const moneyLoanIds = loans.filter((loan) => loan.assetKind === 'money').map((loan) => loan.id);
    const repaymentsByLoan = this.groupRepayments(
      await this.store.listRepaymentsForLoanIds(moneyLoanIds),
    );
    for (const loan of loans) {
      if (loan.assetKind !== 'money' || !loan.currencyCode || loan.originalMinorUnits === null) {
        map.set(loan.id, null);
        continue;
      }
      const remaining = outstandingMinorUnits(loan, repaymentsByLoan.get(loan.id) ?? []);
      if (remaining === loan.originalMinorUnits) {
        map.set(loan.id, null);
        continue;
      }
      map.set(loan.id, remaining);
    }
    return map;
  }

  async search(query: string): Promise<Loan[]> {
    const loans = await this.store.listLoans();
    const today = this.today();
    return visibleLoans(loans, query, 'all', today).sort((left, right) =>
      compareLoansByAttention(left, right, today),
    );
  }

  async personOverview(personId: string): Promise<PersonOverview> {
    const [person, loans] = await Promise.all([
      this.store.findPersonById(personId),
      this.store.listLoansForPerson(personId),
    ]);
    const repayments = await this.store.listRepaymentsForLoanIds(loans.map((loan) => loan.id));
    const repaymentsByLoan = this.groupRepayments(repayments);
    const summary = summarizePersonRelationships(loans, repaymentsByLoan, this.today());
    return {
      person,
      ...summary,
    };
  }

  async exportJson(): Promise<string> {
    const [people, loans, settings, repayments] = await Promise.all([
      this.store.listPeople(),
      this.store.listLoans(),
      this.store.getSettings(),
      this.store.listRepayments(),
    ]);
    return JSON.stringify(
      {
        app: 'borrowed',
        exportedAt: instantFrom(this.clock.now()),
        settings: {
          preferredCurrency: settings.preferredCurrency,
          schemaVersion: settings.schemaVersion,
        },
        people,
        loans: loans.map((loan) => ({
          ...loan,
          originalMinorUnits: loan.originalMinorUnits?.toString() ?? null,
        })),
        repayments: repayments.map((repayment) => ({
          ...repayment,
          minorUnits: repayment.minorUnits.toString(),
        })),
      },
      null,
      2,
    );
  }

  private async repaymentsByLoan(): Promise<Map<string, Repayment[]>> {
    return this.groupRepayments(await this.store.listRepayments());
  }

  private groupRepayments(repayments: readonly Repayment[]): Map<string, Repayment[]> {
    const grouped = new Map<string, Repayment[]>();
    for (const repayment of repayments) {
      const loanRepayments = grouped.get(repayment.loanId) ?? [];
      loanRepayments.push(repayment);
      grouped.set(repayment.loanId, loanRepayments);
    }
    return grouped;
  }
}

export function provideBorrowedPersistence() {
  return [
    { provide: BorrowedStore, useFactory: () => new DexieBorrowedStore('borrowed') },
    BorrowedApp,
  ];
}
