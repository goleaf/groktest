import { calendarDaysBetween, type CalendarDate } from './calendar-date';
import { formatMinorUnits } from './money';
import { isLoanDueSoon, isLoanOverdue, outstandingMinorUnits, urgencyRank } from './loan-rules';
import type { HomeAction, HomeSummary, Loan, MoneyTotal, Repayment } from './types';

export function groupOutstandingMoney(
  loans: readonly Loan[],
  repaymentsByLoan: ReadonlyMap<string, readonly Repayment[]>,
  direction: 'lent' | 'borrowed',
): MoneyTotal[] {
  const totals = new Map<string, bigint>();
  for (const loan of loans) {
    if (loan.assetKind !== 'money' || loan.status !== 'active' || loan.direction !== direction) {
      continue;
    }
    if (!loan.currencyCode || loan.originalMinorUnits === null) {
      continue;
    }
    const remaining = outstandingMinorUnits(loan, repaymentsByLoan.get(loan.id) ?? []);
    if (remaining <= 0n) {
      continue;
    }
    totals.set(loan.currencyCode, (totals.get(loan.currencyCode) ?? 0n) + remaining);
  }
  return [...totals.entries()].map(([currencyCode, minorUnits]) => ({
    currencyCode: currencyCode as MoneyTotal['currencyCode'],
    minorUnits,
  }));
}

function actionFor(
  loan: Loan,
  today: CalendarDate,
  repayments: readonly Repayment[],
  locale: string,
): HomeAction {
  const overdue = isLoanOverdue(loan, today);
  const urgency: HomeAction['urgency'] = overdue
    ? 'overdue'
    : isLoanDueSoon(loan, today)
      ? 'due_soon'
      : 'open';
  if (loan.assetKind === 'physical_item') {
    const key =
      loan.direction === 'lent'
        ? overdue
          ? 'home.action.lentItemOverdue'
          : 'home.action.lentItem'
        : overdue
          ? 'home.action.borrowedItemOverdue'
          : 'home.action.borrowedItem';
    return {
      loanId: loan.id,
      direction: loan.direction,
      assetKind: loan.assetKind,
      personName: loan.personNameSnapshot,
      subject: loan.itemName ?? '',
      urgency,
      dueOn: loan.dueOn,
      daysUntilDue: loan.dueOn ? calendarDaysBetween(today, loan.dueOn) : null,
      messageKey: key,
      params: { person: loan.personNameSnapshot, item: loan.itemName ?? '' },
    };
  }
  const remaining = outstandingMinorUnits(loan, repayments);
  const amount = loan.currencyCode ? formatMinorUnits(remaining, loan.currencyCode, locale) : '';
  const key = loan.direction === 'lent' ? 'home.action.lentMoney' : 'home.action.borrowedMoney';
  return {
    loanId: loan.id,
    direction: loan.direction,
    assetKind: loan.assetKind,
    personName: loan.personNameSnapshot,
    subject: amount,
    urgency,
    dueOn: loan.dueOn,
    daysUntilDue: loan.dueOn ? calendarDaysBetween(today, loan.dueOn) : null,
    messageKey: key,
    params: { person: loan.personNameSnapshot, amount },
  };
}

export function summarizeHome(
  loans: readonly Loan[],
  repaymentsByLoan: ReadonlyMap<string, readonly Repayment[]>,
  today: CalendarDate,
  locale: string,
): HomeSummary {
  const visible = loans.filter((loan) => loan.deletedAt === null);
  const active = visible.filter((loan) => loan.status === 'active');
  const ranked = [...active].sort(
    (left, right) => urgencyRank(left, today) - urgencyRank(right, today),
  );
  const actions = ranked
    .slice(0, 5)
    .map((loan) => actionFor(loan, today, repaymentsByLoan.get(loan.id) ?? [], locale));
  const actionIds = new Set(actions.map((action) => action.loanId));
  const dueNext = active
    .filter(
      (loan) =>
        loan.dueOn !== null && !isLoanOverdue(loan, today) && !actionIds.has(loan.id),
    )
    .sort(
      (left, right) =>
        (left.dueOn ?? '').localeCompare(right.dueOn ?? '') ||
        left.updatedAt.localeCompare(right.updatedAt),
    )
    .slice(0, 4)
    .map((loan) => actionFor(loan, today, repaymentsByLoan.get(loan.id) ?? [], locale));
  const people = new Map<
    string,
    {
      personId: string;
      personName: string;
      activeCount: number;
      lentCount: number;
      borrowedCount: number;
    }
  >();
  for (const loan of active) {
    const current = people.get(loan.personId) ?? {
      personId: loan.personId,
      personName: loan.personNameSnapshot,
      activeCount: 0,
      lentCount: 0,
      borrowedCount: 0,
    };
    current.activeCount += 1;
    current[loan.direction === 'lent' ? 'lentCount' : 'borrowedCount'] += 1;
    people.set(loan.personId, current);
  }
  return {
    activeLentCount: active.filter((loan) => loan.direction === 'lent').length,
    activeBorrowedCount: active.filter((loan) => loan.direction === 'borrowed').length,
    moneyOwedToMe: groupOutstandingMoney(active, repaymentsByLoan, 'lent'),
    moneyIOwe: groupOutstandingMoney(active, repaymentsByLoan, 'borrowed'),
    overdueCount: active.filter((loan) => isLoanOverdue(loan, today)).length,
    dueSoonCount: active.filter((loan) => isLoanDueSoon(loan, today)).length,
    actions,
    dueNext,
    recentPeople: [...people.values()]
      .sort(
        (left, right) =>
          right.activeCount - left.activeCount || left.personName.localeCompare(right.personName),
      )
      .slice(0, 5),
  };
}
