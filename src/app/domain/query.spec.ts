import { describe, expect, it } from 'vitest';
import type { Loan } from './types';
import { matchesFilter, matchesQuery, visibleLoans } from './query';

function loan(overrides: Partial<Loan>): Loan {
  return {
    id: '1',
    direction: 'lent',
    assetKind: 'physical_item',
    status: 'active',
    personId: 'p',
    personNameSnapshot: 'Peter',
    occurredOn: '2026-08-01',
    dueOn: '2026-08-18',
    returnedOn: null,
    note: 'kitchen shelves',
    itemName: 'cordless drill',
    itemDescription: null,
    quantity: 1,
    currencyCode: null,
    originalMinorUnits: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1,
    deletedAt: null,
    ...overrides,
  };
}

describe('search', () => {
  it('matches person, item, note, and ignores extra spaces', () => {
    const drill = loan({});
    expect(matchesQuery(drill, 'peter drill')).toBe(true);
    expect(matchesQuery(drill, '  SHELVES ')).toBe(true);
    expect(matchesQuery(drill, 'ladder')).toBe(false);
    expect(matchesQuery(drill, '')).toBe(true);
  });

  it('matches money by currency', () => {
    const cash = loan({
      assetKind: 'money',
      itemName: null,
      currencyCode: 'EUR',
      originalMinorUnits: 5000n,
    });
    expect(matchesQuery(cash, 'eur')).toBe(true);
    expect(matchesQuery(cash, 'usd')).toBe(false);
  });
});

describe('filters', () => {
  it('separates items, money, overdue and due soon', () => {
    const drill = loan({});
    const cash = loan({
      id: '2',
      assetKind: 'money',
      itemName: null,
      dueOn: '2026-08-21',
      currencyCode: 'EUR',
      originalMinorUnits: 100n,
    });
    expect(matchesFilter(drill, 'items', '2026-08-20')).toBe(true);
    expect(matchesFilter(drill, 'money', '2026-08-20')).toBe(false);
    expect(matchesFilter(drill, 'overdue', '2026-08-20')).toBe(true);
    expect(matchesFilter(cash, 'due_soon', '2026-08-20')).toBe(true);
    expect(visibleLoans([drill, cash], 'peter', 'money', '2026-08-20')).toEqual([cash]);
  });
});
