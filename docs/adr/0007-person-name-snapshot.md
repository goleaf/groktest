# ADR 0007 — Snapshot person names on loans

## Context

People are not registered users. They get renamed or removed. History must still say “You lent Peter a drill”.

## Decision

Each loan stores `personId` and `personNameSnapshot`. Snapshot updates when the user edits that loan’s person assignment, not when they rename the person globally (rename can update snapshot on active loans only if we add that later; v1 rename is unused).

Deleting a person tombstones the person row. Loans stay.

## Alternatives

- Join-only display name: history breaks
- Cascade delete loans: unacceptable

## Consequences

Slight denormalization. Search by current name may miss old snapshot spellings; that is acceptable.
