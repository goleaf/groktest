# Data model

Local schema version **2**. Client-visible IDs are UUIDv7 generated on the device. Money is integer minor units (`bigint` in domain, decimal string in IndexedDB) and is capped at signed 64-bit maximum for future SQLite/SQL interoperability. Dates are calendar `YYYY-MM-DD`; instants are UTC ISO-8601.

## Implemented entities

### LocalSettings

Singleton installation preferences and identity.

| Field                    | Constraint / meaning                                    |
| ------------------------ | ------------------------------------------------------- |
| `id`                     | Always `local`                                          |
| `localIdentityId`        | UUIDv7 installation identity; not an account            |
| `preferredCurrency`      | Supported ISO 4217 code; affects only new money records |
| `schemaVersion`          | Migrated to current Dexie version                       |
| `version`                | Incremented on a user preference change                 |
| `createdAt`, `updatedAt` | Instants                                                |

Indexed by `id`. Settings changes enqueue one mutation. Deleting settings is not supported; clearing all site/app data deletes the installation.

### Person

A stable private counterparty, never assumed to be a Borrowed account.

| Field                     | Constraint / meaning                                |
| ------------------------- | --------------------------------------------------- |
| `id`                      | UUIDv7                                              |
| `displayName`             | Required, normalized whitespace, max 120 characters |
| `phone`, `email`, `notes` | Nullable; reserved, not collected by current UI     |
| `version`                 | Starts at 1                                         |
| `createdAt`, `updatedAt`  | Instants                                            |
| `deletedAt`               | Nullable tombstone                                  |

Indexes: `id`, `displayName`, `deletedAt`. Same-name people are allowed and never automatically merged. Selecting an existing person reuses its ID; typing creates a new Person. A later merge explicitly rewrites references and records an activity.

Deletion never cascades to loans. Every Loan keeps `personNameSnapshot`, so history remains understandable.

### Loan

One temporary transfer, physical or money. The kind discriminator keeps v1 simple without storing core searchable data in JSON.

| Field                                 | Constraint / meaning                                                  |
| ------------------------------------- | --------------------------------------------------------------------- |
| `id`                                  | UUIDv7                                                                |
| `direction`                           | `lent` or `borrowed`, always relative to the local user               |
| `assetKind`                           | `physical_item` or `money`                                            |
| `status`                              | Stored: `active`, `completed`, `cancelled`, `archived`                |
| `personId`                            | Stable Person reference                                               |
| `personNameSnapshot`                  | Historical display fallback                                           |
| `occurredOn`                          | Required calendar handoff date                                        |
| `dueOn`                               | Nullable calendar date; must be on/after `occurredOn`; not a reminder |
| `returnedOn`                          | Completion calendar date                                              |
| `note`                                | Nullable, max 4,000 characters                                        |
| `itemName`                            | Physical only, required, max 200 characters                           |
| `itemDescription`                     | Physical only, nullable, max 2,000 characters                         |
| `quantity`                            | Physical only, integer 1…1,000,000; defaults to 1                     |
| `currencyCode`                        | Money only, supported ISO 4217 code                                   |
| `originalMinorUnits`                  | Money only, positive and ≤ 9,223,372,036,854,775,807; immutable       |
| `version`                             | Incremented on lifecycle change                                       |
| `createdAt`, `updatedAt`, `deletedAt` | Sync instants/tombstone                                               |

Indexes: `id`, `personId`, `direction`, `assetKind`, `status`, `occurredOn`, `dueOn`, `deletedAt`.

Not stored: outstanding balance, partially repaid, overdue, due soon. Archive and completion remain different stored concepts.

### Repayment

Append-oriented money history and source of truth for outstanding balance.

| Field                    | Constraint / meaning                                       |
| ------------------------ | ---------------------------------------------------------- |
| `id`                     | UUIDv7                                                     |
| `loanId`                 | Money Loan reference                                       |
| `minorUnits`             | Positive, same currency, cannot exceed current outstanding |
| `currencyCode`           | Must equal Loan currency                                   |
| `occurredOn`             | Calendar date on/after Loan `occurredOn`                   |
| `note`                   | Nullable, max 4,000 characters                             |
| `version`                | Starts at 1                                                |
| `createdAt`, `deletedAt` | Instant/tombstone                                          |

Index: `loanId` plus primary `id` and `deletedAt`. Validation and write happen in the same transaction to prevent concurrent overpayment.

### LoanEvent

Human-readable activity, not full event sourcing.

Fields: UUIDv7 `id`, indexed `loanId`, semantic `type`, translation `summaryKey`, non-private interpolation parameters, `occurredAt`, `createdAt`. Implemented event writes are loan created, repayment added and item returned. Reserved types enable due-date/note/cancel/archive/reopen vertical slices later. Technical events such as “row updated” are never shown.

### SyncMutation

Durable v0 outbound queue. Fields: UUIDv7/idempotency `id`, `entityType`, `entityId`, `operation`, serialized payload, `createdAt`, nullable `ackedAt`, attempts and sanitized last error. Indexed by `id`, `ackedAt`, `createdAt`, `entityId`.

Committed Person/Loan/Repayment/Event/Settings changes enqueue atomically with their rows. Drafts are deliberately excluded.

### RecordDraft

Schema v2 device-only add-form recovery.

| Field                                               | Meaning                                |
| --------------------------------------------------- | -------------------------------------- |
| `id`                                                | Always `add-record`; at most one draft |
| direction/kind/person/item/amount/currency/due/note | Raw form values, not a committed Loan  |
| `updatedAt`                                         | Last local draft write                 |

Indexed only by `id`. It is overwritten after a short debounce, cleared for an empty form, and cleared after successful record persistence. It is not synced, shown in history or counted as active debt.

## Derived rules

| Concept          | Definition                                                           |
| ---------------- | -------------------------------------------------------------------- |
| Outstanding      | `originalMinorUnits - sum(valid, non-deleted repayments)`            |
| Partially repaid | money + active + at least one repayment + outstanding > 0            |
| Completed money  | outstanding = 0; completion date is final repayment date             |
| Completed item   | active physical Loan marked returned                                 |
| Overdue          | active + due date exists + `dueOn < today` in current local timezone |
| Due soon         | active + today ≤ dueOn ≤ today + central `DUE_SOON_DAYS` (3)         |

A date-only due date never becomes overdue because of UTC midnight conversion.

## Schema migrations

- v1: people, loans, repayments, events, mutations, settings.
- v2: adds drafts; upgrades settings `schemaVersion` and supplies settings `version = 1`.

Tests create a real v1 fake-IndexedDB database, open it with v2, and verify preferences and the new table. Mobile upgrades must use the same migration; reinstalling is not an upgrade strategy.

## Analyzed but intentionally absent

- Server User and Device: no account/backend yet; local identity remains separate.
- Asset table: two kinds fit one Loan without premature polymorphism; a later migration can extract assets.
- Reminder: requires scheduling semantics and permissions separate from due date.
- Attachment: requires independent local blob/upload lifecycle.
- Remote sync receipt/conflict tables: protocol exists, transport does not.
