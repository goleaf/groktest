import { formatMinorUnits } from '../domain/money';
import type { Loan, Repayment } from '../domain/types';
import { outstandingMinorUnits } from '../domain/loan-rules';

export function formatCalendarDate(date: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return date;
  }
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(utc),
  );
}

export function formatLoanTitle(loan: Loan, locale: string): string {
  if (loan.assetKind === 'physical_item') {
    return loan.itemName ?? '';
  }
  if (loan.currencyCode && loan.originalMinorUnits !== null) {
    return formatMinorUnits(loan.originalMinorUnits, loan.currencyCode, locale);
  }
  return '';
}

export function formatRemaining(
  loan: Loan,
  repayments: readonly Repayment[],
  locale: string,
): string | null {
  if (loan.assetKind !== 'money' || !loan.currencyCode) {
    return null;
  }
  return formatMinorUnits(outstandingMinorUnits(loan, repayments), loan.currencyCode, locale);
}

export function localeOf(): string {
  return typeof navigator === 'undefined' ? 'en' : navigator.language;
}
