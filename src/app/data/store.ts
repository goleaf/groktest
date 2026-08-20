import type { DomainClock } from '../domain/commands';
import type {
  Loan,
  LoanEvent,
  LocalSettings,
  Person,
  RecordDraft,
  Repayment,
  SyncMutation,
} from '../domain/types';

export interface LoanRecord {
  loan: Loan;
  person: Person;
  repayments: Repayment[];
  events: LoanEvent[];
}

export interface LoanUpdate {
  loan: Loan;
  event: LoanEvent;
  repayment?: Repayment;
}

export abstract class BorrowedStore {
  abstract initialize(clock: DomainClock): Promise<LocalSettings>;
  abstract getSettings(): Promise<LocalSettings>;
  abstract saveSettings(settings: LocalSettings, clock: DomainClock): Promise<void>;
  abstract findPersonById(id: string): Promise<Person | undefined>;
  abstract listPeople(): Promise<Person[]>;
  abstract putLoanBundle(input: {
    person: Person;
    loan: Loan;
    event: LoanEvent;
    extra?: { repayment?: Repayment };
    clock?: DomainClock;
  }): Promise<void>;
  abstract updateLoan(input: {
    loanId: string;
    clock: DomainClock;
    apply: (loan: Loan, repayments: readonly Repayment[]) => LoanUpdate;
  }): Promise<Loan>;
  abstract listLoans(): Promise<Loan[]>;
  abstract findLoan(id: string): Promise<Loan | undefined>;
  abstract listRepayments(loanId: string): Promise<Repayment[]>;
  abstract listEvents(loanId: string): Promise<LoanEvent[]>;
  abstract loadLoanRecord(id: string): Promise<LoanRecord | undefined>;
  abstract listPendingMutations(): Promise<SyncMutation[]>;
  abstract getRecordDraft(): Promise<RecordDraft | undefined>;
  abstract saveRecordDraft(draft: RecordDraft): Promise<void>;
  abstract clearRecordDraft(): Promise<void>;
  abstract close(): Promise<void>;
}
