import { describe, expect, it } from 'vitest';
import type { Loan } from '../domain/types';
import { iconForAction, iconForLoan } from './icon-for';

function loan(overrides: Partial<Loan>): Loan {
  return {
    id: '1',
    direction: 'lent',
    assetKind: 'physical_item',
    status: 'active',
    personId: 'p',
    personNameSnapshot: 'Peter',
    occurredOn: '2026-08-20',
    dueOn: null,
    returnedOn: null,
    note: null,
    itemName: 'drill',
    itemDescription: null,
    quantity: 1,
    currencyCode: null,
    originalMinorUnits: null,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    version: 1,
    deletedAt: null,
    ...overrides,
  };
}

describe('icon mapping', () => {
  it('uses money icon for money loans and direction icons for items', () => {
    expect(iconForLoan(loan({}))).toBe('lent');
    expect(iconForLoan(loan({ direction: 'borrowed' }))).toBe('borrowed');
    expect(
      iconForLoan(loan({ assetKind: 'money', currencyCode: 'EUR', originalMinorUnits: 1n })),
    ).toBe('money');
  });

  it('maps home action keys without losing direction', () => {
    expect(iconForAction('home.action.lentItemOverdue')).toBe('lent');
    expect(iconForAction('home.action.borrowedItem')).toBe('borrowed');
    expect(iconForAction('home.action.lentMoney')).toBe('money');
    expect(iconForAction('home.action.borrowedMoney')).toBe('money');
  });
});
