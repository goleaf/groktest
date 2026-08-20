import type { DomainClock } from '../domain/commands';
import type {
  Loan,
  LoanEvent,
  LocalSettings,
  Person,
  Repayment,
  SyncMutation,
} from '../domain/types';

export interface LoanRecord {
  loan: Loan;
  person: Person;
  repayments: Repayment[];
  events: LoanEvent[];
}

export abstract class BorrowedStore {
  abstract initialize(clock: DomainClock): Promise<LocalSettings>;
  abstract getSettings(): Promise<LocalSettings>;
  abstract saveSettings(settings: LocalSettings): Promise<void>;
  abstract putPerson(person: Person): Promise<void>;
  abstract findPersonById(id: string): Promise<Person | undefined>;
  abstract findPersonByName(name: string): Promise<Person | undefined>;
  abstract listPeople(): Promise<Person[]>;
  abstract putLoanBundle(input: {
    person: Person;
    loan: Loan;
    event: LoanEvent;
    extra?: { repayment?: Repayment };
    clock?: DomainClock;
  }): Promise<void>;
  abstract listLoans(): Promise<Loan[]>;
  abstract findLoan(id: string): Promise<Loan | undefined>;
  abstract listRepayments(loanId: string): Promise<Repayment[]>;
  abstract listEvents(loanId: string): Promise<LoanEvent[]>;
  abstract loadLoanRecord(id: string): Promise<LoanRecord | undefined>;
  abstract listPendingMutations(): Promise<SyncMutation[]>;
  abstract close(): Promise<void>;
}
