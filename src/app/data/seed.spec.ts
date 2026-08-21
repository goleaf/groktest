import 'fake-indexeddb/auto';
import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import type { DomainClock } from '../domain/commands';
import { outstandingMinorUnits } from '../domain/loan-rules';
import type { Loan } from '../domain/types';
import { BorrowedApp } from './borrowed-app';
import { DexieBorrowedStore } from './dexie-store';
import { seedDemoIfEmpty } from './seed';

const clock: DomainClock = {
  now: () => new Date('2026-08-20T12:00:00.000Z'),
  timeZone: () => 'UTC',
};

function groupByLoanId<T extends { loanId: string }>(rows: readonly T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    grouped.set(row.loanId, [...(grouped.get(row.loanId) ?? []), row]);
  }
  return grouped;
}

describe('demo seed', () => {
  it('fills an empty database with 100 fully related and varied loans', async () => {
    const dbName = `borrowed-seed-${crypto.randomUUID()}`;
    const store = new DexieBorrowedStore(dbName);
    const app = new BorrowedApp(store, clock);
    await app.initialize();
    await seedDemoIfEmpty(app, clock);

    const loans = await store.listLoans();
    const people = await store.listPeople();
    const repayments = await store.listRepayments();
    const mutations = await store.listPendingMutations();
    const events = (await Promise.all(loans.map(async (loan) => store.listEvents(loan.id)))).flat();
    const home = await app.home();

    expect(loans).toHaveLength(100);
    expect(people).toHaveLength(24);
    expect(new Set(loans.map((loan) => loan.direction))).toEqual(new Set(['lent', 'borrowed']));
    expect(new Set(loans.map((loan) => loan.assetKind))).toEqual(
      new Set(['physical_item', 'money']),
    );
    expect(new Set(loans.map((loan) => loan.status))).toEqual(new Set(['active', 'completed']));
    expect(
      new Set(loans.flatMap((loan) => (loan.currencyCode === null ? [] : [loan.currencyCode]))),
    ).toEqual(new Set(['EUR', 'USD', 'GBP']));
    expect(home.overdueCount).toBeGreaterThan(0);
    expect(home.dueSoonCount).toBeGreaterThan(0);
    expect(home.actions[0]?.params['person']).toBeTruthy();

    const peopleIds = new Set(people.map((person) => person.id));
    const loansById = new Map(loans.map((loan) => [loan.id, loan]));
    const repaymentsByLoan = groupByLoanId(repayments);
    const eventsByLoan = groupByLoanId(events);

    for (const loan of loans) {
      expect(peopleIds.has(loan.personId)).toBe(true);
      expect(eventsByLoan.get(loan.id)?.some((event) => event.type === 'loan_created')).toBe(true);
    }
    for (const person of people) {
      const directions = new Set(
        loans.filter((loan) => loan.personId === person.id).map((loan) => loan.direction),
      );
      expect(directions).toEqual(new Set(['lent', 'borrowed']));
    }
    for (const repayment of repayments) {
      expect(loansById.get(repayment.loanId)?.assetKind).toBe('money');
    }

    const activeMoney = loans.filter(
      (loan): loan is Loan & { originalMinorUnits: bigint } =>
        loan.assetKind === 'money' && loan.status === 'active' && loan.originalMinorUnits !== null,
    );
    expect(
      activeMoney.some((loan) => {
        const related = repaymentsByLoan.get(loan.id) ?? [];
        const outstanding = outstandingMinorUnits(loan, related);
        return related.length > 0 && outstanding > 0n && outstanding < loan.originalMinorUnits;
      }),
    ).toBe(true);
    expect([...repaymentsByLoan.values()].some((related) => related.length > 1)).toBe(true);
    expect(loans.some((loan) => loan.assetKind === 'money' && loan.status === 'completed')).toBe(
      true,
    );
    expect(events.some((event) => event.type === 'item_returned')).toBe(true);
    expect(events.some((event) => event.type === 'due_date_changed')).toBe(true);

    const entityIds = {
      person: peopleIds,
      loan: new Set(loans.map((loan) => loan.id)),
      repayment: new Set(repayments.map((repayment) => repayment.id)),
      loan_event: new Set(events.map((event) => event.id)),
    } as const;
    for (const mutation of mutations) {
      if (mutation.entityType === 'settings') {
        continue;
      }
      expect(entityIds[mutation.entityType].has(mutation.entityId)).toBe(true);
    }
    expect(await store.getRecordDraft()).toBeUndefined();

    await seedDemoIfEmpty(app, clock);
    expect(await store.listLoans()).toHaveLength(100);
    expect(await store.listPeople()).toHaveLength(24);

    const json = await app.exportJson();
    expect(json).toContain('"app": "borrowed"');
    expect(json).toContain('Cordless drill');
    const found = await app.search('drill');
    expect(found.some((item) => item.itemName === 'Cordless drill')).toBe(true);

    await store.close();
    indexedDB.deleteDatabase(dbName);
  });
});
