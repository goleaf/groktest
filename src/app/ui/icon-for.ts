import type { Loan } from '../domain/types';
import type { ListFilter } from '../domain/query';
import type { IconName } from './icon';

export type LoanScope = 'all' | 'lent' | 'borrowed';

const SCOPE_ICONS: Readonly<Record<LoanScope, IconName>> = {
  all: 'records',
  lent: 'lent',
  borrowed: 'borrowed',
};

const FILTER_ICONS: Readonly<Record<ListFilter, IconName>> = {
  all: 'all',
  items: 'item',
  money: 'money',
  overdue: 'overdue',
  due_soon: 'clock',
};

export function iconForLoan(loan: Loan): IconName {
  if (loan.assetKind === 'money') {
    return 'money';
  }
  return loan.direction === 'lent' ? 'lent' : 'borrowed';
}

export function iconForAction(messageKey: string): IconName {
  if (messageKey.includes('Money')) {
    return 'money';
  }
  if (messageKey.includes('borrowed')) {
    return 'borrowed';
  }
  return 'lent';
}

export function iconForScope(scope: LoanScope): IconName {
  return SCOPE_ICONS[scope];
}

export function iconForFilter(filter: ListFilter): IconName {
  return FILTER_ICONS[filter];
}
