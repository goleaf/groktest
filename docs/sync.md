# Synchronization design

Part 1 implements protocol **v0**: stable IDs, record versions, tombstone fields and a durable outbound mutation queue. It intentionally does not contact a server. This document defines the compatible future v1 protocol.

## Invariants

- Every core action commits locally first and works offline.
- IDs are generated on the client as UUIDv7; the server accepts them.
- Retrying the same mutation cannot create a second entity, repayment or event.
- Money source facts are never merged through editable balances or “last request wins”.
- Important user-entered values are never silently discarded.
- A failed sync never rolls back the local user action or its attachment-independent Loan.

## Identity

`localIdentityId` identifies one installation. A future authenticated account owns one or more registered Devices. Person remains a private address-book-like entity and is not replaced by account identity. Linking a local installation to an account uploads through sync; it does not rewrite client IDs.

## v0 mutation queue (implemented)

One transaction writes domain rows, semantic event and mutations. Each mutation has:

- `id`: UUIDv7 and idempotency key;
- `entityType` + `entityId`;
- `operation`: upsert/delete;
- payload snapshot;
- `createdAt`, `ackedAt`, `attempts`, sanitized `lastError`.

Drafts never enter the queue. Pending mutations sort by `createdAt` (and ID as stable tie-breaker). No current process drains or acknowledges them.

## Proposed v1 API exchange

`POST /api/v1/sync/batches` over HTTPS:

```text
request:  protocolVersion, deviceId, cursor, mutations[]
mutation: id, entityType, entityId, operation, baseVersion, version, changedFields, payload
response: acknowledgedMutationIds[], remoteChanges[], nextCursor, conflicts[]
```

Authentication identifies the account; entity IDs never authorize access. The server stores a unique `(account_id, mutation_id)` receipt and returns the same acknowledgement for a retry. Batch processing is transactional where practical and response cursors advance only past durable changes.

The client marks `ackedAt` only after persisting the acknowledgement and remote changes. A crash before that point safely retries the same IDs. Backoff has jitter and a ceiling; manual retry remains available.

## Conflict detection and merge

This is optimistic concurrency, not naive timestamp overwrite.

1. Create with an unknown ID is accepted at version 1.
2. Update includes `baseVersion`, new `version`, and explicit changed fields.
3. If server version equals base, apply and increment.
4. If versions differ, compare field sets since base.
5. Disjoint scalar changes may merge automatically and produce a new server version.
6. Same-field changes become a conflict unless a domain-specific rule below resolves them without data loss.

`updatedAt` orders activity for display and retry diagnostics; device clocks do not decide which same-field value wins.

### Domain-specific rules

- Repayment and LoanEvent are append-only by stable ID. Distinct IDs are both retained; duplicate IDs are idempotent.
- Original money amount/currency/direction/asset kind are immutable after create. A conflicting mutation is rejected.
- Server recomputes outstanding from accepted repayments. If concurrent repayments would overpay, the repayment that cannot be accepted is returned as `needs_attention`; it is not silently deleted or allowed to make balance negative.
- Completion is derived from accepted repayment facts for money. For physical items, completion is a versioned lifecycle transition; a concurrent note/due change may merge, but completed→active requires an explicit later reopen operation.
- Person display-name conflicts preserve both candidate values in conflict metadata; no auto-merge of Person IDs.

Conflict UI shows the record and the two competing values in ordinary language. The mutation remains recoverable until the user chooses or edits a value.

## Deletes and tombstones

Delete writes a tombstone with a version; it is not physical purge. Changes made against a tombstoned entity conflict and require recovery/restore semantics. Tombstones remain until every registered device cursor has passed them plus a documented retention period. Deleting a Person does not erase Loan snapshots.

## Multiple devices and ordering

The server change log has a monotonic account-scoped cursor. Clients can upload and pull in one batch, apply remote changes in a local transaction, then advance the cursor. Per-entity versions provide causality; UUIDv7/time is not a substitute for it.

## Attachments

Future attachment metadata participates in sync, but binary upload has its own resumable queue and checksum. A locally created Loan is visible immediately. Offline/failed image upload leaves an independently retryable attachment and never deletes or blocks the Loan.

## Backup versus sync

- Sync converges current state across devices and may propagate deletion.
- Backup/export is a point-in-time user-controlled recovery artifact.

JSON export exists locally. Remote backup, restore verification and retention are future work.

## User-facing state

| Technical state                       | Copy            |
| ------------------------------------- | --------------- |
| Local-only installation               | On this device  |
| Account caught up                     | Synced          |
| Batch active                          | Syncing         |
| Network unavailable with pending work | Offline         |
| Rejected mutation/conflict            | Needs attention |

Never expose HTTP status, cursor or mutation offsets as product language.

## Recovery scenarios

- Interrupted upload: retry same mutation IDs.
- Duplicate batch: receipt table returns prior acknowledgement.
- Interrupted remote apply: local transaction rolls back and cursor stays unchanged.
- Token expiry: local queue remains; reauthentication resumes it.
- Unsupported protocol: server returns a minimum/maximum version and client stops safely without dropping mutations.
