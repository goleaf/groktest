# ADR 0004 — Account-optional local identity

## Context

Borrowed is a personal utility. Forcing signup before the first drill record would kill the product.

## Decision

Part 1 is local-only. A `localIdentityId` is created on first launch. No auth UI. Domain rows are not keyed by a server user id.

## Alternatives

- Mandatory account: conflicts with the spec and with localhost-only operation
- Anonymous server user: needs hosting, which is out of scope

## Consequences

Phone loss without export is unrecoverable. Settings must say data lives on this device. Future accounts attach at the sync layer.
