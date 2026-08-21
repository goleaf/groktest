import type { CalendarDate } from './calendar-date';
import { groupOutstandingMoney } from './home-summary';
import { compareLoansByAttention, outstandingMinorUnits } from './loan-rules';
import type { Loan, MoneyTotal, Repayment } from './types';

export interface PersonRelationshipSummary {
  readonly activeLent: readonly Loan[];
  readonly activeBorrowed: readonly Loan[];
  readonly history: readonly Loan[];
  readonly lentItemCount: number;
  readonly borrowedItemCount: number;
  readonly owedToMe: readonly MoneyTotal[];
  readonly iOwe: readonly MoneyTotal[];
  readonly remainingMinorUnitsByLoan: ReadonlyMap<string, bigint>;
}

function physicalQuantity(loans: readonly Loan[]): number {
  return loans.reduce(
    (total, loan) => total + (loan.assetKind === 'physical_item' ? (loan.quantity ?? 0) : 0),
    0,
  );
}

export function summarizePersonRelationships(
  loans: readonly Loan[],
  repaymentsByLoan: ReadonlyMap<string, readonly Repayment[]>,
  today: CalendarDate,
): PersonRelationshipSummary {
  const visible = loans.filter((loan) => loan.deletedAt === null);
  const active = visible
    .filter((loan) => loan.status === 'active')
    .sort((left, right) => compareLoansByAttention(left, right, today));
  const activeLent = active.filter((loan) => loan.direction === 'lent');
  const activeBorrowed = active.filter((loan) => loan.direction === 'borrowed');
  const remainingMinorUnitsByLoan = new Map<string, bigint>();

  for (const loan of active) {
    if (loan.assetKind === 'money') {
      remainingMinorUnitsByLoan.set(
        loan.id,
        outstandingMinorUnits(loan, repaymentsByLoan.get(loan.id) ?? []),
      );
    }
  }

  return {
    activeLent,
    activeBorrowed,
    history: visible
      .filter((loan) => loan.status === 'completed')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    lentItemCount: physicalQuantity(activeLent),
    borrowedItemCount: physicalQuantity(activeBorrowed),
    owedToMe: groupOutstandingMoney(active, repaymentsByLoan, 'lent'),
    iOwe: groupOutstandingMoney(active, repaymentsByLoan, 'borrowed'),
    remainingMinorUnitsByLoan,
  };
}
