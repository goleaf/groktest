import { DomainError } from './errors';

/** ISO 4217 alphabetic codes supported in v1, with minor-unit exponents. */
export const CURRENCY_EXPONENTS = {
  AUD: 2,
  BGN: 2,
  CAD: 2,
  CHF: 2,
  CZK: 2,
  DKK: 2,
  EUR: 2,
  GBP: 2,
  HUF: 2,
  INR: 2,
  JPY: 0,
  NOK: 2,
  NZD: 2,
  PLN: 2,
  RON: 2,
  SEK: 2,
  USD: 2,
} as const;

export type CurrencyCode = keyof typeof CURRENCY_EXPONENTS;

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCY_EXPONENTS, value);
}

export function requireCurrency(value: string): CurrencyCode {
  if (!isCurrencyCode(value)) {
    throw new DomainError('currency_invalid');
  }
  return value;
}

export function exponentFor(currency: CurrencyCode): number {
  return CURRENCY_EXPONENTS[currency];
}

export function parseAmountToMinorUnits(raw: string, currency: string): bigint {
  const code = requireCurrency(currency);
  const trimmed = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new DomainError('amount_not_positive');
  }
  const [whole, fraction = ''] = trimmed.split('.');
  const exponent = exponentFor(code);
  if (fraction.length > exponent) {
    throw new DomainError('amount_scale_invalid');
  }
  const padded = fraction.padEnd(exponent, '0');
  const minor = BigInt(whole) * 10n ** BigInt(exponent) + BigInt(padded || '0');
  if (minor <= 0n) {
    throw new DomainError('amount_not_positive');
  }
  return minor;
}

export function formatMinorUnits(minorUnits: bigint, currency: string, locale: string): string {
  const code = requireCurrency(currency);
  const exponent = exponentFor(code);
  const asNumber = Number(minorUnits) / 10 ** exponent;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(asNumber);
}

export function sumMinorUnits(values: readonly bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n);
}
