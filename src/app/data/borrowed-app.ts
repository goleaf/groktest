import { Inject, Injectable, type Signal } from '@angular/core';
import { ApplicationRevision } from '../application/application-revision';
import { CurrentDayService } from '../application/current-day-service';
import { HomeQueryService } from '../application/home-query-service';
import {
  PeopleQueryService,
  type PersonListRow,
  type PersonOverview,
} from '../application/people-query-service';
import {
  RecordsCommandService,
  type CreateRecordInput,
} from '../application/records-command-service';
import { RecordsQueryService } from '../application/records-query-service';
import type { DomainClock } from '../domain/commands';
import type { ListFilter } from '../domain/query';
import type { HomeSummary, Loan, Person, SyncMutation } from '../domain/types';
import { CLOCK } from './clock';
import { DexieBorrowedStore } from './dexie-store';
import { BorrowedStore } from './store';

export type { CreateRecordInput } from '../application/records-command-service';
export type { PersonListRow, PersonOverview } from '../application/people-query-service';

@Injectable({ providedIn: 'root' })
export class BorrowedApp {
  readonly revision: Signal<number>;

  constructor(
    private readonly store: BorrowedStore,
    @Inject(CLOCK) private readonly clock: DomainClock,
    private readonly recordsCommands: RecordsCommandService = new RecordsCommandService(
      store,
      clock,
    ),
    private readonly currentDayService: CurrentDayService = new CurrentDayService(clock),
    private readonly applicationRevision: ApplicationRevision = new ApplicationRevision(),
    private readonly recordsQueries: RecordsQueryService = new RecordsQueryService(
      store,
      currentDayService,
    ),
    private readonly peopleQueries: PeopleQueryService = new PeopleQueryService(
      store,
      currentDayService,
    ),
    private readonly homeQueries: HomeQueryService = new HomeQueryService(store, currentDayService),
  ) {
    this.revision = this.applicationRevision.value;
  }

  private touch(): void {
    this.applicationRevision.touch();
  }

  async people(): Promise<Person[]> {
    return this.peopleQueries.people();
  }

  async createRecord(input: CreateRecordInput): Promise<Loan> {
    const loan = await this.recordsCommands.createRecord(input);
    this.touch();
    return loan;
  }

  async activeLoans(direction?: 'lent' | 'borrowed'): Promise<Loan[]> {
    return this.recordsQueries.activeLoans(direction);
  }

  async history(): Promise<Loan[]> {
    return this.recordsQueries.history();
  }

  async home(): Promise<HomeSummary> {
    return this.homeQueries.home();
  }

  async loanDetail(id: string) {
    return this.recordsQueries.loanDetail(id);
  }

  async remainingFor(loan: Loan): Promise<bigint | null> {
    return this.recordsQueries.remainingFor(loan);
  }

  async markReturned(loanId: string): Promise<Loan> {
    const loan = await this.recordsCommands.markReturned(loanId);
    this.touch();
    return loan;
  }

  async changeDueDate(loanId: string, dueOn: string): Promise<Loan> {
    const loan = await this.recordsCommands.changeDueDate(loanId, dueOn);
    this.touch();
    return loan;
  }

  async repay(loanId: string, amount: string, currency?: string): Promise<Loan> {
    const loan = await this.recordsCommands.addRepayment(loanId, amount, currency);
    this.touch();
    return loan;
  }

  async pendingMutations(): Promise<SyncMutation[]> {
    return this.store.listPendingMutations();
  }

  async peopleWithCounts(): Promise<PersonListRow[]> {
    return this.peopleQueries.peopleWithCounts();
  }

  async loansForPerson(personId: string): Promise<Loan[]> {
    return this.peopleQueries.loansForPerson(personId);
  }

  filterLoans(loans: readonly Loan[], query: string, filter: ListFilter): Loan[] {
    return this.recordsQueries.filterLoans(loans, query, filter);
  }

  async remainingMap(loans: readonly Loan[]): Promise<ReadonlyMap<string, bigint | null>> {
    return this.recordsQueries.remainingMap(loans);
  }

  async search(query: string): Promise<Loan[]> {
    return this.recordsQueries.search(query);
  }

  async personOverview(personId: string): Promise<PersonOverview> {
    return this.peopleQueries.personOverview(personId);
  }
}

export function provideBorrowedPersistence() {
  return [
    { provide: BorrowedStore, useFactory: () => new DexieBorrowedStore('borrowed') },
    BorrowedApp,
  ];
}
