import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { outstandingMinorUnits } from '../domain/loan-rules';
import { BorrowedApp } from '../data/borrowed-app';
import { DexieBorrowedStore } from '../data/dexie-store';
import { RecordsCommandService } from './records-command-service';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

async function commandSession(): Promise<{
  dbName: string;
  store: DexieBorrowedStore;
  commands: RecordsCommandService;
}> {
  const dbName = `borrowed-command-test-${crypto.randomUUID()}`;
  const store = new DexieBorrowedStore(dbName);
  await store.initialize(clock);
  return { dbName, store, commands: new RecordsCommandService(store, clock) };
}

describe('RecordsCommandService', () => {
  it('preserves create, due-date, return and repayment behavior at the transactional store boundary', async () => {
    const { dbName, store, commands } = await commandSession();
    const putLoanBundle = vi.spyOn(store, 'putLoanBundle');
    const updateLoan = vi.spyOn(store, 'updateLoan');

    try {
      const item = await commands.createRecord({
        direction: 'lent',
        kind: 'physical_item',
        personName: '  Peter  ',
        itemName: 'drill',
        occurredOn: '2026-08-19',
      });
      const rescheduled = await commands.changeDueDate(item.id, '2026-08-30');
      const returned = await commands.markReturned(item.id);
      const money = await commands.createRecord({
        direction: 'borrowed',
        kind: 'money',
        personName: 'Anna',
        amount: '100',
      });
      const repaid = await commands.addRepayment(money.id, '25');
      const moneyRecord = await store.loadLoanRecord(money.id);

      expect(item.personNameSnapshot).toBe('Peter');
      expect(rescheduled.dueOn).toBe('2026-08-30');
      expect(returned.status).toBe('completed');
      expect(money.currencyCode).toBe('EUR');
      expect(repaid.status).toBe('active');
      expect(outstandingMinorUnits(repaid, moneyRecord?.repayments ?? [])).toBe(7500n);
      expect(putLoanBundle).toHaveBeenCalledTimes(2);
      expect(updateLoan).toHaveBeenCalledTimes(3);

      await expect(
        commands.createRecord({
          direction: 'lent',
          kind: 'physical_item',
          personName: 'Ignored snapshot',
          personId: 'missing-person',
          itemName: 'keys',
        }),
      ).rejects.toMatchObject({ code: 'person_missing' });
      expect(putLoanBundle).toHaveBeenCalledTimes(2);
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });

  it('keeps BorrowedApp as a compatible delegate and invalidates only successful mutations', async () => {
    const { dbName, store, commands } = await commandSession();
    const createRecord = vi.spyOn(commands, 'createRecord');
    const changeDueDate = vi.spyOn(commands, 'changeDueDate');
    const markReturned = vi.spyOn(commands, 'markReturned');
    const addRepayment = vi.spyOn(commands, 'addRepayment');
    const app = new BorrowedApp(store, clock, commands);

    try {
      const revisionBefore = app.revision();
      const itemInput = {
        direction: 'lent' as const,
        kind: 'physical_item' as const,
        personName: 'Peter',
        itemName: 'drill',
        occurredOn: '2026-08-19',
      };
      const item = await app.createRecord(itemInput);
      await app.changeDueDate(item.id, '2026-08-30');
      await app.markReturned(item.id);
      const money = await app.createRecord({
        direction: 'lent',
        kind: 'money',
        personName: 'Anna',
        amount: '100',
        currency: 'EUR',
      });
      await app.repay(money.id, '25', 'EUR');

      expect(createRecord).toHaveBeenNthCalledWith(1, itemInput);
      expect(changeDueDate).toHaveBeenCalledWith(item.id, '2026-08-30');
      expect(markReturned).toHaveBeenCalledWith(item.id);
      expect(addRepayment).toHaveBeenCalledWith(money.id, '25', 'EUR');
      expect(app.revision()).toBe(revisionBefore + 5);

      const revisionBeforeFailure = app.revision();
      await expect(app.markReturned(money.id)).rejects.toMatchObject({
        code: 'not_physical_loan',
      });
      expect(app.revision()).toBe(revisionBeforeFailure);
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });
});
