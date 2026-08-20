import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { outstandingMinorUnits } from '../domain/loan-rules';
import { BorrowedApp } from './borrowed-app';
import { DexieBorrowedStore } from './dexie-store';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

async function session(name: string): Promise<{ app: BorrowedApp; store: DexieBorrowedStore }> {
  const store = new DexieBorrowedStore(name);
  const app = new BorrowedApp(store, clock);
  await app.initialize();
  return { app, store };
}

describe('local persistence', () => {
  it('creates a physical lent record offline and keeps it after reload', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const first = await session(dbName);
    const loan = await first.app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Peter',
      itemName: 'drill',
    });
    expect(loan.status).toBe('active');
    const pendingAfterCreate = await first.app.pendingMutations();
    expect(pendingAfterCreate.length).toBeGreaterThan(0);
    expect(pendingAfterCreate.every((mutation) => mutation.ackedAt === null)).toBe(true);
    await first.store.close();

    const reloaded = await session(dbName);
    const lent = await reloaded.app.activeLoans('lent');
    expect(lent).toHaveLength(1);
    expect(lent[0]?.itemName).toBe('drill');
    expect(lent[0]?.personNameSnapshot).toBe('Peter');
    await reloaded.store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('records a local repayment and completion without a network', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const loan = await app.createRecord({
      direction: 'lent',
      kind: 'money',
      personName: 'Peter',
      amount: '500',
      currency: 'EUR',
    });
    await app.repay(loan.id, '100', 'EUR');
    const afterPartial = await app.loanDetail(loan.id);
    expect(afterPartial).toBeTruthy();
    if (afterPartial) {
      expect(outstandingMinorUnits(afterPartial.loan, afterPartial.repayments)).toBe(40000n);
      expect(afterPartial.loan.originalMinorUnits).toBe(50000n);
      expect(afterPartial.loan.status).toBe('active');
    }
    await app.repay(loan.id, '400', 'EUR');
    const afterFull = await app.loanDetail(loan.id);
    expect(afterFull?.loan.status).toBe('completed');
    const history = await app.history();
    expect(history).toHaveLength(1);
    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('keeps a returned item in history with the same id', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const loan = await app.createRecord({
      direction: 'borrowed',
      kind: 'physical_item',
      personName: 'Anna',
      itemName: 'ladder',
    });
    await app.markReturned(loan.id);
    expect(await app.activeLoans('borrowed')).toHaveLength(0);
    const history = await app.history();
    expect(history[0]?.id).toBe(loan.id);
    expect(history[0]?.status).toBe('completed');
    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('keeps separately typed people separate even when their names match', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const first = await app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Peter',
      itemName: 'drill',
    });
    const second = await app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Peter',
      itemName: 'book',
    });
    expect(first.personId).not.toBe(second.personId);
    expect(await app.people()).toHaveLength(2);

    const selected = await app.createRecord({
      direction: 'borrowed',
      kind: 'physical_item',
      personId: first.personId,
      personName: 'Peter',
      itemName: 'ladder',
    });
    expect(selected.personId).toBe(first.personId);
    expect(await app.people()).toHaveLength(2);
    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('serializes concurrent repayments so outstanding money never becomes negative', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const loan = await app.createRecord({
      direction: 'lent',
      kind: 'money',
      personName: 'Peter',
      amount: '100',
      currency: 'EUR',
    });
    const results = await Promise.allSettled([
      app.repay(loan.id, '70', 'EUR'),
      app.repay(loan.id, '70', 'EUR'),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const detail = await app.loanDetail(loan.id);
    expect(detail?.repayments).toHaveLength(1);
    if (detail) {
      expect(outstandingMinorUnits(detail.loan, detail.repayments)).toBe(3000n);
    }
    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('loads repayments in one bounded query for multi-loan summaries', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    await app.createRecord({
      direction: 'lent',
      kind: 'money',
      personName: 'Peter',
      amount: '100',
      currency: 'EUR',
    });
    await app.createRecord({
      direction: 'borrowed',
      kind: 'money',
      personName: 'Anna',
      amount: '50',
      currency: 'EUR',
    });
    const repaymentQueries = vi.spyOn(store, 'listRepayments');
    await app.home();
    expect(repaymentQueries).toHaveBeenCalledTimes(1);

    repaymentQueries.mockClear();
    await app.remainingMap(await app.activeLoans());
    expect(repaymentQueries).toHaveBeenCalledTimes(1);
    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('queues settings changes but keeps form drafts local to the device', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const initialMutations = await app.pendingMutations();
    await app.setPreferredCurrency('GBP');
    expect(await app.pendingMutations()).toHaveLength(initialMutations.length + 1);

    await app.saveRecordDraft({
      direction: 'borrowed',
      kind: 'money',
      personName: 'Anna',
      personId: null,
      itemName: '',
      amount: '25',
      currency: 'GBP',
      dueOn: '',
      note: '',
    });
    expect((await app.recordDraft())?.amount).toBe('25');
    expect(await app.pendingMutations()).toHaveLength(initialMutations.length + 1);
    await app.clearRecordDraft();
    expect(await app.recordDraft()).toBeUndefined();
    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('migrates an existing v1 database to v2 without changing user preferences', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const legacy = new Dexie(dbName);
    legacy.version(1).stores({
      people: 'id, displayName, deletedAt',
      loans: 'id, personId, direction, assetKind, status, occurredOn, dueOn, deletedAt',
      repayments: 'id, loanId, deletedAt',
      events: 'id, loanId',
      mutations: 'id, ackedAt, createdAt, entityId',
      settings: 'id',
    });
    await legacy.open();
    await legacy.table('settings').put({
      id: 'local',
      localIdentityId: crypto.randomUUID(),
      preferredCurrency: 'GBP',
      schemaVersion: 1,
      createdAt: '2026-08-19T12:00:00.000Z',
      updatedAt: '2026-08-19T12:00:00.000Z',
    });
    legacy.close();

    const migrated = await session(dbName);
    expect((await migrated.app.settings()).preferredCurrency).toBe('GBP');
    expect((await migrated.app.settings()).schemaVersion).toBe(2);
    expect((await migrated.app.settings()).version).toBe(1);
    await migrated.app.saveRecordDraft({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Mom',
      personId: null,
      itemName: 'keys',
      amount: '',
      currency: 'GBP',
      dueOn: '',
      note: '',
    });
    expect((await migrated.app.recordDraft())?.itemName).toBe('keys');
    await migrated.store.close();
    indexedDB.deleteDatabase(dbName);
  });
});
