# Persisted row runtime decoding design

**Date:** 2026-08-21  
**Starting baseline:** `0865ac5d676ebb923d5699cb368df8160c2a888e` on `main`  
**Reconciled completion baseline:** `fe3a585af6ee90c2f7a133bdc766cc239a66f5f4` on `main`  
**Scope:** Stage 2 runtime decoding and the minimum safe Angular initialization boundary only

## Objective

Treat every IndexedDB row as untrusted runtime data. A malformed row must produce a typed,
non-coercing persistence error at the data boundary. In particular, corrupt local settings must
reach a controlled, fail-closed application state instead of rejecting Angular bootstrap with an
unexplained `JSON.parse`, `BigInt`, or property-access exception.

This slice does not implement backup/import, mutation retention, schema changes, automatic repair,
data deletion, or the broader Stage 2 recovery workflow.

## Reconciled baseline and ownership

- Current schema is Dexie schema version 3. No new index is needed for decoding.
- Current row mappers accept compile-time row interfaces and trust persisted values. Loan and
  repayment mappers call `BigInt()` directly; the event mapper combines `JSON.parse()` with a type
  assertion; settings, people, mutations, and drafts are copied without runtime validation.
- `app.config.ts` awaits `BorrowedApp.initialize()` directly, so corrupt settings reject the app
  initializer. `main.ts` then logs the raw bootstrap error.
- The current working tree contains valid, unrelated repayment-read and local-settings race
  hardening in `dexie-store.ts`, `dexie-store.spec.ts`, and `store.ts`. Those semantics must be
  preserved while the shared store file is edited.
- The staged Stage 0 plan and the staged repayment/settings plan files belong to other work. This
  slice will not edit, unstage, or absorb them.
- While this slice was running, another task advanced `main` and `origin/main` through the
  production deployment series ending at `fe3a585`. Those commits add deployment/CI files, adjust
  production-only Angular style optimization, and format two Stage 1 pages; they do not overlap the
  persistence/application implementation here.

## Accepted design

### Small explicit decoders

Add a dependency-free decoder module in the data layer. Decoder entry points accept `unknown`,
verify a non-array object, validate required and nullable properties, and construct a fresh domain
object. Unknown extra properties are not copied into the domain object. They are tolerated so an
older application can read a row carrying additive migration metadata without treating harmless
forward-compatible data as corruption.

Primitive validators cover:

- required, non-empty, and nullable strings;
- finite safe integers, positive versions, and non-negative mutation attempts;
- exact enum membership;
- supported ISO currency codes from the existing domain currency catalog;
- real `YYYY-MM-DD` calendar dates using the existing calendar-date predicate;
- canonical UTC instants in the same millisecond `toISOString()` form emitted by `instantFrom()`;
- canonical positive decimal strings before calling `BigInt()`, bounded by the existing portable
  `MAX_MINOR_UNITS` limit;
- JSON syntax plus exact string-valued event summary parameter objects.

`SyncMutation.payloadJson` remains a JSON string in the domain contract, but decoding proves it is
valid JSON before returning it. No parsed payload type is invented in this slice.

`RecordDraft` is decoded because Add reads it during initialization. Its raw form strings stay raw:
an empty due date and an incomplete amount are valid draft state, while a non-empty due date must
be a valid calendar date.

### Typed corruption error

Add `PersistenceCorruptionError` with stable typed fields for persisted entity, field path, and a
closed reason code. Messages and user-facing rendering must not contain the corrupt value or the
raw row. JSON parser errors may be retained as an internal `cause`, but are never rendered.

Missing settings remain a separate operational `settings_missing` condition; a present but invalid
settings row is persistence corruption.

### Mapping and query boundary

Every `*FromRow` mapper accepts `unknown` and delegates to its explicit decoder. `RecordDraft` gets
the same mapper boundary instead of returning Dexie data directly.

Store filtering that currently inspects `deletedAt` before mapping must decode first, then filter the
validated domain objects. The pending-mutation query validates `ackedAt` while selecting and fully
decodes only pending rows, so an invalid acknowledgement cannot be silently hidden while historical
payload JSON is not parsed unnecessarily. Indexed status/person/loan selection remains in Dexie;
selected domain rows are decoded once.

### Controlled Angular initialization

Add a root-provided initialization state with `ready` and `persistence-corruption` outcomes.
Extract the initializer body into a testable function:

1. initialize persistence;
2. restore the saved language;
3. run the existing development seed only after valid settings;
4. mark initialization ready;
5. catch only `PersistenceCorruptionError`, record it, and resolve the initializer;
6. rethrow every other error unchanged.

The root component renders the router only in the non-corrupt state. Corruption renders a small
localized `main`/`role="alert"` safe state in EN/LT/RU. It does not show raw row contents, claim
repair, reset IndexedDB, or expose feature routes over unvalidated initialization data.

## Validation contract by row

| Row             | Required validation                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LocalSettings` | fixed `local` key, non-empty identity, supported currency/language, positive schema and entity versions, canonical created/updated instants                                                                   |
| `Person`        | non-empty identity/name, nullable contact/notes, canonical instants, positive version, nullable canonical tombstone                                                                                           |
| `Loan`          | identities/names, direction/kind/status enums, calendar dates, nullable text and return/due dates, kind-specific quantity/currency/minor-unit shape, canonical instants, positive version, nullable tombstone |
| `Repayment`     | identities, positive canonical minor units, currency, calendar date, nullable note, canonical instant, positive version, nullable tombstone                                                                   |
| `LoanEvent`     | identities, event enum, non-empty summary key, valid string-record JSON, canonical event/create instants                                                                                                      |
| `SyncMutation`  | identities, entity/operation enums, valid JSON payload string, canonical create/nullable ack instants, non-negative attempts, nullable last error                                                             |
| `RecordDraft`   | fixed key, direction/kind enums, raw text fields, nullable person identity, supported currency, empty-or-calendar due date, canonical update instant                                                          |

## Performance and safety

- No schema migration, index, runtime dependency, reflection, or generic schema engine.
- Each selected row is decoded once with constant-time field checks. JSON is parsed only for event
  summary parameters and mutation payload validity; bigint conversion happens only after a cheap
  canonical decimal and length check.
- Corruption fails the affected read; no invalid row is skipped, coerced, defaulted, or written
  back automatically.
- Existing soft-delete, atomic settings initialization, transaction, identity, and local-first
  behavior remain unchanged.

## Verification

Use pure decoder tests for the validation matrix, plus fake-indexeddb integration tests that place
malformed rows directly into each relevant table. Prove the error type and metadata, normal reads,
and a real corrupt settings row flowing through `DexieBorrowedStore` into the controlled initializer
state. Then run application initialization tests, persistence/domain tests, lint/typecheck/tests,
production build, audit, and `git diff --check`.
