# Borrowed command use-case decomposition plan

> **Scope guard:** This is the command-only first slice of Stage 1 Task 4. It does not introduce
> query services, Dexie live queries, feature injection migrations, or removal of
> `BorrowedApp.revision`.

**Goal:** Extract record mutations from the broad `BorrowedApp` facade without changing public
behavior, domain validation, persistence transactions, or read/query architecture.

**Architecture:** Add one focused application-layer `RecordsCommandService` whose four explicit
use cases call the existing pure domain commands and the existing `BorrowedStore` transaction
ports. Keep `BorrowedApp` as the compatibility facade; its public methods delegate to the command
service and retain the current successful-write `revision` invalidation. Feature components keep
injecting `BorrowedApp` in this slice.

## Current reconciliation — 2026-08-21T16:29:07+03:00

- **HEAD:** `83e59955f30247af11747f1984b0039a1b372f10` on `main`, matching `origin/main`
  at the initial pre-flight. During review another worker advanced `main`/`origin/main` to
  `3796bea6f7595c33ed4f2f5280d7ec8732081c1c` with CI-only paths; the command slice was rechecked
  on that newer HEAD without conflict. A later documentation-only commit advanced HEAD to
  `1a5a9b8daa4e91df6cbfafc1145bef173af3c8bc`; the complete gate was rerun there.
- **Stage 0:** complete. Strict templates/standalone, compiler documentation, return chronology,
  deterministic attention ordering, Add hidden-field validation and initialization/draft safety,
  History retry/error/stale-generation handling, and final focused/browser verification are
  present in code, tests, and the Stage 0 completion evidence. This task must preserve them.
- **Current command ownership:** `BorrowedApp.createRecord()`, `markReturned()`,
  `changeDueDate()`, and `repay()` currently combine application orchestration with calls to pure
  domain commands. Successful calls increment the facade revision only after the store operation
  resolves.
- **Current transaction ownership:** `BorrowedStore.putLoanBundle()` owns atomic person/loan/event
  creation and queued mutations. `BorrowedStore.updateLoan()` owns atomic loan read, active
  repayment read, domain apply, loan/event/optional repayment write, and queued mutations. This
  slice will not change either port or the Dexie implementation.
- **Behavior already protected:** domain command specs cover creation validation, return chronology,
  due-date rules, repayment currency/amount limits, and completion. Dexie integration specs cover
  bundles, mutation queues, atomic update failure, concurrent repayment serialization, and all four
  existing facade mutations.
- **Changes after the original Stage 1 plan:** active repayment filtering, first-run settings race
  hardening, runtime persisted-row decoders, controlled initialization corruption state, deployment
  work, and a partially staged local recovery boundary now exist. None changes this command split's
  ownership or authorizes query work.
- **Foreign dirty ownership:** recovery work owns `angular.json`, `src/test-setup.ts`,
  `tsconfig.spec.json`, app initialization/shell files, `src/app/data/store.ts`,
  `src/app/data/dexie-store.ts`, `src/app/data/local-recovery-export.spec.ts`, i18n catalogs and
  recovery docs. Its staged `src/app/data/borrowed-app.ts` addition
  (`exportRawRecoveryJson()`) must be preserved. Concurrent deployment work owns
  `.github/workflows/ci.yml`, `.github/workflows/deploy-production.yml`, and
  `deploy/deployment-contract.test.mjs`.
- **Existing Stage 1 Task 4 status:** command extraction will be partially complete after this
  slice. Query services, query state, feature-by-feature injection migration, live-query work and
  revision removal remain explicitly unstarted here.

## Files owned by this slice

- Create: `src/app/application/records-command-service.ts`
- Create: `src/app/application/records-command-service.spec.ts`
- Modify narrowly: `src/app/data/borrowed-app.ts`
- Update with evidence: this plan
- Reconcile one completed command checkbox/evidence only:
  `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-1.md`

No feature component, domain command, store port, Dexie adapter, schema, query method, i18n catalog,
or package file belongs to this slice.

## Implementation contract

- [x] Characterize all four command paths with a focused test before adding the service.
- [x] Keep `CreateRecordInput` source-compatible through the existing `borrowed-app` export.
- [x] Move create-person lookup/building and `createLoan()` orchestration to
      `RecordsCommandService.createRecord()`.
- [x] Move return, due-date and repayment orchestration to explicit service methods that each call
      `BorrowedStore.updateLoan()` exactly once.
- [x] Invoke only the existing pure domain commands; do not copy their validation into Angular.
- [x] Preserve the exact default-currency behavior and `person_missing` controlled failure.
- [x] Preserve atomicity by continuing to use only `putLoanBundle()` and `updateLoan()`.
- [x] Delegate from the existing `BorrowedApp` public methods and keep `touch()` after successful
      completion only.
- [x] Keep all feature components on `BorrowedApp`; do not alter read/query signatures or behavior.

## Red -> green -> refactor

1. Add a focused spec that imports the not-yet-present command service and characterizes creation,
   return, due-date change and repayment through the real fake-IndexedDB adapter.
2. Run the focused spec and capture the expected missing-module/implementation failure.
3. Implement the smallest service and compatibility delegation.
4. Run the focused spec plus domain command and Dexie persistence suites.
5. Inspect the attributable diff for duplicate validation, changed transaction calls, query-side
   edits, TypeScript escapes, and accidental foreign-file changes.
6. Refactor only within the owned command slice, then rerun focused tests.

## Done criteria and verification

- All four `BorrowedApp` mutation signatures and results remain source/behavior compatible.
- Success increments revision once; a rejected command does not invalidate reads.
- Store transaction methods and Dexie schema are unchanged.
- Existing domain and persistence mutation regressions remain green.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check` pass on the shared
  tree, or any independently changing foreign-file failure is reported exactly with attribution.
- Completion evidence below records exact commands, counts, current HEAD, owned files and blockers.

## Completion evidence

- **Red:** the first focused Angular test build failed as intended because
  `records-command-service` did not exist and `BorrowedApp` had no compatible command dependency.
- **Green/refactor:** the new focused spec passed 1 file / 2 tests. The final domain, persistence
  and command matrix passed 3 files / 40 tests; the command, provider and architecture matrix
  passed 3 files / 7 tests. Existing `BorrowedApp` integration tests continue to exercise all four
  mutation paths and transaction failure/concurrency behavior.
- **Compatibility:** `CreateRecordInput` remains exported from `data/borrowed-app`; features and
  the seeder need no import or injection change. `BorrowedApp` delegates all four public methods,
  increments `revision` once after each successful command, and leaves it unchanged after a
  rejected domain command.
- **Atomicity:** no store port, Dexie adapter, schema, persistence query or domain command changed.
  Creation still calls `putLoanBundle()` once; each update still calls `updateLoan()` once.
- **Full verification on `1a5a9b8`:** `pnpm test` passed 47 files / 269 tests;
  `pnpm typecheck` passed; `pnpm lint` passed Angular ESLint and repository-wide Prettier;
  `pnpm build` exited 0. The production build reports the existing non-fatal initial-bundle budget
  warning at 509.32 kB, 9.32 kB over the 500 kB warning threshold.
- **Review:** an independent read-only five-axis review found no correctness, readability,
  architecture, security or performance issue. It separately verified Angular DI and legacy
  two-argument `BorrowedApp` construction through the focused suites.
- **Scope:** no feature, UI, query-side, domain, store, Dexie, schema, dependency or i18n file was
  changed by this slice. Browser verification was not repeated because rendered UI and routing
  behavior are unchanged.
- **Remaining Stage 1 work:** query services/state, feature injection migration, live-query bridge,
  targeted cross-tab invalidation and eventual removal of `BorrowedApp.revision` remain open and
  must not be inferred complete from this command extraction.
