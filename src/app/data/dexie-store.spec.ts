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

async function session(
  name: string,
  sessionClock: DomainClock = clock,
): Promise<{ app: BorrowedApp; store: DexieBorrowedStore }> {
  const store = new DexieBorrowedStore(name);
  const app = new BorrowedApp(store, sessionClock);
  await app.initialize();
  return { app, store };
}

describe('local persistence', () => {
  it('updates relative due state when the local calendar day changes without editing a loan', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    let now = new Date('2026-08-20T12:00:00.000Z');
    const movingClock: DomainClock = { now: () => now, timeZone: () => 'UTC' };
    const { app, store } = await session(dbName, movingClock);
    const loan = await app.createRecord({
      direction: 'lent',
      kind: 'money',
      personName: 'Sergey',
      amount: '200',
      currency: 'EUR',
      dueOn: '2026-08-21',
    });

    expect(app.daysUntilDue(loan)).toBe(1);
    now = new Date('2026-08-21T12:00:00.000Z');
    app.refreshCurrentDay();
    expect(app.daysUntilDue(loan)).toBe(0);
    now = new Date('2026-08-22T12:00:00.000Z');
    app.refreshCurrentDay();
    expect(app.daysUntilDue(loan)).toBe(-1);

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

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

  it('keeps active records ahead of completed records in search ordering', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const active = await app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Anna',
      itemName: 'drill',
    });
    const completed = await app.createRecord({
      direction: 'borrowed',
      kind: 'physical_item',
      personName: 'Peter',
      itemName: 'ladder',
      occurredOn: '2026-08-01',
      dueOn: '2026-08-02',
    });
    await app.markReturned(completed.id);

    expect((await app.search('')).map((loan) => loan.id)).toEqual([active.id, completed.id]);

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('reads active and completed loans through bounded status queries', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const lent = await app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Anna',
      itemName: 'drill',
    });
    const borrowed = await app.createRecord({
      direction: 'borrowed',
      kind: 'physical_item',
      personName: 'Peter',
      itemName: 'ladder',
    });
    await app.markReturned(borrowed.id);
    const deleted = await app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Sergey',
      itemName: 'book',
    });
    const deletedRecord = await app.loanDetail(deleted.id);
    expect(deletedRecord).toBeTruthy();
    if (deletedRecord) {
      await store.putLoanBundle({
        person: deletedRecord.person,
        loan: { ...deletedRecord.loan, deletedAt: '2026-08-20T13:00:00.000Z' },
        event: deletedRecord.events[0]!,
        clock,
      });
    }

    expect((await store.listActiveLoans()).map((loan) => loan.id)).toEqual([lent.id]);
    expect((await store.listActiveLoans('borrowed')).map((loan) => loan.id)).toEqual([]);
    expect((await store.listCompletedLoans()).map((loan) => loan.id)).toEqual([borrowed.id]);

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('moves a deadline offline and keeps the change and activity after reload', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const first = await session(dbName);
    const loan = await first.app.createRecord({
      direction: 'lent',
      kind: 'money',
      personName: 'Sergey',
      amount: '200',
      currency: 'EUR',
      occurredOn: '2026-08-20',
      dueOn: '2026-09-01',
    });
    const mutationsBeforeChange = await first.app.pendingMutations();

    await first.app.changeDueDate(loan.id, '2026-09-05');

    const changed = await first.app.loanDetail(loan.id);
    expect(changed?.loan.dueOn).toBe('2026-09-05');
    expect(changed?.loan.status).toBe('active');
    expect(changed?.events.at(-1)).toMatchObject({
      type: 'due_date_changed',
      summaryParams: { date: '2026-09-05' },
    });
    expect(await first.app.pendingMutations()).toHaveLength(mutationsBeforeChange.length + 2);
    await first.store.close();

    const reloaded = await session(dbName);
    const persisted = await reloaded.app.loanDetail(loan.id);
    expect(persisted?.loan.dueOn).toBe('2026-09-05');
    expect(persisted?.events.at(-1)?.type).toBe('due_date_changed');
    await reloaded.store.close();
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

  it('keeps every relationship with one selected person in one reload-safe overview', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const first = await session(dbName);
    const drill = await first.app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Andrei',
      itemName: 'drill',
    });
    const money = await first.app.createRecord({
      direction: 'lent',
      kind: 'money',
      personId: drill.personId,
      personName: 'Andrei',
      amount: '100',
      currency: 'EUR',
    });
    await first.app.repay(money.id, '30', 'EUR');
    await first.app.createRecord({
      direction: 'borrowed',
      kind: 'physical_item',
      personId: drill.personId,
      personName: 'Andrei',
      itemName: 'ladder',
    });
    await first.app.markReturned(drill.id);
    await first.store.close();

    const reloaded = await session(dbName);
    const overview = await reloaded.app.personOverview(drill.personId, 'en-GB');

    expect(overview.person?.displayName).toBe('Andrei');
    expect(overview.activeLent.map((loan) => loan.id)).toEqual([money.id]);
    expect(overview.activeBorrowed.map((loan) => loan.itemName)).toEqual(['ladder']);
    expect(overview.lentItemCount).toBe(0);
    expect(overview.borrowedItemCount).toBe(1);
    expect(overview.owedToMe).toEqual([{ currencyCode: 'EUR', minorUnits: 7000n }]);
    expect(overview.iOwe).toEqual([]);
    expect(overview.history.map((loan) => loan.id)).toEqual([drill.id]);
    expect(overview.remainingByLoan.get(money.id)).toContain('70');
    await reloaded.store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('loads a person overview through indexed, bounded store reads', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const loan = await app.createRecord({
      direction: 'lent',
      kind: 'money',
      personName: 'Andrei',
      amount: '50',
      currency: 'EUR',
    });
    const listAllLoans = vi.spyOn(store, 'listLoans');
    const listAllRepayments = vi.spyOn(store, 'listRepayments');
    const personLoans = vi.spyOn(store, 'listLoansForPerson');
    const personRepayments = vi.spyOn(store, 'listRepaymentsForLoanIds');

    await app.personOverview(loan.personId, 'en-GB');

    expect(personLoans).toHaveBeenCalledExactlyOnceWith(loan.personId);
    expect(personRepayments).toHaveBeenCalledExactlyOnceWith([loan.id]);
    expect(listAllLoans).not.toHaveBeenCalled();
    expect(listAllRepayments).not.toHaveBeenCalled();
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

  it('loads repayments only for visible money loans in one bounded query', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const lentMoney = await app.createRecord({
      direction: 'lent',
      kind: 'money',
      personName: 'Peter',
      amount: '100',
      currency: 'EUR',
    });
    const borrowedMoney = await app.createRecord({
      direction: 'borrowed',
      kind: 'money',
      personName: 'Anna',
      amount: '50',
      currency: 'EUR',
    });
    await app.createRecord({
      direction: 'lent',
      kind: 'physical_item',
      personName: 'Sergey',
      itemName: 'drill',
    });
    const repaymentQueries = vi.spyOn(store, 'listRepayments');
    await app.home();
    expect(repaymentQueries).toHaveBeenCalledTimes(1);

    repaymentQueries.mockClear();
    const boundedRepaymentQueries = vi.spyOn(store, 'listRepaymentsForLoanIds');
    await app.remainingMap(await app.activeLoans());
    expect(boundedRepaymentQueries).toHaveBeenCalledExactlyOnceWith([
      lentMoney.id,
      borrowedMoney.id,
    ]);
    expect(repaymentQueries).not.toHaveBeenCalled();
    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('queues settings changes but keeps form drafts local to the device', async () => {
    const dbName = `borrowed-test-${crypto.randomUUID()}`;
    const { app, store } = await session(dbName);
    const initialMutations = await app.pendingMutations();
    await app.setPreferredCurrency('GBP');
    await app.setPreferredLanguage('ru');
    expect((await app.settings()).preferredLanguage).toBe('ru');
    expect(await app.pendingMutations()).toHaveLength(initialMutations.length + 2);

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
    expect(await app.pendingMutations()).toHaveLength(initialMutations.length + 2);
    await app.clearRecordDraft();
    expect(await app.recordDraft()).toBeUndefined();
    await store.close();
    indexedDB.deleteDatabase(dbName);
  });

  it('migrates an existing v1 database to v3 and adds the default language', async () => {
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
    expect((await migrated.app.settings()).preferredLanguage).toBe('en');
    expect((await migrated.app.settings()).schemaVersion).toBe(3);
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
