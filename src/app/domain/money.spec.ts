import { describe, expect, it } from 'vitest';
import { DomainError } from './errors';
import { formatMinorUnits, parseAmountToMinorUnits } from './money';

describe('money', () => {
  it('parses EUR to minor units without floats as storage', () => {
    expect(parseAmountToMinorUnits('50', 'EUR')).toBe(5000n);
    expect(parseAmountToMinorUnits('50.50', 'EUR')).toBe(5050n);
    expect(parseAmountToMinorUnits('0.01', 'EUR')).toBe(1n);
  });

  it('parses JPY with zero exponent', () => {
    expect(parseAmountToMinorUnits('50', 'JPY')).toBe(50n);
  });

  it('rejects non-positive amounts', () => {
    expect(() => parseAmountToMinorUnits('0', 'EUR')).toThrow(DomainError);
    expect(() => parseAmountToMinorUnits('-5', 'EUR')).toThrow(DomainError);
    expect(() => parseAmountToMinorUnits('abc', 'EUR')).toThrow(DomainError);
  });

  it('rejects unknown currencies and too many fraction digits', () => {
    expect(() => parseAmountToMinorUnits('10', 'XXX')).toThrow(DomainError);
    expect(() => parseAmountToMinorUnits('1.234', 'EUR')).toThrow(DomainError);
    expect(() => parseAmountToMinorUnits('1.5', 'JPY')).toThrow(DomainError);
  });

  it('rejects values that cannot fit the portable signed 64-bit storage boundary', () => {
    expect(parseAmountToMinorUnits('92233720368547758.07', 'EUR')).toBe(9_223_372_036_854_775_807n);
    expect(() => parseAmountToMinorUnits('92233720368547758.08', 'EUR')).toThrow(DomainError);
  });

  it('formats with the locale and does not mix currencies', () => {
    expect(formatMinorUnits(4000n, 'EUR', 'en-IE')).toMatch(/40/);
    expect(formatMinorUnits(4000n, 'EUR', 'en-IE')).toMatch(/€|EUR/);
  });

  it('formats large values without converting them through an unsafe number', () => {
    const formatted = formatMinorUnits(9_223_372_036_854_775_807n, 'EUR', 'en-IE');
    expect(formatted).toContain('92,233,720,368,547,758.07');
  });
});
