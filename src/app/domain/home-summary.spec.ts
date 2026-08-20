import { describe, expect, it } from 'vitest';
import { summarizeHome } from './home-summary';
import type { Loan } from './types';

function moneyLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: '01900000-0000-7000-8000-000000000001',
    direction: 'lent',
    assetKind: 'money',
    status: 'active',
    personId: 'p1',
    personNameSnapshot: 'Peter',
    occurredOn: '2026-08-01',
    dueOn: '2026-08-19',
    returnedOn: null,
    note: null,
    itemName: null,
    itemDescription: null,
    quantity: null,
    currencyCode: 'EUR',
    originalMinorUnits: 5000n,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    version: 1,
    deletedAt: null,
    ...overrides,
  };
}

describe('home action urgency', () => {
  it('classifies overdue money independently of translated copy', () => {
    const summary = summarizeHome(
      [moneyLoan(), moneyLoan({ id: 'open-money', dueOn: null })],
      new Map(),
      '2026-08-20',
      'en',
    );

    expect(summary.actions[0]).toMatchObject({
      loanId: '01900000-0000-7000-8000-000000000001',
      direction: 'lent',
      assetKind: 'money',
      urgency: 'overdue',
      dueOn: '2026-08-19',
      daysUntilDue: -1,
    });
    expect(summary.actions[1]).toMatchObject({
      loanId: 'open-money',
      urgency: 'open',
      daysUntilDue: null,
    });
  });

  it('carries exact day distance for tomorrow and the due-soon window', () => {
    const summary = summarizeHome(
      [
        moneyLoan({ id: 'tomorrow', dueOn: '2026-08-21' }),
        moneyLoan({ id: 'in-three-days', dueOn: '2026-08-23' }),
      ],
      new Map(),
      '2026-08-20',
      'en',
    );

    expect(summary.actions.find((action) => action.loanId === 'tomorrow')).toMatchObject({
      urgency: 'due_soon',
      daysUntilDue: 1,
    });
    expect(summary.actions.find((action) => action.loanId === 'in-three-days')).toMatchObject({
      urgency: 'due_soon',
      daysUntilDue: 3,
    });
  });
});
