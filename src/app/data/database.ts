import Dexie, { type Table } from 'dexie';
import type {
  LoanEventRow,
  LoanRow,
  MutationRow,
  PersonRow,
  RepaymentRow,
  SettingsRow,
} from './rows';

export const LOCAL_SCHEMA_VERSION = 1;

export class BorrowedDatabase extends Dexie {
  people!: Table<PersonRow, string>;
  loans!: Table<LoanRow, string>;
  repayments!: Table<RepaymentRow, string>;
  events!: Table<LoanEventRow, string>;
  mutations!: Table<MutationRow, string>;
  settings!: Table<SettingsRow, string>;

  constructor(name: string) {
    super(name);
    this.version(LOCAL_SCHEMA_VERSION).stores({
      people: 'id, displayName, deletedAt',
      loans: 'id, personId, direction, assetKind, status, occurredOn, dueOn, deletedAt',
      repayments: 'id, loanId, deletedAt',
      events: 'id, loanId',
      mutations: 'id, ackedAt, createdAt, entityId',
      settings: 'id',
    });
  }
}
