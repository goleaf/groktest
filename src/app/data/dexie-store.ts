import { instantFrom, type Instant } from '../domain/calendar-date';
import { DEFAULT_CURRENCY, LOCAL_SETTINGS_ID } from '../domain/config';
import type { DomainClock } from '../domain/commands';
import { createId } from '../domain/ids';
import type {
  Loan,
  LoanEvent,
  LocalSettings,
  Person,
  RecordDraft,
  Repayment,
  SyncEntityType,
  SyncMutation,
} from '../domain/types';
import { BorrowedDatabase, LOCAL_SCHEMA_VERSION } from './database';
import {
  eventFromRow,
  eventToRow,
  loanFromRow,
  loanToRow,
  mutationFromRow,
  mutationToRow,
  personFromRow,
  personToRow,
  recordDraftFromRow,
  recordDraftToRow,
  repaymentFromRow,
  repaymentToRow,
  settingsFromRow,
  settingsToRow,
} from './mappers';
import type { RepaymentRow } from './rows';
import { isPendingMutationRow } from './row-decoders';
import type { LoanRecord } from './store';
import { BorrowedStore } from './store';

function activeRepaymentsFromRows(rows: readonly RepaymentRow[]): Repayment[] {
  return rows.map(repaymentFromRow).filter((repayment) => repayment.deletedAt === null);
}

function mutation(
  entityType: SyncEntityType,
  entityId: string,
  payload: unknown,
  clock: DomainClock,
): SyncMutation {
  return {
    id: createId(),
    entityType,
    entityId,
    operation: 'upsert',
    payloadJson: JSON.stringify(payload),
    createdAt: instantFrom(clock.now()),
    ackedAt: null,
    attempts: 0,
    lastError: null,
  };
}

function recoveryJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? { type: 'bigint', decimalString: value.toString() } : value;
}

export class DexieBorrowedStore extends BorrowedStore {
  private readonly db: BorrowedDatabase;

  constructor(name = 'borrowed') {
    super();
    this.db = new BorrowedDatabase(name);
  }

  async initialize(clock: DomainClock): Promise<LocalSettings> {
    return this.db.transaction('rw', this.db.settings, this.db.mutations, async () => {
      const existing = await this.db.settings.get(LOCAL_SETTINGS_ID);
      if (existing) {
        return settingsFromRow(existing);
      }

      const at = instantFrom(clock.now());
      const settings: LocalSettings = {
        id: 'local',
        localIdentityId: createId(),
        preferredCurrency: DEFAULT_CURRENCY,
        preferredLanguage: 'en',
        schemaVersion: LOCAL_SCHEMA_VERSION,
        version: 1,
        createdAt: at,
        updatedAt: at,
      };
      await this.db.settings.add(settingsToRow(settings));
      await this.db.mutations.add(
        mutationToRow(mutation('settings', settings.id, settings, clock)),
      );
      return settings;
    });
  }

  async getSettings(): Promise<LocalSettings> {
    const row = await this.db.settings.get(LOCAL_SETTINGS_ID);
    if (!row) {
      throw new Error('settings_missing');
    }
    return settingsFromRow(row);
  }

  async saveSettings(settings: LocalSettings, clock: DomainClock): Promise<void> {
    await this.db.transaction('rw', this.db.settings, this.db.mutations, async () => {
      await this.db.settings.put(settingsToRow(settings));
      await this.db.mutations.put(
        mutationToRow(mutation('settings', settings.id, settingsToRow(settings), clock)),
      );
    });
  }

  async findPersonById(id: string): Promise<Person | undefined> {
    const row = await this.db.people.get(id);
    return row ? personFromRow(row) : undefined;
  }

  async listPeople(): Promise<Person[]> {
    const rows = await this.db.people.toArray();
    return rows.map(personFromRow).filter((person) => person.deletedAt === null);
  }

  async putLoanBundle(input: {
    person: Person;
    loan: Loan;
    event: LoanEvent;
    extra?: { repayment?: Repayment };
    clock?: DomainClock;
  }): Promise<void> {
    const clock = input.clock ?? { now: () => new Date(), timeZone: () => 'UTC' };
    await this.db.transaction(
      'rw',
      this.db.people,
      this.db.loans,
      this.db.repayments,
      this.db.events,
      this.db.mutations,
      async () => {
        const personIsNew = !(await this.db.people.get(input.person.id));
        await this.db.people.put(personToRow(input.person));
        await this.db.loans.put(loanToRow(input.loan));
        await this.db.events.put(eventToRow(input.event));
        if (personIsNew) {
          await this.db.mutations.put(
            mutationToRow(mutation('person', input.person.id, personToRow(input.person), clock)),
          );
        }
        await this.db.mutations.put(
          mutationToRow(mutation('loan', input.loan.id, loanToRow(input.loan), clock)),
        );
        await this.db.mutations.put(
          mutationToRow(mutation('loan_event', input.event.id, eventToRow(input.event), clock)),
        );
        if (input.extra?.repayment) {
          await this.db.repayments.put(repaymentToRow(input.extra.repayment));
          await this.db.mutations.put(
            mutationToRow(
              mutation(
                'repayment',
                input.extra.repayment.id,
                repaymentToRow(input.extra.repayment),
                clock,
              ),
            ),
          );
        }
      },
    );
  }

  async updateLoan(input: {
    loanId: string;
    clock: DomainClock;
    apply: (
      loan: Loan,
      repayments: readonly Repayment[],
    ) => { loan: Loan; event: LoanEvent; repayment?: Repayment };
  }): Promise<Loan> {
    return this.db.transaction(
      'rw',
      this.db.loans,
      this.db.repayments,
      this.db.events,
      this.db.mutations,
      async () => {
        const loanRow = await this.db.loans.get(input.loanId);
        if (!loanRow) {
          throw new Error('loan_missing');
        }
        const loan = loanFromRow(loanRow);
        if (loan.deletedAt !== null) {
          throw new Error('loan_missing');
        }
        const repaymentRows = await this.db.repayments
          .where('loanId')
          .equals(input.loanId)
          .toArray();
        const result = input.apply(loan, activeRepaymentsFromRows(repaymentRows));
        await this.db.loans.put(loanToRow(result.loan));
        await this.db.events.put(eventToRow(result.event));
        await this.db.mutations.put(
          mutationToRow(mutation('loan', result.loan.id, loanToRow(result.loan), input.clock)),
        );
        await this.db.mutations.put(
          mutationToRow(
            mutation('loan_event', result.event.id, eventToRow(result.event), input.clock),
          ),
        );
        if (result.repayment) {
          await this.db.repayments.put(repaymentToRow(result.repayment));
          await this.db.mutations.put(
            mutationToRow(
              mutation(
                'repayment',
                result.repayment.id,
                repaymentToRow(result.repayment),
                input.clock,
              ),
            ),
          );
        }
        return result.loan;
      },
    );
  }

  async listLoans(): Promise<Loan[]> {
    const rows = await this.db.loans.toArray();
    return rows.map(loanFromRow).filter((loan) => loan.deletedAt === null);
  }

  async listActiveLoans(direction?: 'lent' | 'borrowed'): Promise<Loan[]> {
    const rows = await this.db.loans.where('status').equals('active').toArray();
    return rows
      .map(loanFromRow)
      .filter(
        (loan) =>
          loan.deletedAt === null && (direction === undefined || loan.direction === direction),
      );
  }

  async listCompletedLoans(): Promise<Loan[]> {
    const rows = await this.db.loans.where('status').equals('completed').toArray();
    return rows.map(loanFromRow).filter((loan) => loan.deletedAt === null);
  }

  async listLoansForPerson(personId: string): Promise<Loan[]> {
    const rows = await this.db.loans.where('personId').equals(personId).toArray();
    return rows.map(loanFromRow).filter((loan) => loan.deletedAt === null);
  }

  async findLoan(id: string): Promise<Loan | undefined> {
    const row = await this.db.loans.get(id);
    if (!row) {
      return undefined;
    }
    const loan = loanFromRow(row);
    return loan.deletedAt === null ? loan : undefined;
  }

  async listRepayments(loanId?: string): Promise<Repayment[]> {
    const rows = loanId
      ? await this.db.repayments.where('loanId').equals(loanId).toArray()
      : await this.db.repayments.toArray();
    return activeRepaymentsFromRows(rows);
  }

  async listRepaymentsForLoanIds(loanIds: readonly string[]): Promise<Repayment[]> {
    if (loanIds.length === 0) {
      return [];
    }
    const rows = await this.db.repayments
      .where('loanId')
      .anyOf([...loanIds])
      .toArray();
    return activeRepaymentsFromRows(rows);
  }

  async listEvents(loanId: string): Promise<LoanEvent[]> {
    const rows = await this.db.events.where('loanId').equals(loanId).toArray();
    return rows
      .map(eventFromRow)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async loadLoanRecord(id: string): Promise<LoanRecord | undefined> {
    const loan = await this.findLoan(id);
    if (!loan) {
      return undefined;
    }
    const person = await this.findPersonById(loan.personId);
    if (!person) {
      return undefined;
    }
    return {
      loan,
      person,
      repayments: await this.listRepayments(id),
      events: await this.listEvents(id),
    };
  }

  async listPendingMutations(): Promise<SyncMutation[]> {
    const rows = await this.db.mutations.filter(isPendingMutationRow).toArray();
    return rows
      .map(mutationFromRow)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async getRecordDraft(): Promise<RecordDraft | undefined> {
    const row = await this.db.drafts.get('add-record');
    return row ? recordDraftFromRow(row) : undefined;
  }

  async saveRecordDraft(draft: RecordDraft): Promise<void> {
    await this.db.drafts.put(recordDraftToRow(draft));
  }

  async clearRecordDraft(): Promise<void> {
    await this.db.drafts.delete('add-record');
  }

  async exportRawRecoveryJson(exportedAt: Instant): Promise<string> {
    const tables = await this.db.transaction(
      'r',
      [
        this.db.settings,
        this.db.people,
        this.db.loans,
        this.db.repayments,
        this.db.events,
        this.db.mutations,
        this.db.drafts,
      ],
      async () => {
        const [settings, people, loans, repayments, events, mutations, drafts] = await Promise.all([
          this.db.settings.toArray(),
          this.db.people.toArray(),
          this.db.loans.toArray(),
          this.db.repayments.toArray(),
          this.db.events.toArray(),
          this.db.mutations.toArray(),
          this.db.drafts.toArray(),
        ]);
        return { settings, people, loans, repayments, events, mutations, drafts };
      },
    );

    return JSON.stringify(
      {
        kind: 'borrowed-local-recovery-diagnostic',
        formatVersion: 1,
        databaseSchemaVersion: LOCAL_SCHEMA_VERSION,
        exportedAt,
        tables,
      },
      recoveryJsonReplacer,
      2,
    );
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
