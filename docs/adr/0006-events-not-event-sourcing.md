# ADR 0006 — Append-only history, not event sourcing

## Context

Users need a readable timeline. Full event sourcing would make outstanding-balance reconstruction the only source of truth and slow down simple queries.

## Decision

Current loan state is stored on `Loan`. Repayments are separate rows. `LoanEvent` is a parallel, insert-only log for display. The core is not replayed from events.

## Alternatives

- Event sourcing: heavier, easier to get money wrong in v1
- Overwrite the loan amount: forbidden by the product

## Consequences

Two writes on repay (repayment + event + maybe loan status). History can be rebuilt for the UI from events without using events as the ledger. The ledger for money is original amount + repayments.
