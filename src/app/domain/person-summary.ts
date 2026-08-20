import type { CalendarDate } from './calendar-date';
import { groupOutstandingMoney } from './home-summary';
import { outstandingMinorUnits, urgencyRank } from './loan-rules';
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

export function summarizePersonRelationships(
  loans: readonly Loan[],
  repaymentsByLoan: ReadonlyMap<string, readonly Repayment[]>,
  today: CalendarDate,
): PersonRelationshipSummary {
  const visible = loans.filter((loan) => loan.deletedAt === null);
  const active = visible
    .filter((loan) => loan.status === 'active')
    .sort((left, right) => urgencyRank(left, today) - urgencyRank(right, today));
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
    lentItemCount: activeLent.filter((loan) => loan.assetKind === 'physical_item').length,
    borrowedItemCount: activeBorrowed.filter((loan) => loan.assetKind === 'physical_item').length,
    owedToMe: groupOutstandingMoney(active, repaymentsByLoan, 'lent'),
    iOwe: groupOutstandingMoney(active, repaymentsByLoan, 'borrowed'),
    remainingMinorUnitsByLoan,
  };
}
