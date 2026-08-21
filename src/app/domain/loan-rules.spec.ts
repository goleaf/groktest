import { describe, expect, it } from 'vitest';
import { DomainError } from './errors';
import {
  compareLoansByAttention,
  isLoanDueSoon,
  isLoanOverdue,
  outstandingMinorUnits,
  repaidMinorUnits,
} from './loan-rules';
import type { Loan, Repayment } from './types';

function moneyLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: '01900000-0000-7000-8000-000000000001',
    direction: 'lent',
    assetKind: 'money',
    status: 'active',
    personId: 'p1',
    personNameSnapshot: 'Peter',
    occurredOn: '2026-08-01',
    dueOn: '2026-08-20',
    returnedOn: null,
    note: null,
    itemName: null,
    itemDescription: null,
    quantity: null,
    currencyCode: 'EUR',
    originalMinorUnits: 50000n,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    version: 1,
    deletedAt: null,
    ...overrides,
  };
}

function repayment(minorUnits: bigint, id: string): Repayment {
  return {
    id,
    loanId: '01900000-0000-7000-8000-000000000001',
    minorUnits,
    currencyCode: 'EUR',
    occurredOn: '2026-08-10',
    note: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    version: 1,
    deletedAt: null,
  };
}

describe('outstanding balance', () => {
  it('is original minus repayments and does not mutate the original', () => {
    const loan = moneyLoan();
    const remaining = outstandingMinorUnits(loan, [
      repayment(10000n, 'r1'),
      repayment(5000n, 'r2'),
    ]);
    expect(remaining).toBe(35000n);
    expect(loan.originalMinorUnits).toBe(50000n);
  });

  it('ignores deleted repayments', () => {
    const gone = { ...repayment(10000n, 'r1'), deletedAt: '2026-08-11T00:00:00.000Z' };
    expect(outstandingMinorUnits(moneyLoan(), [gone])).toBe(50000n);
  });

  it('sums returned money from append-only active repayments', () => {
    const loan = moneyLoan({ originalMinorUnits: 10000n });
    const gone = { ...repayment(2000n, 'r3'), deletedAt: '2026-08-11T00:00:00.000Z' };

    expect(repaidMinorUnits(loan, [repayment(2000n, 'r1'), repayment(1000n, 'r2'), gone])).toBe(
      3000n,
    );
    expect(loan.originalMinorUnits).toBe(10000n);
  });
});

describe('overdue and due soon', () => {
  it('uses calendar-date semantics', () => {
    const loan = moneyLoan({ dueOn: '2026-08-20' });
    expect(isLoanOverdue(loan, '2026-08-20')).toBe(false);
    expect(isLoanOverdue(loan, '2026-08-21')).toBe(true);
    expect(isLoanDueSoon(loan, '2026-08-20')).toBe(true);
    expect(isLoanOverdue({ ...loan, status: 'completed' }, '2026-08-21')).toBe(false);
    expect(isLoanOverdue(moneyLoan({ dueOn: null }), '2026-08-21')).toBe(false);
  });
});

describe('attention ordering', () => {
  const today = '2026-08-20' as const;

  it('orders active records by urgency and nearest relevant date', () => {
    const records = [
      moneyLoan({ id: 'future', dueOn: '2026-09-01' }),
      moneyLoan({ id: 'tomorrow', dueOn: '2026-08-21' }),
      moneyLoan({ id: 'old-overdue', dueOn: '2026-08-10' }),
      moneyLoan({ id: 'new-overdue', dueOn: '2026-08-19' }),
      moneyLoan({ id: 'undated', dueOn: null }),
    ];

    expect(
      [...records].sort((a, b) => compareLoansByAttention(a, b, today)).map(({ id }) => id),
    ).toEqual(['old-overdue', 'new-overdue', 'tomorrow', 'future', 'undated']);
  });

  it('puts active before completed and uses updatedAt then id as stable tie breakers', () => {
    const records = [
      moneyLoan({ id: 'b', dueOn: null, updatedAt: '2026-08-18T10:00:00.000Z' }),
      moneyLoan({ id: 'a', dueOn: null, updatedAt: '2026-08-18T10:00:00.000Z' }),
      moneyLoan({
        id: 'completed-old-due',
        status: 'completed',
        dueOn: '2026-01-01',
        updatedAt: '2026-08-21T10:00:00.000Z',
      }),
    ];

    expect(
      [...records].sort((a, b) => compareLoansByAttention(a, b, today)).map(({ id }) => id),
    ).toEqual(['a', 'b', 'completed-old-due']);
  });
});

describe('guards', () => {
  it('refuses outstanding on a physical loan', () => {
    const item = moneyLoan({
      assetKind: 'physical_item',
      originalMinorUnits: null,
      currencyCode: null,
      itemName: 'Drill',
      quantity: 1,
    });
    expect(() => outstandingMinorUnits(item, [])).toThrow(DomainError);
    expect(() => repaidMinorUnits(item, [])).toThrow(DomainError);
  });
});
