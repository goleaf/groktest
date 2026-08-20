import type { Loan } from '../domain/types';
import type { IconName } from './icon';

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
