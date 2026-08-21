# Borrowed non-record service decomposition plan

> **Scope guard:** This continues the published command-service slice. It extracts settings,
> drafts, backup/export and current-day responsibilities only. It does not introduce query
> services, Dexie live queries, schema changes, backup import, or removal of the remaining
> `BorrowedApp` query/record compatibility facade.

**Goal:** Move four independent non-record concerns behind small application services, migrate
their real callers only after focused service tests exist, and leave `BorrowedApp` responsible only
for still-unmigrated record/query behavior.

**Architecture:** `SettingsService`, `RecordDraftService` and `BackupService` depend on the abstract
`BorrowedStore`, never Dexie. `CurrentDayService` depends on the clock plus the browser document for
its lifecycle listeners and exposes one read-only day signal. Components inject the narrow service
they need; UI-only download creation and localization remain in components. `BorrowedApp` consumes
`CurrentDayService` internally for date-sensitive queries but no longer implements or publishes the
four extracted concerns.

## Current reconciliation — 2026-08-21T16:43:53+03:00

- **Current HEAD:** `5425e2540c1c622751ccc01288dea5c55ed41023` on `main`, matching
  `origin/main`; the worktree and index are clean.
- **Previous decomposition:** `RecordsCommandService` is complete and published in `5425e25`.
  `BorrowedApp` delegates create/return/due-date/repayment and retains the temporary global
  successful-write revision. Query architecture remains intentionally unsplit.
- **Stage 0:** complete and preserved. No compiler, Add validation/initialization, History async,
  comparator or return-chronology behavior is reopened here.
- **Recovery prerequisite:** local recovery and raw diagnostic export are published in `0342283`
  and included at current HEAD. There is no longer a foreign dirty recovery owner, so the root raw
  export caller and application initializer can migrate safely.
- **Current direct ownership inside `BorrowedApp`:** initialization/settings mutation, draft row
  construction, normal/raw export serialization, current-day signal/refresh and due-day distance.
- **Existing lifecycle owner:** `CurrentDayTracker` currently owns midnight, focus and visibility
  listeners but calls back into `BorrowedApp`; it will be replaced, not wrapped, so there is one day
  state and one timer/listener owner.
- **Backup constraint:** current `exportJson()` is an unversioned point-in-time export. Raw recovery
  export is a separate diagnostic envelope. Neither is a validated/restorable backup; this slice
  only defines a future importer port and implements no import/reset/restore behavior.
- **Persistence constraint:** all reads/writes continue through `BorrowedStore`. No Dexie table,
  transaction, schema, mapper, decoder, mutation shape or identity semantic changes.

## Owned files

### New application services and focused tests

- `src/app/application/settings-service.ts`
- `src/app/application/settings-service.spec.ts`
- `src/app/application/record-draft-service.ts`
- `src/app/application/record-draft-service.spec.ts`
- `src/app/application/backup-service.ts`
- `src/app/application/backup-service.spec.ts`
- `src/app/application/current-day-service.ts`
- `src/app/application/current-day-service.spec.ts`

### Compatibility and caller migration

- `src/app/application/records-command-service.ts` and its spec
- `src/app/application-initialization.ts` and its spec
- `src/app/app.config.ts`, `src/app/app.ts`, and `src/app/app.spec.ts`
- `src/app/data/borrowed-app.ts`
- `src/app/data/dexie-store.spec.ts`
- `src/app/data/local-recovery-export.spec.ts`
- Add, Settings, Detail, Home and shared LanguageSwitcher/LoanRow files and focused specs
- `src/app/layout/shell.ts`, `src/app/layout/shell.spec.ts`
- Delete the superseded `src/app/layout/current-day-tracker.ts` and its spec
- `docs/architecture.md` and the relevant Stage 1 reconciliation/evidence

No domain command, store port, Dexie adapter, schema, translation catalog, style, package or lock
file belongs to this slice.

## Service contracts

### SettingsService

- [ ] `initialize()` owns stable local settings/identity initialization through the store.
- [ ] `get()` returns decoded `LocalSettings`; `localIdentityId()` exposes only the stable identity
      identifier when that is all a caller needs.
- [ ] `setPreferredCurrency()` validates with the existing domain currency rule, versions once and
      persists transactionally through the store.
- [ ] `setPreferredLanguage()` versions once and persists the supported language without importing
      or mutating `I18n`.
- [ ] `RecordsCommandService` obtains the default creation currency through this service rather
      than owning a settings read.

### RecordDraftService

- [ ] Publish `RecordDraftInput` and `DraftPersistenceStatus` application contracts.
- [ ] `load()`, `save()` and `clear()` are the complete API; `save()` alone creates the stable
      `add-record` id and timestamp.
- [ ] Keep debouncing, stale-write presentation status and localization in Add; the service owns no
      timer, translated copy or component state.

### BackupService

- [ ] Preserve the exact existing normal export JSON shape and bigint decimal serialization.
- [ ] Preserve the separate raw diagnostic export through the existing store boundary.
- [ ] Define a minimal unimplemented `BackupImportPort`; do not pretend the current export is
      restorable and do not add reset/import UI.
- [ ] Return strings only. Blob, object URL, anchor/document interaction and localized feedback stay
      in the Settings/root components.

### CurrentDayService

- [ ] Expose one readonly reactive `currentDay`, `today()`, `refresh()` and `daysUntilDue()`.
- [ ] Own one idempotent lifecycle for local-midnight scheduling, window focus and visible-page
      refresh; clean listeners/timer on destroy.
- [ ] Replace `CurrentDayTracker` and migrate direct day consumers without changing query methods.
- [ ] `BorrowedApp` delegates date-sensitive query calculations to the same injected service and
      no longer owns a second day signal.

## Red -> green -> caller migration

1. Add four focused specs importing the missing services. Characterize settings identity/versioning,
   draft load/save/clear, both current exports plus the future import type boundary, and current-day
   midnight/focus/visibility/destruction behavior.
2. Run them and record the expected missing-module RED.
3. Implement the smallest four services; run the focused service specs to GREEN.
4. Change caller specs first so they provide and assert the narrow services rather than
   `BorrowedApp`; run each focused spec to prove the caller migration is still RED.
5. Migrate application initialization, root recovery export, Settings, LanguageSwitcher, Add,
   Shell, Home, Detail and LoanRow. Keep UI/document and translated feedback outside services.
6. Remove the old tracker and extracted methods/state from `BorrowedApp`; update persistence tests
   to exercise the new service APIs directly.
7. Run focused application/component/persistence matrices, inspect the attributable diff for
   circular imports, direct Dexie access, duplicated validation, localization leakage, TypeScript
   escapes and changed export shapes, then refactor only inside this slice.

## Done criteria and verification

- Each new service has one concern and no circular dependency.
- Feature/UI callers do not import `BorrowedStore`, Dexie or persistence rows.
- `BorrowedApp` retains record commands and queries only; it still exists and query-side behavior
  and revision semantics are unchanged.
- Existing Add stale-generation/error behavior, settings rollback UI, normal recovery, raw export,
  local day refresh and all persisted data semantics remain green.
- Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`; record exact
  counts, HEAD, build warning and any blocker below.

## Completion evidence

Pending RED/GREEN implementation and fresh verification.
