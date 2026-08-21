import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { DexieBorrowedStore } from './dexie-store';
import { PersistenceCorruptionError, type PersistedEntity } from './persistence-corruption';

const STORES = {
  people: 'id, displayName, deletedAt',
  loans: 'id, personId, direction, assetKind, status, occurredOn, dueOn, deletedAt',
  repayments: 'id, loanId, deletedAt',
  events: 'id, loanId',
  mutations: 'id, ackedAt, createdAt, entityId',
  settings: 'id',
  drafts: 'id',
} as const;

const clock: DomainClock = {
  now: () => new Date('2026-08-21T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

const createdAt = '2026-08-21T12:00:00.000Z';

const personRow = {
  id: 'person-1',
  displayName: 'Peter',
  phone: null,
  email: null,
  notes: null,
  createdAt,
  updatedAt: createdAt,
  version: 1,
  deletedAt: null,
};

const loanRow = {
  id: 'loan-1',
  direction: 'lent',
  assetKind: 'money',
  status: 'active',
  personId: personRow.id,
  personNameSnapshot: 'Peter',
  occurredOn: '2026-08-21',
  dueOn: null,
  returnedOn: null,
  note: null,
  itemName: null,
  itemDescription: null,
  quantity: null,
  currencyCode: 'EUR',
  originalMinorUnits: '10000',
  createdAt,
  updatedAt: createdAt,
  version: 1,
  deletedAt: null,
};

const repaymentRow = {
  id: 'repayment-1',
  loanId: loanRow.id,
  minorUnits: '2500',
  currencyCode: 'EUR',
  occurredOn: '2026-08-21',
  note: null,
  createdAt,
  version: 1,
  deletedAt: null,
};

const eventRow = {
  id: 'event-1',
  loanId: loanRow.id,
  type: 'repayment_added',
  summaryKey: 'history.repaymentAdded',
  summaryParamsJson: '{"amount":"2500"}',
  occurredAt: createdAt,
  createdAt,
};

const mutationRow = {
  id: 'mutation-1',
  entityType: 'loan',
  entityId: loanRow.id,
  operation: 'upsert',
  payloadJson: '{"id":"loan-1"}',
  createdAt,
  ackedAt: null,
  attempts: 0,
  lastError: null,
};

const draftRow = {
  id: 'add-record',
  direction: 'lent',
  kind: 'money',
  personName: 'Peter',
  personId: null,
  itemName: '',
  amount: '100',
  currency: 'EUR',
  dueOn: '',
  note: '',
  updatedAt: createdAt,
};

type TableName = keyof typeof STORES;

async function storeWithRawRow(
  tableName: TableName,
  row: unknown,
): Promise<{
  readonly dbName: string;
  readonly store: DexieBorrowedStore;
}> {
  const dbName = `borrowed-corruption-${crypto.randomUUID()}`;
  const raw = new Dexie(dbName);
  raw.version(3).stores(STORES);
  await raw.open();
  await raw.table(tableName).put(row);
  raw.close();
  return { dbName, store: new DexieBorrowedStore(dbName) };
}

async function expectCorruptRead(
  tableName: TableName,
  row: unknown,
  read: (store: DexieBorrowedStore) => Promise<unknown>,
  expected: { entity: PersistedEntity; path: string },
): Promise<void> {
  const { dbName, store } = await storeWithRawRow(tableName, row);
  try {
    await read(store);
    throw new Error('expected_persistence_corruption');
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(PersistenceCorruptionError);
    if (error instanceof PersistenceCorruptionError) {
      expect(error.entity).toBe(expected.entity);
      expect(error.path).toBe(expected.path);
      expect(error.message).not.toContain(JSON.stringify(row));
    }
  } finally {
    await store.close();
    indexedDB.deleteDatabase(dbName);
  }
}

describe('corrupt IndexedDB row boundaries', () => {
  it('reports corrupt LocalSettings during initialization', async () => {
    await expectCorruptRead(
      'settings',
      {
        id: 'local',
        localIdentityId: 'identity-1',
        preferredCurrency: 'BTC',
        preferredLanguage: 'en',
        schemaVersion: 3,
        version: 1,
        createdAt,
        updatedAt: createdAt,
      },
      (store) => store.initialize(clock),
      { entity: 'local_settings', path: 'preferredCurrency' },
    );
  });

  it('does not silently hide a person with a corrupt tombstone', async () => {
    await expectCorruptRead(
      'people',
      { ...personRow, deletedAt: false },
      (store) => store.listPeople(),
      { entity: 'person', path: 'deletedAt' },
    );
  });

  it('does not silently hide a loan with a corrupt tombstone', async () => {
    await expectCorruptRead(
      'loans',
      { ...loanRow, deletedAt: false },
      (store) => store.listLoans(),
      { entity: 'loan', path: 'deletedAt' },
    );
  });

  it('does not silently hide a repayment with a corrupt tombstone', async () => {
    await expectCorruptRead(
      'repayments',
      { ...repaymentRow, deletedAt: false },
      (store) => store.listRepayments(loanRow.id),
      { entity: 'repayment', path: 'deletedAt' },
    );
  });

  it('reports invalid event summary JSON through the typed boundary', async () => {
    await expectCorruptRead(
      'events',
      { ...eventRow, summaryParamsJson: '{' },
      (store) => store.listEvents(loanRow.id),
      { entity: 'loan_event', path: 'summaryParamsJson' },
    );
  });

  it('does not silently hide a mutation with a corrupt acknowledgement instant', async () => {
    await expectCorruptRead(
      'mutations',
      { ...mutationRow, ackedAt: false },
      (store) => store.listPendingMutations(),
      { entity: 'sync_mutation', path: 'ackedAt' },
    );
  });

  it('does not decode payloads for acknowledged mutations outside the pending read', async () => {
    const dbName = `borrowed-corruption-${crypto.randomUUID()}`;
    const raw = new Dexie(dbName);
    raw.version(3).stores(STORES);
    await raw.open();
    await raw.table('mutations').bulkPut([
      { ...mutationRow, id: 'acknowledged', payloadJson: '{', ackedAt: createdAt },
      { ...mutationRow, id: 'pending' },
    ]);
    raw.close();
    const store = new DexieBorrowedStore(dbName);

    await expect(store.listPendingMutations()).resolves.toEqual([
      expect.objectContaining({ id: 'pending' }),
    ]);

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('reports a corrupt persisted Add draft', async () => {
    await expectCorruptRead(
      'drafts',
      { ...draftRow, dueOn: '2026-02-30' },
      (store) => store.getRecordDraft(),
      { entity: 'record_draft', path: 'dueOn' },
    );
  });
});
