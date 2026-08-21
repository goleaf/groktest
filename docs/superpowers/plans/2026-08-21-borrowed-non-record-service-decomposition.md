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

## Current reconciliation — 2026-08-21T17:01:00+03:00

- **Current HEAD:** `43e5199c68187104142f59991e2300e707d1f6e4` on `main`, matching
  `origin/main`. Another process first published the service/caller slice in `7377199`, then
  published the verified Detail, Home, persistence-test, facade and documentation closeout in
  `43e5199` while this task was running. A final reviewer found that currency writes had lost the
  facade's temporary revision invalidation and that the manual persistence graph did not share its
  current-day instance; the focused fixes/tests are the only active product-code dirty layer.
- **Previous decomposition:** `RecordsCommandService` is complete and published in `5425e25`.
  `BorrowedApp` delegates create/return/due-date/repayment and retains the temporary global
  successful-write revision. Query architecture remains intentionally unsplit.
- **Stage 0:** complete and preserved. No compiler, Add validation/initialization, History async,
  comparator or return-chronology behavior is reopened here.
- **Recovery prerequisite:** local recovery and raw diagnostic export are published in `0342283`
  and included at current HEAD. There is no longer a foreign dirty recovery owner, so the root raw
  export caller and application initializer can migrate safely.
- **Reconciled ownership:** `SettingsService`, `RecordDraftService`, `BackupService` and
  `CurrentDayService` now own the four concerns. `CurrentDayTracker` has been removed, and callers
  no longer use the extracted `BorrowedApp` APIs. The facade retains record commands plus
  still-unmigrated queries only.
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
- `src/app/application/application-revision.ts`

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

- [x] `initialize()` owns stable local settings/identity initialization through the store.
- [x] `get()` returns decoded `LocalSettings`; `localIdentityId()` exposes only the stable identity
      identifier when that is all a caller needs.
- [x] `setPreferredCurrency()` validates with the existing domain currency rule, versions once and
      persists transactionally through the store, then advances the temporary shared revision only
      after a successful write.
- [x] `setPreferredLanguage()` versions once and persists the supported language without importing
      or mutating `I18n`.
- [x] `RecordsCommandService` obtains the default creation currency through this service rather
      than owning a settings read.

### RecordDraftService

- [x] Publish `RecordDraftInput` and `DraftPersistenceStatus` application contracts.
- [x] `load()`, `save()` and `clear()` are the complete API; `save()` alone creates the stable
      `add-record` id and timestamp.
- [x] Keep debouncing, stale-write presentation status and localization in Add; the service owns no
      timer, translated copy or component state.

### BackupService

- [x] Preserve the exact existing normal export JSON shape and bigint decimal serialization.
- [x] Preserve the separate raw diagnostic export through the existing store boundary.
- [x] Define a minimal unimplemented `BackupImportPort`; do not pretend the current export is
      restorable and do not add reset/import UI.
- [x] Return strings only. Blob, object URL, anchor/document interaction and localized feedback stay
      in the Settings/root components.

### CurrentDayService

- [x] Expose one readonly reactive `currentDay`, `today()`, `refresh()` and `daysUntilDue()`.
- [x] Own one idempotent lifecycle for local-midnight scheduling, window focus and visible-page
      refresh; clean listeners/timer on destroy.
- [x] Replace `CurrentDayTracker` and migrate direct day consumers without changing query methods.
- [x] `BorrowedApp` delegates date-sensitive query calculations to the same injected service and
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

Completed on the reviewed working tree based on HEAD
`43e5199c68187104142f59991e2300e707d1f6e4` (`main == origin/main` at verification time).

- **RED evidence:** the four service specs first failed because their modules did not exist. Caller
  specs then failed against the old facade paths: Settings/LanguageSwitcher (4 failures), Add
  (10), LoanRow (2), Shell (4), Home (5) and Detail (8). The first full run exposed four remaining
  transitive `LoanRow` test fixtures without `CurrentDayService` (4 files / 12 failures); those
  fixtures were migrated rather than restoring removed facade fields.
- **Focused GREEN:** core persistence/command integration passes 4 files / 25 tests; the complete
  service/initialization/root/Add/Settings/Home/Detail/Shell/shared-UI caller matrix passes 13 files
  / 51 tests; the four transitive page fixtures pass 4 files / 17 tests. Reviewer-fix coverage for
  shared revision/current-day, exact export, language rollback and stale draft generations passes
  7 files / 45 tests.
- **Full GREEN:** `pnpm test` passes 50 files / 274 tests; `pnpm lint` passes Angular ESLint and
  repository-wide Prettier; `pnpm typecheck` passes; `pnpm build` passes.
- **Build evidence:** production initial bundle is 510.17 kB (136.70 kB estimated transfer). The
  existing warning budget remains exceeded by 10.17 kB; no dependency or bundle-scope change was
  introduced to disguise it.
- **Diff/architecture evidence:** `git diff --check` passes. Changed-diff scans find no `any`,
  `$any`, double assertion, TypeScript suppression or blanket ESLint escape. Feature/UI code has no
  new Dexie imports, and settings/draft/backup services contain no localization or DOM/download
  manipulation. No schema, store port, domain rule, i18n catalog, style, package or lockfile was
  changed.
- **Independent review:** the first pass found the lost currency revision invalidation, an
  unrealistic split current-day test graph and stale architecture documentation. Each was fixed
  with focused regressions; the follow-up found no remaining Critical/Important issue and returned
  `Ready: yes`.
- **Remaining Stage 1 work:** query-service extraction, feature query injection, Dexie live-query
  state and removal of `BorrowedApp.revision` remain deliberately unstarted.
