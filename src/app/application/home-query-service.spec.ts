import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { DexieBorrowedStore } from '../data/dexie-store';
import { CurrentDayService } from './current-day-service';
import { HomeQueryService } from './home-query-service';
import { RecordsCommandService } from './records-command-service';
import { SettingsService } from './settings-service';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'Europe/Vilnius',
};

describe('HomeQueryService', () => {
  it('returns a raw summary with one loan read and one active-repayment read', async () => {
    const dbName = `borrowed-home-query-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const settings = new SettingsService(store, clock);
    const commands = new RecordsCommandService(store, clock, settings);
    const queries = new HomeQueryService(store, new CurrentDayService(clock));

    try {
      await settings.initialize();
      const money = await commands.createRecord({
        direction: 'lent',
        kind: 'money',
        personName: 'Peter',
        amount: '100',
        currency: 'EUR',
      });
      await commands.addRepayment(money.id, '25', 'EUR');
      const loanReads = vi.spyOn(store, 'listLoans');
      const repaymentReads = vi.spyOn(store, 'listRepayments');
      const batchedReads = vi.spyOn(store, 'listRepaymentsForLoanIds');

      const summary = await queries.home();

      expect(summary.moneyOwedToMe).toEqual([{ currencyCode: 'EUR', minorUnits: 7500n }]);
      expect(summary.actions.find((action) => action.loanId === money.id)).toMatchObject({
        assetKind: 'money',
        money: { currencyCode: 'EUR', minorUnits: 7500n },
      });
      expect(summary.actions[0]).not.toHaveProperty('subject');
      expect(summary.actions[0]).not.toHaveProperty('params');
      expect(loanReads).toHaveBeenCalledTimes(1);
      expect(repaymentReads).toHaveBeenCalledExactlyOnceWith();
      expect(batchedReads).not.toHaveBeenCalled();
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });
});
