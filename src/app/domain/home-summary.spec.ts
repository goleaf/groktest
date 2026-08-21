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
      personName: 'Peter',
      subject: '€50.00',
    });
    expect(summary.actions[1]).toMatchObject({
      loanId: 'open-money',
      urgency: 'open',
      daysUntilDue: null,
    });
  });

  it('summarizes the busiest people and preserves both handoff directions', () => {
    const summary = summarizeHome(
      [
        moneyLoan(),
        moneyLoan({ id: 'borrowed', direction: 'borrowed' }),
        moneyLoan({ id: 'anna', personId: 'p2', personNameSnapshot: 'Anna' }),
      ],
      new Map(),
      '2026-08-20',
      'en',
    );

    expect(summary.recentPeople).toEqual([
      {
        personId: 'p1',
        personName: 'Peter',
        activeCount: 2,
        lentCount: 1,
        borrowedCount: 1,
      },
      {
        personId: 'p2',
        personName: 'Anna',
        activeCount: 1,
        lentCount: 1,
        borrowedCount: 0,
      },
    ]);
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

  it('bounds attention and due-next rows without duplicating or showing overdue deadlines', () => {
    const loans = Array.from({ length: 12 }, (_, index) =>
      moneyLoan({
        id: `loan-${index}`,
        dueOn: index < 2 ? `2026-08-${String(18 + index).padStart(2, '0')}` : `2026-09-${String(index).padStart(2, '0')}`,
      }),
    );

    const summary = summarizeHome(loans, new Map(), '2026-08-20', 'en');
    const actionIds = new Set(summary.actions.map((action) => action.loanId));

    expect(summary.actions).toHaveLength(5);
    expect(summary.dueNext).toHaveLength(4);
    expect(summary.dueNext.every((action) => action.urgency !== 'overdue')).toBe(true);
    expect(summary.dueNext.every((action) => !actionIds.has(action.loanId))).toBe(true);
    expect(summary.dueNext.map((action) => action.dueOn)).toEqual([
      '2026-09-05',
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
    ]);
  });
});
