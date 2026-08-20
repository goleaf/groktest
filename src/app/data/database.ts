import Dexie, { type Table } from 'dexie';
import type {
  LoanEventRow,
  LoanRow,
  MutationRow,
  PersonRow,
  RepaymentRow,
  RecordDraftRow,
  SettingsRow,
} from './rows';

export const LOCAL_SCHEMA_VERSION = 3;

const V1_STORES = {
  people: 'id, displayName, deletedAt',
  loans: 'id, personId, direction, assetKind, status, occurredOn, dueOn, deletedAt',
  repayments: 'id, loanId, deletedAt',
  events: 'id, loanId',
  mutations: 'id, ackedAt, createdAt, entityId',
  settings: 'id',
} as const;

const V2_STORES = { ...V1_STORES, drafts: 'id' } as const;

export class BorrowedDatabase extends Dexie {
  people!: Table<PersonRow, string>;
  loans!: Table<LoanRow, string>;
  repayments!: Table<RepaymentRow, string>;
  events!: Table<LoanEventRow, string>;
  mutations!: Table<MutationRow, string>;
  settings!: Table<SettingsRow, string>;
  drafts!: Table<RecordDraftRow, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores(V1_STORES);
    this.version(2)
      .stores(V2_STORES)
      .upgrade(async (transaction) => {
        await transaction
          .table<SettingsRow, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.schemaVersion = 2;
            settings.version = settings.version ?? 1;
          });
      });
    this.version(LOCAL_SCHEMA_VERSION)
      .stores(V2_STORES)
      .upgrade(async (transaction) => {
        await transaction
          .table<SettingsRow, string>('settings')
          .toCollection()
          .modify((settings) => {
            settings.preferredLanguage = settings.preferredLanguage ?? 'en';
            settings.schemaVersion = LOCAL_SCHEMA_VERSION;
            settings.version = settings.version ?? 1;
          });
      });
  }
}
