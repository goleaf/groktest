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
import { DomainError } from '../domain/errors';
import {
  isLoanDueSoon,
  isLoanOverdue,
  outstandingMinorUnits,
  urgencyRank,
} from '../domain/loan-rules';
import { formatMinorUnits, requireCurrency } from '../domain/money';
import type { ListFilter } from '../domain/query';
import { visibleLoans } from '../domain/query';
import type {
  HomeSummary,
  Loan,
  LocalSettings,
  MoneyTotal,
  Person,
  RecordDraft,
  Repayment,
  SyncMutation,
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
      version: current.version + 1,
    };
    await this.store.saveSettings(next, this.clock);
    this.touch();
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
    const today = todayInTimeZone(this.clock.now(), this.clock.timeZone());
    const loans = (await this.store.listLoans()).filter(
      (loan) => loan.status === 'active' && (!direction || loan.direction === direction),
    );
    return loans.sort((left, right) => urgencyRank(left, today) - urgencyRank(right, today));
  }

  async history(): Promise<Loan[]> {
    const loans = (await this.store.listLoans()).filter((loan) => loan.status === 'completed');
    return loans.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async home(): Promise<HomeSummary> {
    const loans = await this.store.listLoans();
    const repaymentsByLoan = await this.repaymentsByLoan();
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
    const loan = await this.store.updateLoan({
      loanId,
      clock: this.clock,
      apply: (current) => markItemReturned(current, this.clock),
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

  isOverdue(loan: Loan): boolean {
    return isLoanOverdue(loan, todayInTimeZone(this.clock.now(), this.clock.timeZone()));
  }

  isDueSoon(loan: Loan): boolean {
    return isLoanDueSoon(loan, todayInTimeZone(this.clock.now(), this.clock.timeZone()));
  }

  async peopleWithCounts(): Promise<{ person: Person; activeCount: number }[]> {
    const [people, loans] = await Promise.all([this.store.listPeople(), this.store.listLoans()]);
    const activeCounts = new Map<string, number>();
    for (const loan of loans) {
      if (loan.status === 'active') {
        activeCounts.set(loan.personId, (activeCounts.get(loan.personId) ?? 0) + 1);
      }
    }
    return this.sortPeopleByRecent(people, loans).map((person) => ({
      person,
      activeCount: activeCounts.get(person.id) ?? 0,
    }));
  }

  async loansForPerson(personId: string): Promise<Loan[]> {
    return (await this.store.listLoans()).filter((loan) => loan.personId === personId);
  }

  today(): string {
    return todayInTimeZone(this.clock.now(), this.clock.timeZone());
  }

  filterLoans(loans: readonly Loan[], query: string, filter: ListFilter): Loan[] {
    return visibleLoans(loans, query, filter, this.today());
  }

  async remainingMap(loans: readonly Loan[]): Promise<ReadonlyMap<string, string | null>> {
    const locale = typeof navigator === 'undefined' ? 'en' : navigator.language;
    const map = new Map<string, string | null>();
    const repaymentsByLoan = await this.repaymentsByLoan();
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
      map.set(loan.id, formatMinorUnits(remaining, loan.currencyCode, locale));
    }
    return map;
  }

  async search(query: string): Promise<Loan[]> {
    const loans = await this.store.listLoans();
    const today = this.today();
    return visibleLoans(loans, query, 'all', today).sort(
      (left, right) => urgencyRank(left, today) - urgencyRank(right, today),
    );
  }

  async personOverview(personId: string): Promise<{
    person: Person | undefined;
    active: Loan[];
    history: Loan[];
    owedToMe: readonly MoneyTotal[];
    iOwe: readonly MoneyTotal[];
  }> {
    const [people, allLoans, repaymentsByLoan] = await Promise.all([
      this.store.listPeople(),
      this.store.listLoans(),
      this.repaymentsByLoan(),
    ]);
    const person = people.find((item) => item.id === personId);
    const loans = allLoans.filter((loan) => loan.personId === personId);
    const summary = summarizeHome(loans, repaymentsByLoan, this.today(), 'en');
    return {
      person,
      active: loans.filter((loan) => loan.status === 'active'),
      history: loans.filter((loan) => loan.status === 'completed'),
      owedToMe: summary.moneyOwedToMe,
      iOwe: summary.moneyIOwe,
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
    const grouped = new Map<string, Repayment[]>();
    for (const repayment of await this.store.listRepayments()) {
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
