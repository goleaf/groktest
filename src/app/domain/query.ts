import type { CalendarDate } from './calendar-date';
import { isLoanDueSoon, isLoanOverdue } from './loan-rules';
import type { Loan } from './types';

export type ListFilter = 'all' | 'items' | 'money' | 'overdue' | 'due_soon';

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function loanSearchText(loan: Loan): string {
  const amount = loan.originalMinorUnits !== null ? loan.originalMinorUnits.toString() : '';
  return [loan.personNameSnapshot, loan.itemName, loan.note, loan.currencyCode, amount]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase();
}

export function matchesQuery(loan: Loan, query: string): boolean {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return true;
  }
  const haystack = loanSearchText(loan);
  return normalized.split(' ').every((part) => haystack.includes(part));
}

export function matchesFilter(loan: Loan, filter: ListFilter, today: CalendarDate): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'items':
      return loan.assetKind === 'physical_item';
    case 'money':
      return loan.assetKind === 'money';
    case 'overdue':
      return isLoanOverdue(loan, today);
    case 'due_soon':
      return isLoanDueSoon(loan, today);
    default:
      return true;
  }
}

export function visibleLoans(
  loans: readonly Loan[],
  query: string,
  filter: ListFilter,
  today: CalendarDate,
): Loan[] {
  return loans.filter((loan) => matchesFilter(loan, filter, today) && matchesQuery(loan, query));
}
