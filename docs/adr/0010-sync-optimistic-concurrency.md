# ADR 0010: Sync uses idempotent mutations and optimistic concurrency

## Context

Offline devices can modify the same Loan independently. Timestamp last-write-wins can lose notes, due dates or repayments, and device clocks are not trustworthy enough to decide ownership.

## Decision

Future protocol v1 uses client UUIDv7 IDs, mutation idempotency receipts, entity `baseVersion`/`version`, explicit changed fields and an account-scoped change cursor. Disjoint scalar fields may merge; same-field conflicts are returned for domain/user resolution. Repayments/events append by stable ID, money principal is immutable, and the server recomputes outstanding balance while rejecting an overpaying concurrent repayment as needs-attention.

Part 1 implements only the durable v0 queue and record versions. It does not pretend to sync.

## Alternatives considered

- Whole-record timestamp last-write-wins: silently discards valid data.
- Full event sourcing: too much infrastructure for the product and current lifecycle.
- CRDTs for every entity: complexity without demonstrated collaborative editing.
- Server-issued IDs: blocks offline creation.

## Consequences

The future API must store mutation receipts, entity versions and change cursors. Some rare conflicts need clear UX. Offline creation/retry remains simple, append-only money history stays auditable, and older clients need an explicit protocol compatibility window.
