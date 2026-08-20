# ADR 0005 — Money as integer minor units

## Context

Floating-point euros are a bug factory. Multiple currencies must not be summed.

## Decision

Store `currencyCode` (ISO 4217) plus `originalMinorUnits` as an integer (`bigint` in domain, decimal string in IndexedDB). Display uses the currency exponent (2 for EUR, 0 for JPY). Totals group by currency. No FX.

Allowed codes are an explicit map (extensible). Unknown codes are rejected.

## Alternatives

- Decimal.js: extra dependency for values a bigint already represents
- Always-two-decimals: wrong for JPY/KWD

## Consequences

Input is parsed from a decimal string, never from `parseFloat` as the stored value. UI grouping is mandatory wherever totals appear.
