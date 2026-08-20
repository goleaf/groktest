# Borrowed Part 1 foundation design

## Goal

Turn the present Angular checkout into a truthful, durable local-first foundation for a personal lent/borrowed utility without introducing enterprise concepts or a fake backend.

## Product boundary

Implemented vertical slice: create lent/borrowed item or money, persist offline, restore an interrupted Add form, list/search/filter, inspect details/people/history, return an item, add partial/full repayment, see currency-separated summaries, change preferred currency and export JSON.

Intentionally deferred: online account/sync transport, reminders, notifications, attachments, contact permissions, import, shared loans, native SQLite and release packaging. Each has a documented seam and no placeholder UI.

## Architecture

- One Angular 22 strict standalone frontend with signals and lazy features.
- Pure TypeScript domain with UUIDv7, calendar dates and minor-unit BigInt money.
- `BorrowedApp` use cases over an abstract `BorrowedStore`.
- Dexie/IndexedDB v2 local persistence; transaction contains validation and all writes for lifecycle changes.
- Mutation queue is protocol v0 preparation only; no network request.
- PWA caches production shell; tracked Capacitor 8 Android/iOS projects ship the same build.

## UX

Phone navigation: Home, Records, Add, Search, More. Desktop unwraps secondary destinations into a rail. Add requires direction, type, person and item/amount; due date/note are progressive disclosure. A local draft is not a Loan. Direction/status always use words/icons as well as color. Controls, landmarks, focus, safe area and reduced motion are first-class.

## Data and rules

Person is independent from accounts and same-name Persons remain distinct. Loan owns original transfer facts. Repayment is append-oriented. Outstanding and urgency states are derived. Dates remain calendar dates. Text/money/quantity are bounded. Due/repayment cannot predate handoff. Original money cannot be edited through balance math.

## Security and privacy

Private by default, no analytics or content logging, Angular escaping, no auth tokens, no secrets. IndexedDB is explicitly not claimed as encrypted. Future server access is account-policy scoped and uses idempotent optimistic sync rather than IDs as authorization.

## Acceptance

Domain/persistence/component tests pass; ESLint/template accessibility lint, formatting, strict build and production build pass; dependency audit has no high findings; `ngsw` artifacts exist; Capacitor sync succeeds; Android debug APK compiles; real Chrome verifies responsive/offline behavior and a clean console. iOS build is reported separately if Xcode is unavailable.
