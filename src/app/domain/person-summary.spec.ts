import { describe, expect, it } from 'vitest';
import { summarizePersonRelationships } from './person-summary';
import type { Loan, Repayment } from './types';

function loan(id: string, overrides: Partial<Loan> = {}): Loan {
  return {
    id,
    direction: 'lent',
    assetKind: 'physical_item',
    status: 'active',
    personId: 'person-andrei',
    personNameSnapshot: 'Andrei',
    occurredOn: '2026-08-01',
    dueOn: null,
    returnedOn: null,
    note: null,
    itemName: 'drill',
    itemDescription: null,
    quantity: 1,
    currencyCode: null,
    originalMinorUnits: null,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    version: 1,
    deletedAt: null,
    ...overrides,
  };
}

function repayment(loanId: string, minorUnits: bigint): Repayment {
  return {
    id: `repayment-${loanId}`,
    loanId,
    minorUnits,
    currencyCode: 'EUR',
    occurredOn: '2026-08-10',
    note: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    version: 1,
    deletedAt: null,
  };
}

describe('person relationship summary', () => {
  it('answers both item directions and both outstanding money directions', () => {
    const loans = [
      loan('lent-item', { dueOn: '2026-08-19' }),
      loan('borrowed-item', {
        direction: 'borrowed',
        itemName: 'ladder',
      }),
      loan('lent-money', {
        assetKind: 'money',
        itemName: null,
        quantity: null,
        currencyCode: 'EUR',
        originalMinorUnits: 10000n,
      }),
      loan('borrowed-money', {
        direction: 'borrowed',
        assetKind: 'money',
        itemName: null,
        quantity: null,
        currencyCode: 'GBP',
        originalMinorUnits: 2500n,
      }),
    ];
    const repayments = new Map<string, readonly Repayment[]>([
      ['lent-money', [repayment('lent-money', 3000n)]],
    ]);

    const summary = summarizePersonRelationships(loans, repayments, '2026-08-20');

    expect(summary.lentItemCount).toBe(1);
    expect(summary.borrowedItemCount).toBe(1);
    expect(summary.owedToMe).toEqual([{ currencyCode: 'EUR', minorUnits: 7000n }]);
    expect(summary.iOwe).toEqual([{ currencyCode: 'GBP', minorUnits: 2500n }]);
    expect(summary.activeLent.map((item) => item.id)).toEqual(['lent-item', 'lent-money']);
    expect(summary.activeBorrowed.map((item) => item.id)).toEqual([
      'borrowed-item',
      'borrowed-money',
    ]);
  });

  it('keeps completed records in recent history and excludes deleted records', () => {
    const summary = summarizePersonRelationships(
      [
        loan('older-history', {
          status: 'completed',
          returnedOn: '2026-08-05',
          updatedAt: '2026-08-05T10:00:00.000Z',
        }),
        loan('newer-history', {
          status: 'completed',
          returnedOn: '2026-08-15',
          updatedAt: '2026-08-15T10:00:00.000Z',
        }),
        loan('deleted', { deletedAt: '2026-08-18T10:00:00.000Z' }),
      ],
      new Map(),
      '2026-08-20',
    );

    expect(summary.activeLent).toEqual([]);
    expect(summary.history.map((item) => item.id)).toEqual(['newer-history', 'older-history']);
  });

  it('groups each currency independently', () => {
    const summary = summarizePersonRelationships(
      [
        loan('eur', {
          assetKind: 'money',
          itemName: null,
          quantity: null,
          currencyCode: 'EUR',
          originalMinorUnits: 5000n,
        }),
        loan('gbp', {
          assetKind: 'money',
          itemName: null,
          quantity: null,
          currencyCode: 'GBP',
          originalMinorUnits: 2000n,
        }),
      ],
      new Map(),
      '2026-08-20',
    );

    expect(summary.owedToMe).toEqual([
      { currencyCode: 'EUR', minorUnits: 5000n },
      { currencyCode: 'GBP', minorUnits: 2000n },
    ]);
  });
});
