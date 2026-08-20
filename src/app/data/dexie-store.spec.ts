import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
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

  it('schema initialize is idempotent (migration no-op on v1)', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const first = await session(dbName);
    await first.app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Mom',
      itemName: 'keys',
    });
    await first.store.close();
    const second = await session(dbName);
    expect((await second.app.activeLoans('lent'))[0]?.itemName).toBe('keys');
    expect((await second.app.settings()).schemaVersion).toBe(1);
    await second.store.close();
    indexedDB.deleteDatabase(dbName);
  });
});
