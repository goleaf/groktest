# Synchronization design

Part 1 does **not** talk to a server. Core actions work with no network.

This document is the protocol the local app already prepares for.

## Goals

- Create, edit, complete, and repay without a round trip
- Multiple devices later, without changing IDs
- Never use “last HTTP request wins” for money
- Recover from interrupted uploads without duplicating repayments

## Identifiers

Every entity ID is a client-generated UUIDv7. The server must accept client IDs. The server must not allocate IDs for loans, people, or repayments.

## Local identity vs account

`LocalSettings.localIdentityId` is the installation. A future account id is separate. Domain rows do not have a mandatory `userId` in v1. When sync lands, the account is associated at the mutation/upload layer, not by rewriting history.

## Mutation queue

Each successful local write enqueues a `SyncMutation`:

- `id` — idempotency key
- `entityType` + `entityId`
- `operation` — `upsert` or `delete` (tombstone)
- `payloadJson` — entity snapshot
- `ackedAt` — null until acknowledged

Order: mutations are drained in `createdAt` / UUIDv7 order per device.

A future server endpoint should be idempotent on `mutation.id`. Retrying an ack’d mutation is a no-op.

## Record versions

Each Person/Loan/Repayment has an integer `version` incremented on local change, plus `updatedAt`.

For **scalar loan fields** (note, dueOn, status): last-write-wins using `(updatedAt, version, id)` as the total order if two devices edit the same field.

For **repayments and loan events**: append-only. Conflicts do not merge amounts. Duplicate `id` is ignored.

Original money amount is immutable after create. A server that receives a different `originalMinorUnits` for an existing id must reject the mutation.

## Deletes

Soft delete via `deletedAt`. Sync sends `operation: delete`. Clients hide tombstones. Physical erase is a later “purge archived” concern, not v1.

## Interrupted sync

If upload fails, `attempts` and `lastError` update. The local record stays as the user left it. UI may later show “Needs attention”; it must not revert the loan.

## Attachments (future)

Loan mutations and attachment blobs are independent queues. A photo failure must not roll back the loan.

## Conflicts the user might see

Automatic:

- Two due-date edits → later `updatedAt` wins; an event is kept for both if both devices recorded `due_date_changed`
- Two devices add different repayments → both kept; outstanding is recomputed; if the sum would exceed original, the **later** repayment is marked failed/needs attention rather than silently shrinking the other

User intervention (rare):

- Concurrent full-repay vs extra repayment that would overpay

Never silently drop a repayment.

## Backup vs sync

- **Sync** — ongoing multi-device convergence
- **Backup** — point-in-time recovery (export/archive)

Part 1 implements neither upload nor backup. Export should later serialize the same entities to JSON.

## Protocol version

**v0** — local queue only, no drain.

**v1** (future) — HTTPS JSON API, auth bearer, idempotency key header = mutation id, no WebSockets required.

## User-facing states

| Internal              | User copy (local-only now) |
| --------------------- | -------------------------- |
| No account            | On this device             |
| Queue empty + account | Synced                     |
| Drain in progress     | Syncing                    |
| No network + pending  | Offline                    |
| Conflict / overpay    | Needs attention            |

Do not show HTTP codes or queue offsets.
