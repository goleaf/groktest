# Local database recovery design

**Date:** 2026-08-21  
**Baseline:** `fe3a585af6ee90c2f7a133bdc766cc239a66f5f4`  
**Scope:** One bounded Stage 2 recovery slice after persisted-row runtime decoding

## Prerequisite and current state

The runtime-decoder prerequisite is present in the current worktree:

- `row-decoders.ts` validates every persisted row type before domain mapping;
- mappers accept `unknown` and delegate to those decoders;
- `PersistenceCorruptionError` carries only entity/path/reason metadata, never a raw value;
- corrupt fake-indexeddb rows are covered; and
- the focused decoder/corruption suite passes 2 files / 58 tests.

The existing Angular initializer catches typed corruption and renders a static payload-free root
state. It still rethrows IndexedDB availability failures, has no retry lifecycle, cannot export raw
rows when normal decoding fails, and says that no recovery tools exist. A failed database open can
therefore still leave Angular without a useful recovery surface.

## Recovery boundary

`ApplicationInitializationState` owns a small discriminated failure state:

- `corruption` for `PersistenceCorruptionError`;
- `unavailable` for recognized IndexedDB/Dexie availability errors; and
- no failure after a successful attempt.

It never exposes or stores a raw exception message for rendering. The production initializer
registers one retry closure, suppresses only the two persistence failure classes above, and keeps
unrelated programming failures observable by rethrowing them.

Retry invokes the same `BorrowedApp.initialize()` and language restoration path. It is single-flight,
exposes a busy state, clears the recovery screen only after success, and can be attempted repeatedly.
Development demo seeding remains unchanged during normal boot but is deliberately skipped on a
recovery retry: retry must not create or reseed data.

## Raw recovery export

The abstract store gains one explicit raw recovery export operation. The Dexie adapter reads all
current tables in a single read transaction and serializes the persisted rows without passing them
through runtime decoders. This allows a user-triggered download even when one row is corrupt.

The JSON envelope identifies itself as `borrowed-local-recovery-diagnostic`, records a format
version, database schema version and export instant, and places table rows under a `tables` object.
It is a diagnostic/recovery snapshot, not the existing point-in-time app export and not a stable
restorable backup contract. The UI warns that the downloaded file can contain private local data.
Raw rows are never inserted into the DOM or console.

No schema/index/dependency changes are needed. The export transaction is read-only. It does not
delete, repair, coerce, migrate, reseed or mutate IndexedDB.

## Recovery UI

The root recovery screen replaces the router for either failure kind and provides:

- one localized non-private heading and explanation;
- a native Retry button with disabled/busy semantics;
- a native diagnostic-download button with explicit privacy guidance;
- an assertive live status for repeated retry/export outcomes;
- a clearly destructive reset explanation with no reset control; and
- a visible disabled restore entry point labelled as not yet available, with no hidden file input or
  fake handler.

The initial heading is programmatically focusable and receives focus when the boundary first
appears. Native buttons preserve keyboard activation, global focus-visible styling and 48px touch
targets. Repeated retry failure leaves the user on the same usable screen.

## Privacy and failure handling

- No error message, stack, entity field, name, note or corrupt value is rendered or logged.
- Export failure uses a localized generic message.
- The raw file is produced only after an explicit user action and is labelled private.
- No automatic `deleteDatabase`, database reset, repair, restore or demo reseed is introduced.
- Unrecognized failures continue to reject initialization rather than being mislabeled as local
  storage trouble.

## Verification

RED/GREEN coverage must prove initialization rejection handling, retry success, repeated retry
failure, no raw exception disclosure, unchanged normal boot, raw export through corrupt data, and no
reset/reseed on recovery. EN/LT/RU catalog parity, focused persistence/application/root tests, full
typecheck/tests/lint/build, diff checks and disposable-browser keyboard/accessibility verification
complete the slice.
