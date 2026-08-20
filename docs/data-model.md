# Data model

Local schema version **1**. All client-visible IDs are UUIDv7 strings generated on the device.

Money is stored as **integer minor units** (string in IndexedDB, `bigint` in domain). Never as floating point.

Calendar days (`occurredOn`, `dueOn`, `returnedOn`) are `YYYY-MM-DD`. Instants (`createdAt`, `updatedAt`) are UTC ISO-8601.

## Entities

### LocalSettings (singleton)

Why: preferred currency and local identity must not live on every loan.

| Field | Notes |
|---|---|
| `id` | Always `local` |
| `localIdentityId` | UUIDv7 for this installation |
| `preferredCurrency` | ISO 4217, default `EUR`. Changing it does not rewrite old loans |
| `schemaVersion` | Mirrors Dexie version |
| `createdAt`, `updatedAt` | Instants |

### Person

Why: a loan needs a stable counterparty who is **not** a registered user.

| Field | Notes |
|---|---|
| `id` | UUIDv7 |
| `displayName` | Required, trimmed, non-empty |
| `phone`, `email`, `notes` | Optional, unused in Part 1 UI |
| `version` | Increments on edit |
| `deletedAt` | Tombstone. Historical loans keep `personNameSnapshot` |

Indexes: `id`, `displayName`, `deletedAt`.

Deletion: a person may be tombstoned later. Loans are **not** cascade-deleted. The snapshot name remains on the loan.

No auto-merge of similar names. IDs stay stable if a name changes.

### Loan

Why: one record for one transfer. Physical and money share a table with a kind discriminator so lists/search stay simple. This is not a JSON blob: searchable fields are columns.

| Field | Notes |
|---|---|
| `id` | UUIDv7 |
| `direction` | `lent` \| `borrowed` |
| `assetKind` | `physical_item` \| `money` |
| `status` | Stored: `active` \| `completed` \| `cancelled` \| `archived` |
| `personId` | FK to Person |
| `personNameSnapshot` | Name at write time; history stays readable if the person is renamed or removed |
| `occurredOn` | Calendar date of the lend/borrow |
| `dueOn` | Optional calendar date. Not a reminder |
| `returnedOn` | Calendar date when completed |
| `note` | Optional |
| `itemName`, `itemDescription`, `quantity` | Physical only. Quantity defaults to 1, integer > 0 |
| `currencyCode`, `originalMinorUnits` | Money only. Original amount never changes |
| `version`, `createdAt`, `updatedAt`, `deletedAt` | Sync-friendly |

Indexes: `id`, `personId`, `direction`, `assetKind`, `status`, `occurredOn`, `dueOn`, `deletedAt`.

**Not stored:** overdue, due soon, remaining amount, partially repaid.

### Repayment

Why: money history must be append-only.

| Field | Notes |
|---|---|
| `id` | UUIDv7 |
| `loanId` | FK |
| `minorUnits` | Positive integer |
| `currencyCode` | Must match the loan |
| `occurredOn` | Calendar date |
| `note` | Optional |
| `version`, `createdAt`, `deletedAt` | |

Outstanding = original − sum of non-deleted repayments. Never stored.

Over-repayment is rejected. Full repayment sets loan `status = completed` and `returnedOn`.

### LoanEvent

Why: the details screen needs a human history, not an event-sourced core.

| Field | Notes |
|---|---|
| `id` | UUIDv7 |
| `loanId` | FK |
| `type` | `loan_created`, `repayment_added`, `item_returned`, `due_date_changed`, `note_changed`, `loan_cancelled`, `loan_archived`, `loan_reopened` |
| `summaryKey` | i18n key |
| `summaryParams` | Interpolation map (person, item, amount, dates) |
| `occurredAt`, `createdAt` | Instants |

Events are insert-only in v1. Do not log “row updated” technical noise.

### SyncMutation

Why: every local write is already a sync-ready operation.

| Field | Notes |
|---|---|
| `id` | UUIDv7, also the idempotency key |
| `entityType` | `person` \| `loan` \| `repayment` \| `loan_event` \| `settings` |
| `entityId` | |
| `operation` | `upsert` \| `delete` |
| `payloadJson` | Serialized entity at enqueue time |
| `createdAt` | |
| `ackedAt` | Null until a future server acknowledges |
| `attempts`, `lastError` | Retry bookkeeping |

## Derived rules

| Concept | Rule |
|---|---|
| Outstanding | `originalMinorUnits - sum(repayment.minorUnits)` |
| Partially repaid | money + active + outstanding > 0 + at least one repayment |
| Completed (money) | outstanding = 0 |
| Completed (item) | user marked returned |
| Overdue | active, `dueOn` set, `dueOn` < today in the user’s calendar |
| Due soon | active, `dueOn` set, not overdue, `dueOn` ≤ today + `DUE_SOON_DAYS` (3) |
| Archived | stored, hides from default history without deleting |

Due dates use **calendar dates in the user’s current timezone**. A due date of 20 Aug is not overdue on 20 Aug. It becomes overdue on 21 Aug local.

## Intentionally absent in v1

User (server), Device, Reminder, Attachment, Asset table. Loans can grow an `assetKind` without splitting tables on day one. If an Asset table is needed later, migrate `itemName` / money fields into it (`docs/roadmap.md`).
