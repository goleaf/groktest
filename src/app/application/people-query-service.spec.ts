import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { DexieBorrowedStore } from '../data/dexie-store';
import { CurrentDayService } from './current-day-service';
import { PeopleQueryService } from './people-query-service';
import { RecordsCommandService } from './records-command-service';
import { SettingsService } from './settings-service';

describe('PeopleQueryService', () => {
  it('owns recent people, count projections and bounded person overview reads', async () => {
    const dbName = `borrowed-people-query-${crypto.randomUUID()}`;
    let now = new Date('2026-08-20T10:00:00.000Z');
    const clock: DomainClock = {
      now: () => now,
      timeZone: () => 'Europe/Vilnius',
    };
    const store = new DexieBorrowedStore(dbName);
    const settings = new SettingsService(store, clock);
    const commands = new RecordsCommandService(store, clock, settings);
    const queries = new PeopleQueryService(store, new CurrentDayService(clock));

    try {
      await settings.initialize();
      const peter = await commands.createRecord({
        direction: 'lent',
        kind: 'money',
        personName: 'Peter',
        amount: '100',
        currency: 'EUR',
      });
      await commands.addRepayment(peter.id, '25', 'EUR');
      now = new Date('2026-08-20T11:00:00.000Z');
      const anna = await commands.createRecord({
        direction: 'borrowed',
        kind: 'physical_item',
        personName: 'Anna',
        itemName: 'ladder',
      });

      expect((await queries.people()).map((person) => person.displayName)).toEqual([
        'Anna',
        'Peter',
      ]);
      expect(await queries.peopleWithCounts()).toMatchObject([
        { person: { id: anna.personId }, activeCount: 1, borrowedActiveCount: 1 },
        { person: { id: peter.personId }, activeCount: 1, lentActiveCount: 1 },
      ]);
      expect((await queries.loansForPerson(peter.personId)).map((loan) => loan.id)).toEqual([
        peter.id,
      ]);

      const allLoans = vi.spyOn(store, 'listLoans');
      const allRepayments = vi.spyOn(store, 'listRepayments');
      const personLoans = vi.spyOn(store, 'listLoansForPerson');
      const personRepayments = vi.spyOn(store, 'listRepaymentsForLoanIds');
      const overview = await queries.personOverview(peter.personId);

      expect(overview.person?.displayName).toBe('Peter');
      expect(overview.owedToMe).toEqual([{ currencyCode: 'EUR', minorUnits: 7500n }]);
      expect(overview.remainingMinorUnitsByLoan.get(peter.id)).toBe(7500n);
      expect(personLoans).toHaveBeenCalledExactlyOnceWith(peter.personId);
      expect(personRepayments).toHaveBeenCalledExactlyOnceWith([peter.id]);
      expect(allLoans).not.toHaveBeenCalled();
      expect(allRepayments).not.toHaveBeenCalled();
    } finally {
      await store.close();
      indexedDB.deleteDatabase(dbName);
    }
  });
});
