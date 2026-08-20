# ADR 0008: Transactional loan updates and device-local drafts

## Context

Repayment validation originally read the Loan and repayment list before opening the write transaction. Concurrent tabs could validate against the same balance. The Add form also disappeared on reload, while autosaving a partial form as an active Loan would corrupt product semantics.

## Decision

- `BorrowedStore.updateLoan()` owns read → domain validation → Loan/Event/Repayment writes → mutation enqueue inside one IndexedDB read-write transaction.
- Schema v2 adds one `RecordDraft` row with raw Add-form values.
- Drafts are local, debounced, excluded from sync/totals/history and cleared after a successful committed record.
- A real v1→v2 Dexie upgrade updates settings schema/version without deleting records.

## Alternatives considered

- UI mutex: does not protect multiple tabs/processes.
- Editable outstanding balance: loses repayment history and permits drift.
- Persist incomplete Loan rows: makes drafts look like real obligations.
- No draft: violates mobile background/reload resilience.

## Consequences

Money invariants hold at the persistence boundary and are integration-tested under concurrent calls. Store implementations must provide equivalent transactional behavior. Draft values are sensitive local data and must be included in clear-device semantics but not remote export/sync by default.
