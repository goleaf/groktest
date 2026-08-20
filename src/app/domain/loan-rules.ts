import { addCalendarDays, compareCalendarDates, isDueSoonOn, isOverdueOn } from './calendar-date';
import type { CalendarDate } from './calendar-date';
import { DUE_SOON_DAYS } from './config';
import { DomainError } from './errors';
import { sumMinorUnits } from './money';
import type { Loan, Repayment } from './types';

export function activeRepayments(repayments: readonly Repayment[]): Repayment[] {
    return repayments.filter((repayment) => repayment.deletedAt === null);
}

export function outstandingMinorUnits(loan: Loan, repayments: readonly Repayment[]): bigint {
    if (loan.assetKind !== 'money' || loan.originalMinorUnits === null) {
        throw new DomainError('not_money_loan');
    }
    const paid = sumMinorUnits(activeRepayments(repayments).map((repayment) => repayment.minorUnits));
    return loan.originalMinorUnits - paid;
}

export function isPartiallyRepaid(loan: Loan, repayments: readonly Repayment[]): boolean {
    if (loan.assetKind !== 'money' || loan.status !== 'active') {
        return false;
    }
    const remaining = outstandingMinorUnits(loan, repayments);
    return remaining > 0n && activeRepayments(repayments).length > 0;
}

export function isMoneyCompleted(loan: Loan, repayments: readonly Repayment[]): boolean {
    return loan.assetKind === 'money' && outstandingMinorUnits(loan, repayments) === 0n;
}

export function isLoanOverdue(loan: Loan, today: CalendarDate): boolean {
    return loan.status === 'active' && loan.deletedAt === null && isOverdueOn(loan.dueOn, today);
}

export function isLoanDueSoon(loan: Loan, today: CalendarDate): boolean {
    return (
        loan.status === 'active' &&
        loan.deletedAt === null &&
        isDueSoonOn(loan.dueOn, today, DUE_SOON_DAYS)
    );
}

export function urgencyRank(loan: Loan, today: CalendarDate): number {
    if (isLoanOverdue(loan, today)) {
        return 0;
    }
    if (isLoanDueSoon(loan, today) && loan.dueOn) {
        return 1 + Math.max(0, compareCalendarDates(loan.dueOn, today));
    }
    if (loan.dueOn) {
        return 10 + compareCalendarDates(loan.dueOn, addCalendarDays(today, 30));
    }
    return 100;
}

export function assertCanRepay(
    loan: Loan,
    repayments: readonly Repayment[],
    minorUnits: bigint,
    currencyCode: string,
): void {
    if (loan.assetKind !== 'money' || loan.currencyCode === null) {
        throw new DomainError('not_money_loan');
    }
    if (loan.status !== 'active' || loan.deletedAt !== null) {
        throw new DomainError('loan_not_active');
    }
    if (currencyCode !== loan.currencyCode) {
        throw new DomainError('currency_mismatch');
    }
    if (minorUnits <= 0n) {
        throw new DomainError('amount_not_positive');
    }
    const remaining = outstandingMinorUnits(loan, repayments);
    if (minorUnits > remaining) {
        throw new DomainError('over_repayment');
    }
}
