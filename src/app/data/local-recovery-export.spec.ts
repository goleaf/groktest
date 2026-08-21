import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { indexedDB } from 'fake-indexeddb';
import { expect, it, vi } from 'vitest';
import { BackupService } from '../application/backup-service';
import type { DomainClock } from '../domain/commands';
import { DexieBorrowedStore } from './dexie-store';

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

it('exports raw recoverable rows without decoding, deleting, or resetting the database', async () => {
  const dbName = `borrowed-recovery-${crypto.randomUUID()}`;
  const rawDatabase = new Dexie(dbName);
  rawDatabase.version(3).stores(STORES);
  await rawDatabase.open();
  await rawDatabase.table('settings').put({
    id: 'local',
    localIdentityId: 'identity-1',
    preferredCurrency: 'BTC',
    preferredLanguage: 'en',
    schemaVersion: 3,
    version: 1,
    createdAt: '2026-08-21T12:00:00.000Z',
    updatedAt: '2026-08-21T12:00:00.000Z',
  });
  await rawDatabase.table('people').put({
    id: 'person-1',
    displayName: 'Private Aistė',
    notes: 'private note',
    deletedAt: null,
  });
  rawDatabase.close();
  const store = new DexieBorrowedStore(dbName);
  const backups = new BackupService(store, clock);
  const deleteDatabase = vi.spyOn(indexedDB, 'deleteDatabase');

  const exported: unknown = JSON.parse(await backups.exportRawRecoveryJson());

  expect(exported).toMatchObject({
    kind: 'borrowed-local-recovery-diagnostic',
    formatVersion: 1,
    databaseSchemaVersion: 3,
    exportedAt: '2026-08-21T12:00:00.000Z',
    tables: {
      settings: [{ preferredCurrency: 'BTC' }],
      people: [{ displayName: 'Private Aistė', notes: 'private note' }],
    },
  });
  expect(deleteDatabase).not.toHaveBeenCalled();

  deleteDatabase.mockRestore();
  await store.close();
  indexedDB.deleteDatabase(dbName);
});
