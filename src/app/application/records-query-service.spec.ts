import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { DexieBorrowedStore } from '../data/dexie-store';
import { CurrentDayService } from './current-day-service';
import { RecordsCommandService } from './records-command-service';
import { RecordsQueryService } from './records-query-service';
import { SettingsService } from './settings-service';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'Europe/Vilnius',
};

describe('RecordsQueryService', () => {
  it('owns active, history, detail, search and synchronous record filtering reads', async () => {
    const dbName = `borrowed-records-query-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const settings = new SettingsService(store, clock);
    const commands = new RecordsCommandService(store, clock, settings);
    const queries = new RecordsQueryService(store, new CurrentDayService(clock));

    try {
      await settings.initialize();
      const later = await commands.createRecord({
        direction: 'borrowed',
        kind: 'physical_item',
        personName: 'Anna',
        itemName: 'ladder',
        dueOn: '2026-08-25',
      });
      const overdue = await commands.createRecord({
        direction: 'lent',
        kind: 'physical_item',
        personName: 'Peter',
        itemName: 'drill',
        occurredOn: '2026-08-01',
        dueOn: '2026-08-18',
      });
      await commands.markReturned(later.id);

      expect((await queries.activeLoans()).map((loan) => loan.id)).toEqual([overdue.id]);
      expect((await queries.history()).map((loan) => loan.id)).toEqual([later.id]);
      expect((await queries.search('peter drill')).map((loan) => loan.id)).toEqual([overdue.id]);
      expect((await queries.loanDetail(overdue.id))?.person.displayName).toBe('Peter');
      expect(queries.filterLoans([overdue], 'drill', 'overdue')).toEqual([overdue]);
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });

  it('uses one bounded repayment read for a visible set and one loan read for a single balance', async () => {
    const dbName = `borrowed-records-query-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const settings = new SettingsService(store, clock);
    const commands = new RecordsCommandService(store, clock, settings);
    const queries = new RecordsQueryService(store, new CurrentDayService(clock));

    try {
      await settings.initialize();
      const money = await commands.createRecord({
        direction: 'lent',
        kind: 'money',
        personName: 'Peter',
        amount: '100',
        currency: 'EUR',
      });
      const item = await commands.createRecord({
        direction: 'lent',
        kind: 'physical_item',
        personName: 'Anna',
        itemName: 'drill',
      });
      await commands.addRepayment(money.id, '25', 'EUR');
      const singleReads = vi.spyOn(store, 'listRepayments');
      const batchedReads = vi.spyOn(store, 'listRepaymentsForLoanIds');

      const remaining = await queries.remainingMap([money, item]);

      expect(remaining.get(money.id)).toBe(7500n);
      expect(remaining.get(item.id)).toBeNull();
      expect(batchedReads).toHaveBeenCalledExactlyOnceWith([money.id]);
      expect(singleReads).not.toHaveBeenCalled();

      expect(await queries.remainingFor(money)).toBe(7500n);
      expect(singleReads).toHaveBeenCalledExactlyOnceWith(money.id);
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });
});
