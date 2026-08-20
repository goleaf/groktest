import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { outstandingMinorUnits } from '../domain/loan-rules';
import { BorrowedApp } from './borrowed-app';
import { DexieBorrowedStore } from './dexie-store';
import { seedDemoIfEmpty } from './seed';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

describe('demo seed', () => {
  it('fills an empty database with lent, borrowed, money, overdue and history', async () => {
    const dbName = `borrowed-seed-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const app = new BorrowedApp(store, clock);
    await app.initialize();
    await seedDemoIfEmpty(app, clock);

    const lent = await app.activeLoans('lent');
    const borrowed = await app.activeLoans('borrowed');
    const everyActive = await (
      app.activeLoans as (direction?: 'lent' | 'borrowed') => ReturnType<BorrowedApp['activeLoans']>
    )();
    const history = await app.history();
    const home = await app.home();

    expect(lent.length).toBeGreaterThanOrEqual(3);
    expect(borrowed.length).toBeGreaterThanOrEqual(3);
    expect(everyActive).toHaveLength(lent.length + borrowed.length);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(home.overdueCount).toBeGreaterThan(0);
    expect(home.actions[0]?.params['person']).toBeTruthy();

    const peterCash = lent.find(
      (loan) => loan.assetKind === 'money' && loan.personNameSnapshot === 'Peter',
    );
    expect(peterCash).toBeTruthy();
    if (peterCash) {
      const peterDrill = lent.find(
        (loan) => loan.assetKind === 'physical_item' && loan.personNameSnapshot === 'Peter',
      );
      expect(peterDrill?.personId).toBe(peterCash.personId);
      const remaining = outstandingMinorUnits(
        peterCash,
        (await app.loanDetail(peterCash.id))?.repayments ?? [],
      );
      expect(remaining).toBe(3000n);
      expect(peterCash.originalMinorUnits).toBe(5000n);
    }

    await seedDemoIfEmpty(app, clock);
    expect((await app.activeLoans('lent')).length).toBe(lent.length);

    const json = await app.exportJson();
    expect(json).toContain('"app": "borrowed"');
    expect(json).toContain('cordless drill');
    const found = await app.search('drill');
    expect(found.some((item) => item.itemName === 'cordless drill')).toBe(true);

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });
});
