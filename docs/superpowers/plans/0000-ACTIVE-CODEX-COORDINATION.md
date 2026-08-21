# ⚠️ THIS FILE MUST BE READ BEFORE EXECUTING ANY OTHER PLAN OR CODEX TASK IN THIS REPOSITORY.

> **Live shared-checkout warning:** this repository is being changed by multiple workers. This
> document is a coordination snapshot, not permission to trust stale state. Re-run the pre-flight
> below immediately before every edit, test, stage, commit, package, browser run, or device action.
> Actual code at the current HEAD, the newest approved specification, and explicit user
> requirements override an older plan or unchecked checkbox.

## Current repository baseline

Snapshot reconciled at **2026-08-21T17:05:00+03:00** (`Europe/Vilnius`).

| Item                             | Verified baseline                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Repository                       | `goleaf/groktest`                                                                           |
| HEAD                             | `73771998fdf0f1145783d3cf264bfd6c9a2b6c11` (`7377199`)                                      |
| Branch                           | existing `main`, exactly matching `origin/main` at snapshot time                            |
| Package manager                  | pnpm `10.33.0`                                                                              |
| Angular                          | packages `22.1.3`; CLI/build `22.1.5`                                                       |
| TypeScript                       | `6.0.3`                                                                                     |
| Dexie                            | `4.4.5`                                                                                     |
| Capacitor                        | Android/Core/iOS/CLI `8.5.0`                                                                |
| RxJS                             | `7.8.2`                                                                                     |
| Vitest / jsdom                   | `4.1.11` / `28.1.0`                                                                         |
| Electron                         | `43.4.1` development shell                                                                  |
| Local schema                     | Dexie schema v3                                                                             |
| Actual production IndexedDB name | `borrowed` in `provideBorrowedPersistence()`; see the critical documentation mismatch below |
| Automated test inventory         | 50 `*.spec.ts` files / 272 tests                                                            |
| Authored SCSS                    | 2,821 lines / 47,832 bytes across `src/styles.scss` and `src/styles/*.scss`                 |

### Fresh gate evidence at this snapshot

- `5425e25` published `RecordsCommandService`; `7377199` then published the first non-record service
  slice (`SettingsService`, `RecordDraftService`, `BackupService`, `CurrentDayService`) while its
  remaining consumer cleanup was still being verified. Do not recreate either implementation.
- On the current working tree based on `7377199`, `pnpm test` passes 50 files / 272 tests;
  `pnpm lint` passes ESLint and repository-wide Prettier; `pnpm typecheck` passes; production
  `pnpm build` passes; and `git diff --check` passes.
- Production initial bundle is 509.78 kB (136.54 kB estimated transfer). The existing warning
  budget remains exceeded by 9.78 kB. This is not authorization for an unrelated optimization or
  dependency change.
- The active non-record slice changes no schema, store port, domain rule, translation catalog,
  style, package or lockfile. No browser, PWA offline, native package or physical-device claim was
  refreshed because this slice changes dependency ownership, not rendered behavior.

### Current dirty/staged ownership snapshot

`main` and `origin/main` both point to `7377199`. The active attributable dirty layer is the final
non-record decomposition cleanup: `BorrowedApp`, Detail/Home callers, persistence/seed/recovery and
transitive LoanRow page specs, four task-owned formatting fixes, `docs/architecture.md`, the Stage 1
plan, the non-record plan and this coordination reconciliation. Do not stage, revert or absorb a
subset without re-reading the complete diff and plan.

No other active product owner is proven by Git state at this snapshot. A new worker must still
recheck because another process already advanced HEAD twice during the decomposition sequence.

This snapshot can become stale while it is being read. `git status --short --branch`, unstaged diff,
and staged diff are mandatory before acting.

## Global non-negotiable rules

- Quality over speed. Small verified slices beat broad speculative rewrites.
- Preserve existing user data. `seedDemoIfEmpty` must return without seeding when loans exist.
- Never reset, delete, rename, or destructively migrate IndexedDB to make a test or demo pass.
- No `git reset`, `git clean`, destructive checkout/restore, stash of foreign work, or force push.
- Never revert, format, stage, commit, or push unrelated changes.
- Never implement an old plan blindly. Reconcile it against current HEAD and newer specifications.
- Never duplicate an implementation or domain rule that current code already provides.
- Never weaken, skip, delete, increase timeouts for, or rewrite tests merely to obtain green output.
- No hidden TypeScript escapes: `any`, `$any`, `as unknown as`, `@ts-ignore`,
  `@ts-expect-error`, blanket `eslint-disable`, or unjustified non-null assertions.
- No unnecessary dependency, blanket upgrade, new state library, or styling framework.
- No architecture shortcut that bypasses the domain/application/store boundaries.
- No NgRx unless measured requirements prove signals and local query state insufficient.
- No `zone.js`, NgModules, or SSR. Angular remains zoneless, standalone, and client/local-first.
- Feature components must not import Dexie, the database, row mappers, Capacitor, or Electron.
- Presentation components must not own business rules or persistence mutations.
- Money is never floating point. Use bounded `bigint` minor units plus ISO 4217 currency.
- No hardcoded user-visible copy. EN/LT/RU catalogs must remain structurally equivalent.
- Accessibility must not regress: semantics, keyboard operation, focus, touch targets, live state,
  zoom/reflow, reduced motion, and non-color status remain required.
- Do not claim IndexedDB encryption, remote backup, sync, native SQLite, browser E2E, or device
  proof that the current implementation/evidence does not provide.
- Use only the existing `main` checkout unless a newer explicit user instruction changes that
  policy. Never create a worktree merely to escape this shared-tree coordination problem.

## Active architecture contract

### Actual dependency direction and ownership

```text
features / layout / ui / i18n
              |
              v
BorrowedApp facade in data/ (current application boundary; scheduled to split in Stage 1)
              |
       +------+------+
       |             |
       v             v
 pure domain      BorrowedStore abstract contract
                         |
                         v
                  DexieBorrowedStore / rows / mappers / schema

native platform shells -> bootstrap/delivery adapters only, never domain or feature branching
```

- `src/app/domain/` owns framework-independent value semantics, commands, calendar/money rules,
  identity, summaries, filters, and deterministic ordering.
- `src/app/application/` owns narrow use-case/lifecycle services: record commands, settings,
  record drafts, backup/export and current local day. These depend on `BorrowedStore`/`CLOCK`, not
  Dexie or feature components.
- `src/app/data/borrowed-app.ts` is the temporary facade for still-unmigrated record command
  compatibility, query composition and the current global `revision`. Committed Task 2 code makes
  Records/Search remaining values presentation-neutral; Home still returns locale-shaped actions.
  Stage 1 may split the remaining query surface only in reviewed, intermediate-green slices.
- `src/app/data/store.ts` is the persistence port. `dexie-store.ts`, `database.ts`, `rows.ts`, and
  `mappers.ts` are the Dexie adapter and the only production Dexie boundary.
- `src/app/features/` owns route-level loading/error/empty/success state and interaction wiring. It
  calls application services/facades, not Dexie.
- `src/app/ui/` owns reusable presentation. At HEAD, `LoanRow` accepts raw
  `bigint | null` remaining minor units, formats them against the current locale and uses
  `CurrentDayService` for due distance; do not add persistence or query-facade coupling.
- `src/app/i18n/` owns independent EN/LT/RU catalogs, locale metadata, parameter/plural contracts,
  and formatting presentation.
- `src/app/layout/` owns shell, navigation and page-title behavior; `CurrentDayService` owns
  midnight/focus/visibility refresh.
- `capacitor.config.ts`, `android/`, `ios/`, and `electron/` are delivery boundaries. A feature
  must consume a small application interface before using a platform implementation.

The intended inward dependency rule is stricter than current code. Two exact production edges are
temporary, guarded debt: `domain/types.ts` imports `SupportedLanguage` from `i18n/catalog.ts`, and
`DetailPage` imports the `LoanRecord` type from `data/store.ts`. Do not broaden either exception.
Stage 1's service split must remove the Detail-to-data-port type edge; Stage 3 must move the shared
language type to an inward-neutral contract so domain no longer imports UI catalogs.

### Domain and data invariants

- Money is stored and calculated as signed-64-bit-bounded `bigint` minor units with a supported
  ISO currency. Dexie rows and JSON encode bigint as decimal strings; decode before calculation.
- `CalendarDate` is `YYYY-MM-DD` date-only data. `Instant` is a separate timestamp type. Never
  synthesize midnight instants for due-date logic.
- IDs are UUIDv7 client identities. A Person ID is stable and is not an account. Equal names do
  not authorize merging. Loans retain `personNameSnapshot` for history.
- Stored status is authoritative; the app is not event-sourced. Repayments are append-oriented;
  soft-deleted repayments must never reduce a balance.
- Dexie schema v3 is the current persistence boundary. Changes require additive, in-place,
  rollback-aware migrations; never rename/open another database to simulate a migration.
- The actual historical production database name is `borrowed`. `AGENTS.md` currently says
  `borrowed-app`; that text is stale and must never motivate a database rename or reset.
- Angular is standalone, zoneless, strict-template, and strict-standalone. Signal Forms are the
  current Add/Detail form contract.
- `resource` is for parameterized cancellable reads only. Dexie `liveQuery` may be introduced
  behind `BorrowedStore` for reactive reads. Neither primitive performs a mutation.
- Mutations go through explicit command methods and pure domain commands. Do not write through an
  effect, resource loader, view component, or Dexie table exposed to a feature.
- Loan creation, loan lifecycle updates, settings plus their queued mutations are transactional.
  `BorrowedStore.updateLoan()` must keep read/validate/write/event/repayment/mutations atomic.
- Core behavior is local-first and works without HTTP. The durable mutation queue is future sync
  preparation, not evidence that remote sync exists.
- Development seeding uses public application commands and must not top up or replace an existing
  installation.

### Current async reality

- Home, Records, Detail, History, People, Person and Search use Angular `resource`.
- Person at HEAD uses route-reactive `resource` state, error/retry handling and
  presentation-local remaining-money formatting from committed Task 1. It still keys reads by the
  temporary global revision until Stage 1 Tasks 4-6 replace that invalidation boundary.
- Add's effect is allowed only as the debounced imperative draft-persistence boundary after full
  initialization. It is not precedent for screen reads.
- At HEAD, Records/Search resource parameters no longer include locale, and `remainingMap()` plus
  `LoanRow` exchange raw minor units. The code is committed in `c7100bb`, but Task 2 remains
  acceptance-incomplete until formatting, zero-read characterization, plan evidence, full gates,
  and browser checks are closed.
- The current global `BorrowedApp.revision` invalidates unrelated reads and does not propagate
  cross-tab writes. Remove it only after typed query services/live-query coverage exists.

## Current active plans

Statuses describe the actual implementation and current evidence, not checkbox appearance.

### `2026-08-20-borrowed-part-1-foundation.md`

- **PLAN:** Part 1 local-first foundation.
- **STATUS:** COMPLETE.
- **PRIORITY:** Historical baseline.
- **DEPENDENCIES:** None remaining.
- **LIKELY FILE OWNERSHIP:** None; do not re-execute.
- **OVERLAPS:** Every later plan builds on it.
- **SUPERSEDES:** Initial empty Angular scaffold assumptions.
- **SUPERSEDED BY:** Later feature/design/hardening plans for presentation and async details.
- **NOTES:** Schema v3, PWA, Capacitor projects, CI, transaction rules, draft, i18n, and core flows
  exist in code/tests. Deferred remote sync/import/native SQLite remain genuinely deferred.

### `2026-08-20-borrowed-redesign.md`

- **PLAN:** Original bright list-first production redesign.
- **STATUS:** SUPERSEDED.
- **PRIORITY:** Do not execute.
- **DEPENDENCIES:** Historical only.
- **LIKELY FILE OWNERSHIP:** None.
- **OVERLAPS:** Shell, every feature template, icons, i18n, and global styles.
- **SUPERSEDES:** The initial visual scaffold.
- **SUPERSEDED BY:** Global UX redesign, then Handoff Ledger and hardening.
- **NOTES:** Its 800px/left-rail contract is no longer authoritative; current desktop boundary is
  70rem with a horizontal header.

### `2026-08-20-borrowed-global-ux-redesign.md`

- **PLAN:** Dark custody-board redesign.
- **STATUS:** SUPERSEDED.
- **PRIORITY:** Do not execute.
- **DEPENDENCIES:** Historical only.
- **LIKELY FILE OWNERSHIP:** None.
- **OVERLAPS:** Shell, routes, Home/Add/Detail, shared rows, i18n, and styles.
- **SUPERSEDES:** The earlier bright-list redesign.
- **SUPERSEDED BY:** Handoff Ledger specification/implementation.
- **NOTES:** Dark chrome/mineral-blue direction was explicitly rejected. Reintroducing it would be
  a regression even though its plan boxes remain open.

### `2026-08-20-borrowed-handoff-ledger.md`

- **PLAN:** White/teal information-rich ledger and deterministic 100-loan development seed.
- **STATUS:** PARTIALLY COMPLETE.
- **PRIORITY:** Historical product contract; no blind re-execution.
- **DEPENDENCIES:** Part 1 foundation.
- **LIKELY FILE OWNERSHIP:** None unless a new task explicitly reopens a missing acceptance item.
- **OVERLAPS:** Hardening, SCSS optimization, core flow, People, i18n, seed, all primary screens.
- **SUPERSEDES:** Both earlier redesign directions.
- **SUPERSEDED BY:** Hardening and audit modernization for implementation details.
- **NOTES:** The 100-loan seed, horizontal shell, handoff line and ledger UI exist. The unchecked
  plan does not contain durable proof for every browser/device handoff, so the whole plan is not
  marked complete.

### `2026-08-20-core-borrowed-flow.md`

- **PLAN:** Direction-aware create/return/repay and original/repaid/remaining money presentation.
- **STATUS:** COMPLETE.
- **PRIORITY:** Preserve behavior.
- **DEPENDENCIES:** Foundation/domain commands.
- **LIKELY FILE OWNERSHIP:** None.
- **OVERLAPS:** Add, Detail, loan rules, EN/LT/RU.
- **SUPERSEDES:** Generic direction copy.
- **SUPERSEDED BY:** No product replacement; Stage 1 may change data flow only.
- **NOTES:** Current Add/Detail and domain rules implement the requested flow.

### `2026-08-20-icon-system.md`

- **PLAN:** Typed code-native semantic icon system.
- **STATUS:** COMPLETE.
- **PRIORITY:** Preserve contract.
- **DEPENDENCIES:** Existing `Icon` component.
- **LIKELY FILE OWNERSHIP:** None.
- **OVERLAPS:** Every feature template and shared UI primitive.
- **SUPERSEDES:** Ad hoc icon mapping.
- **SUPERSEDED BY:** None.
- **NOTES:** Typed vocabulary, mappings, page headings, empty states, coverage tests and styling
  exist. Do not add an icon dependency.

### `2026-08-20-people-hub.md`

- **PLAN:** Stable person identity, indexed person reads, relationship summary, Add deep link.
- **STATUS:** COMPLETE.
- **PRIORITY:** Preserve product behavior; modernize async path separately.
- **DEPENDENCIES:** Foundation and core flows.
- **LIKELY FILE OWNERSHIP:** None currently; Stage 1 Task 1 landed in `50884e7`.
- **OVERLAPS:** Stage 1 `PersonPage`, `BorrowedApp`, Dexie tests and i18n.
- **SUPERSEDES:** Shallow people list behavior.
- **SUPERSEDED BY:** Stage 1 only for reactive data flow, not domain semantics.
- **NOTES:** People hub behavior exists, and `50884e7` removed `PersonPage`'s Promise-writing
  effect without changing person identity or relationship semantics.

### `2026-08-20-return-reminders.md`

- **PLAN:** Date-derived in-app reminders and transactional deadline change.
- **STATUS:** COMPLETE.
- **PRIORITY:** Preserve behavior.
- **DEPENDENCIES:** Calendar/date domain and transactional update boundary.
- **LIKELY FILE OWNERSHIP:** None.
- **OVERLAPS:** Home/rows/Detail, domain commands, i18n, current-day tracker.
- **SUPERSEDES:** Static due-date display.
- **SUPERSEDED BY:** OS notifications remain a future, separate plan.
- **NOTES:** No persisted overdue flag and no notification permission are allowed in this slice.

### `2026-08-21-borrowed-hardening.md`

- **PLAN:** URL state, indexed reads, resources, Signal Forms, 70rem shell, bounded rendering,
  browser and Android acceptance.
- **STATUS:** PARTIALLY COMPLETE.
- **PRIORITY:** Historical implementation baseline.
- **DEPENDENCIES:** Handoff Ledger.
- **LIKELY FILE OWNERSHIP:** None as one broad re-execution; active Stage 1 owns later async work.
- **OVERLAPS:** Nearly all data/features/i18n/styles plus native delivery.
- **SUPERSEDES:** Earlier implementation details for routing/forms/async/layout.
- **SUPERSEDED BY:** Audit Stage 0/1 for correctness and reactive data flow; SCSS plans for styles.
- **NOTES:** Tasks 1-8 are visibly represented in code. Fresh full browser/device acceptance is
  not proven, and the plan remains unchecked; do not call the complete plan done.

### `2026-08-21-scss-optimization.md`

- **PLAN:** Eight-module single-cascade SCSS ownership refactor.
- **STATUS:** PARTIALLY COMPLETE.
- **PRIORITY:** Preserve landed source architecture; do not re-run deletion tasks.
- **DEPENDENCIES:** Handoff Ledger/hardening visual contract.
- **LIKELY FILE OWNERSHIP:** None currently.
- **OVERLAPS:** Every global style module and visual browser acceptance.
- **SUPERSEDES:** Monolithic/appended style layers.
- **SUPERSEDED BY:** Pass 2 for tighter source contracts.
- **NOTES:** Manifest/modules and architecture tests exist. Plan-wide pixel/browser/Android
  evidence is not durable in its unchecked document.

### `2026-08-21-scss-optimization-pass-2.md`

- **PLAN:** Hover, token, logical geometry, duplicate-body and production-budget hardening.
- **STATUS:** PARTIALLY COMPLETE.
- **PRIORITY:** Preserve landed guards and budgets.
- **DEPENDENCIES:** SCSS pass 1.
- **LIKELY FILE OWNERSHIP:** None currently.
- **OVERLAPS:** `angular.json`, style modules, style architecture tests, design/testing docs.
- **SUPERSEDES:** Pass 1 measurements, not its module architecture.
- **SUPERSEDED BY:** None.
- **NOTES:** Current code contains the intended guards and optimized 47,832-byte source. Fresh
  browser pixel equality and Android update are not proven in this snapshot.

### `2026-08-21-borrowed-audit-stage-0.md`

- **PLAN:** Compiler, return chronology, canonical attention ordering, Add correctness and History
  async-state baseline.
- **STATUS:** COMPLETE in implementation; published integration provenance is defective.
- **PRIORITY:** Preserve; do not re-execute.
- **DEPENDENCIES:** Settled hardening implementation.
- **LIKELY FILE OWNERSHIP:** None currently.
- **OVERLAPS:** Stage 1 future feature/service work and current full-suite gate.
- **SUPERSEDES:** Older audit assumptions contradicted by current code.
- **SUPERSEDED BY:** Final-verification plan for closeout evidence.
- **NOTES:** Functional commits and the typed cleanup exist in current code. The state-based Add
  timing repair and shared deferred helper landed in `c7100bb`; do not repeat them. Fresh full
  tests, lint/format, typecheck, build and diff checks are green on the current working tree.

### `2026-08-21-borrowed-audit-stage-0-final-verification.md`

- **PLAN:** Typed cleanup and coherent Stage 0 release-candidate verification.
- **STATUS:** COMPLETE in code/evidence; not attributable as an isolated commit.
- **PRIORITY:** Historical evidence; do not re-execute.
- **DEPENDENCIES:** Stage 0 commits through `329bdac`.
- **LIKELY FILE OWNERSHIP:** None currently.
- **OVERLAPS:** Stage 1 Task 4/6 eventually touches feature tests; all global gates.
- **SUPERSEDES:** Earlier Stage 0 completion claim where evidence is stale.
- **SUPERSEDED BY:** None.
- **NOTES:** Its owner diagnosed the draft-error timing assertion, changed it to state-based
  waiting, and recorded focused/full/browser evidence. The cleanup landed inside the over-broad
  published `c7100bb` rather than the required isolated commit. Do not rewrite history; retain this
  as a process defect and use current code as authoritative.

### `2026-08-21-borrowed-audit-stage-1.md`

- **PLAN:** Presentation-neutral reads, application service split, Dexie `liveQuery`, cross-tab
  updates, removal of global revision.
- **STATUS:** ACTIVE (Task 1 COMPLETE; Task 2 PARTIALLY COMPLETE; Task 4 command and non-record
  extraction PARTIALLY COMPLETE).
- **PRIORITY:** Finish the active non-record handoff, then close Task 2 acceptance before Task 3 or
  query-service work.
- **DEPENDENCIES:** Stage 0 implementation is present. Task 1 landed in `50884e7`; Task 2 code was
  bundled in `c7100bb`; command extraction landed in `5425e25`; the first non-record slice landed
  in `7377199` with an active dirty closeout described below.
- **LIKELY FILE OWNERSHIP:** The current non-record closeout owns only the paths listed in the dirty
  snapshot. Future Task 2/3/query work is UNKNOWN — RECHECK BEFORE EDITING.
- **OVERLAPS:** Every Stage 1 task overlaps another through `BorrowedApp`; Task 4/6 overlaps most
  feature pages. It is not safe to parallelize internally in this checkout.
- **SUPERSEDES:** Revision-driven whole-app invalidation and Person's Promise-writing effect.
- **SUPERSEDED BY:** None.
- **NOTES:** Task 2 raw remaining values exist, but its zero-read characterization and browser
  acceptance remain unsettled. The old Prettier blocker is now green on the current tree.
  `BorrowedApp` still owns every query and the global revision; do not start liveQuery or remove
  revision until query-service contracts are characterized and migrated.

### `2026-08-21-borrowed-non-record-service-decomposition.md`

- **PLAN:** Extract settings, record draft, backup/export and reactive current-day ownership.
- **STATUS:** PARTIALLY COMPLETE at published HEAD; COMPLETE on the active verified working tree.
- **PRIORITY:** Finish as one coherent handoff; do not recreate or split its dirty closeout.
- **DEPENDENCIES:** `RecordsCommandService` in `5425e25`; recovery/raw export in `0342283`.
- **LIKELY FILE OWNERSHIP:** Exact dirty snapshot above. Query-side feature behavior is excluded.
- **OVERLAPS:** `BorrowedApp`, application initialization, Add, Settings, Home, Detail, shared
  LoanRow consumers, persistence tests and Stage 1 documentation.
- **SUPERSEDES:** `CurrentDayTracker` and non-record methods previously published by `BorrowedApp`.
- **SUPERSEDED BY:** None.
- **NOTES:** Four focused services and direct callers exist. Full current gates pass 50 files / 272
  tests, lint/format, typecheck, production build and diff check. Query services, liveQuery and
  revision removal remain outside this plan.

### Audit modernization Stages 2-4

- **PLAN:** Persistence/recovery; component/domain contract cleanup; scale/PWA/release.
- **STATUS:** WAITING.
- **PRIORITY:** After Stage 1, in that dependency order.
- **DEPENDENCIES:** A dedicated current-state plan for each stage and green previous stage.
- **LIKELY FILE OWNERSHIP:** Not yet claimable; mark `UNKNOWN — RECHECK BEFORE EDITING`.
- **OVERLAPS:** Stage 2 touches schema/mappers/settings/backup/mutations; Stage 3 touches domain,
  i18n and feature decomposition; Stage 4 touches search, PWA, versions, CI and native delivery.
- **SUPERSEDES:** Audit debt descriptions only after implementation and verification.
- **SUPERSEDED BY:** None.
- **NOTES:** Design sections are not executable plans. Do not start from them without a fresh
  implementation plan and ownership reconciliation.

## File ownership / conflict map

The tree contains the active non-record closeout described above. Recheck Git immediately before
claiming a row because the remaining Stage 1 tasks share application contracts.

| Path / area                                                | Current owner/task                                   | Safe for parallel work?                             | Notes                                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `docs/superpowers/plans/0000-ACTIVE-CODEX-COORDINATION.md` | Active non-record closeout                           | Documentation updates only                          | Current reconciliation; never replace wholesale                        |
| `src/app/architecture-boundaries.spec.ts`                  | No active owner proven                               | Recheck before editing                              | Published no-dependency characterization guard                         |
| Stage 0 final-verification plan                            | No active owner proven                               | Recheck before editing                              | Committed in `c7100bb`; historical evidence                            |
| `src/app/testing/deferred-promise.ts`                      | No active owner proven                               | Tests only after fresh claim                        | Shared helper committed in `c7100bb`                                   |
| `src/app/domain/`                                          | Stage 1 Tasks 3/6 planned; no active owner proven    | No during Stage 1                                   | `domain/types.ts` i18n dependency is known debt                        |
| `src/app/application/`                                     | Active non-record closeout                           | **No**                                              | Four services are published; task-owned formatting/spec cleanup dirty  |
| `src/app/data/`                                            | Active non-record closeout                           | **No**                                              | `BorrowedApp` facade and persistence-test migration are dirty           |
| `src/app/features/add/`                                    | Active non-record closeout                           | **No**                                              | Only task-owned formatting remains dirty                               |
| `src/app/features/detail/`                                 | Active non-record closeout                           | **No**                                              | CurrentDay consumer/spec migration is dirty                            |
| `src/app/features/home/`                                   | Active non-record closeout; Task 3 follows           | **No**                                              | CurrentDay consumer is dirty; presentation-neutral work is separate    |
| `src/app/features/history/`                                | Active non-record closeout (spec only)               | **No**                                              | CurrentDay test boundary only; production async behavior unchanged     |
| `src/app/features/lists/`                                  | Active non-record closeout (spec only)               | **No**                                              | Preserve `scope/filter/q`; do not mix Task 2 closeout                  |
| `src/app/features/people/`                                 | Active non-record closeout (spec only)               | **No**                                              | CurrentDay test boundary only; query contract unchanged                |
| `src/app/features/search/`                                 | Active non-record closeout (spec only)               | **No**                                              | Missing Task 2 zero-read characterization remains separate             |
| `src/app/features/more/`                                   | `UNKNOWN — RECHECK BEFORE EDITING`                   | Only after fresh check                              | No active plan-specific change currently proven                        |
| `src/app/features/settings/`                               | Published non-record slice; no dirty owner           | Recheck before editing                              | Uses `SettingsService` and `BackupService` directly                    |
| `src/app/ui/`                                              | Published non-record slice; no dirty owner           | Recheck before editing                              | `LoanRow` now uses `CurrentDayService`; raw balance contract remains   |
| `src/app/i18n/`                                            | No active owner proven                               | Only after fresh check                              | Future EN/LT/RU edits must move together                               |
| `src/app/layout/`                                          | Published non-record slice; no dirty owner           | Recheck before editing                              | Shell creates the root `CurrentDayService`; old tracker is removed     |
| `src/styles/` and `src/styles.scss`                        | No active source owner proven; SCSS plans historical | Yes only for an explicitly isolated style-only task | Never re-run old dead-selector deletion; browser proof required        |
| `angular.json`                                             | No active owner proven                               | Only after fresh check                              | Named styles budget is protected by tests                              |
| `tsconfig.json`                                            | No active owner proven                               | Only after fresh check                              | Strict template/standalone flags are non-negotiable                    |
| `package.json` / `pnpm-lock.yaml`                          | No active owner proven                               | No blanket changes                                  | New dependencies require explicit evidence and lockfile ownership      |
| Android files                                              | Stage 4 future; no current owner proven              | No mutation without device/package gate             | Preserve app data; build output is not source ownership                |
| iOS files                                                  | Stage 4 future; no current owner proven              | Only isolated native work after check               | No fresh Xcode/device evidence                                         |
| `.github/workflows/ci.yml`                                 | Stage 4 future; no current owner proven              | Only isolated CI task after check                   | CI currently runs audit/lint/test/typecheck/build and Android build    |

## Cross-task contracts

These are integration surfaces. Change them only in a dedicated plan with consumer tests.

### `BorrowedStore`

The abstract contract currently owns initialization/settings, Person reads, transactional loan
bundle/update writes, all/active/completed/person Loan reads, repayment/event/detail reads,
pending mutations, one Add draft, and close. Feature components must never receive a Dexie table
or row type. Stage 1 may add one typed observable read boundary, but existing indexed methods stay
inside it until measurements prove otherwise.

`DetailPage` currently imports the `LoanRecord` type from this data port. The import-boundary guard
allows exactly that one type edge so current HEAD stays green; it is not permission for features to
import more store contracts. Stage 1 Task 4 must publish the detail query shape from the application
layer before removing this exception.

### Domain entity shapes

- `Person`, `Loan`, `Repayment`, `LoanEvent`, `LocalSettings`, `RecordDraft`, and `SyncMutation` are
  durable application contracts.
- `Loan.originalMinorUnits` and `Repayment.minorUnits` are bigint in domain, decimal strings in
  rows/export.
- `Loan.status` is stored; events do not reconstruct it.
- A Loan points to stable `personId` and retains `personNameSnapshot`.
- Deletion-aware consumers must exclude `deletedAt !== null`; do not assume every store method
  currently filters repayments.

### `LocalSettings` and identity

`id: 'local'`, UUIDv7 `localIdentityId`, preferred currency/language, schema version, record
version, created/updated instants. The identity is installation-local and not a credential.
First-run creation is transactionally serialized on the primary key and covered with two-store
concurrency/reload tests. Stage 1 work must not redefine identity semantics.

### Export/backup

Current `exportJson()` returns an unversioned JSON object containing `app`, `exportedAt`, a trimmed
settings object, people, loans, and repayments with bigint decimal strings. There is no validated
import, transactional restore, archive manifest, integrity decoder, or backup guarantee. Treat
this as an existing export shape, not a stable versioned backup contract. Stage 2 must version,
decode, preview, validate, and import atomically before claiming backup/restore.

### Mutation queue

Current queue rows are `{ id, entityType, entityId, operation, payloadJson, createdAt, ackedAt,
attempts, lastError }`. They are appended transactionally for current mutations. There is no drain,
acknowledgement client, retention, compaction, conflict UI, or remote protocol implementation.
Do not change payload/retention while Stage 1 query propagation is active; Stage 2 owns that
format/migration decision.

### Translation catalogs

`src/app/i18n/en.ts` is the structural reference; `lt.ts` and `ru.ts` must have identical keys,
plural shape, and placeholder sets. Locale metadata lives in each locale definition and
`catalog.ts` derives supported languages. New UI copy changes all three files plus parity tests in
one slice. Locale changes must reformat presentation without re-reading IndexedDB after Stage 1.

### Router and URL state

- Stable routes include `/`, `/records`, `/lent`, `/borrowed`, `/add`, `/loans/:id`, `/search`,
  `/people`, `/people/:id`, `/history`, `/settings`, and `/more`.
- Feature routes are lazy and carry a `titleKey`; unknown routes redirect Home.
- Records URL state uses optional `scope=all|lent|borrowed`,
  `filter=items|money|overdue|due_soon`, and normalized `q`. Defaults are omitted. Preserve
  unrelated query parameters and Back/Forward restoration.
- Person-to-Add preselection uses `?personId=<stable-id>`.

### Active component/view-model migration

At HEAD, `LoanRow` accepts `loan: Loan` and
`remainingMinorUnits: bigint | null`, injects `CurrentDayService` for due distance, and formats the
raw balance plus translated labels against the current locale. Lists, Search and Person have been
migrated as one committed consumer set in `c7100bb`. The API is code-authoritative even though
Task 2 acceptance is incomplete: do not create a second temporary row API, edit only one consumer,
or restore the previous formatted-string input.

## Required pre-flight for every worker

1. Read `AGENTS.md`, the assigned task, and this coordination file in full.
2. Run `git rev-parse HEAD` and compare it with this baseline; if changed, reconcile this file.
3. Run `git status --short --branch` and identify staged, unstaged, and untracked paths.
4. Run `git diff --stat`, `git diff`, `git diff --cached --stat`, and `git diff --cached`.
5. Read at least the last 40 commits and inspect path lists for recent overlapping slices.
6. Read the relevant newest specification and plan, then compare every request with current code.
7. Identify exact file ownership, interfaces, dirty overlaps, tests, risk, and done criteria.
8. Update/reconcile the task plan immediately; do not stop after planning.
9. For behavior, write the smallest meaningful failing regression and prove the expected RED.
10. Implement the smallest correct slice without touching foreign work.
11. Run focused tests and prove GREEN; refactor only within the owned slice and rerun.
12. Inspect owned unstaged/staged diffs and scan them for unsafe TypeScript escapes, secrets,
    hardcoded UI copy, direct Dexie imports, accidental generated files, and translation drift.
13. Run broader gates sequentially: audit, lint, full tests, typecheck, production build,
    `git diff --check`; add browser/native evidence when the task changes those surfaces.

If HEAD or dirty state changes during any step, stop editing, re-run steps 2-7, and reconcile rather
than continuing from a stale mental model.

## Required post-task handoff

Every worker must leave a durable handoff containing:

- task completed and exact remaining scope;
- files changed, separated from foreign dirty/staged files;
- tests added and the observed RED reason;
- commands run with exit status and exact file/test counts;
- current full HEAD SHA and branch divergence;
- plan checkboxes/evidence updated honestly;
- unresolved failures, flaky behavior, external blockers, and deferred acceptance;
- new or changed architecture/data/router/i18n contracts;
- browser viewport/profile and native device/package evidence, or an explicit statement that it
  was not run;
- anything the next task must know before touching shared files.

Do not write “all green”, “complete”, “browser verified”, or “installed” without fresh output from
the proving command/runtime in the same task.

## Quality contract for all Codex workers

### A. PLAN FIRST

Before implementation, inspect actual code, reconcile existing plans, identify exact files and
tests, assess risks and overlaps, and define done criteria. Then immediately implement the owned
slice. Do not stop after planning.

### B. USE RED -> GREEN -> REFACTOR

For every behavioral change:

1. Create the smallest meaningful failing test.
2. Run it and prove failure is for the expected reason.
3. Implement the minimum correct behavior.
4. Prove the focused test is green.
5. Refactor only after green.
6. Rerun focused and adjacent tests.

Never add a post-hoc test merely describing the implementation unless the task explicitly
characterizes legacy behavior or adds a non-behavioral architecture guard.

### C. DEFEND TYPE SAFETY

Treat `any`, `$any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, and
non-null assertions as code smells. Search the complete changed diff before handoff. Never use one
only to silence the compiler. Narrow unknown data at a trusted boundary.

### D. DEFEND ASYNC CORRECTNESS

For every asynchronous UI flow, cover stale response ordering, cancellation, duplicate
submission, component destruction, route-parameter changes, retry, loading, empty, error,
success, and cross-tab updates where relevant.

Prefer `computed` for synchronous derivation, `resource` for parameterized cancellable reads,
Dexie `liveQuery` behind the store for reactive persistence, and explicit command methods for
writes. Do not use `effect + Promise + signal mutation` when a declarative read primitive fits.

### E. DEFEND DATA CORRECTNESS

For persistence changes, verify atomicity, multi-tab behavior, migration safety, soft-deleted
rows, partial failure, corrupt persisted data, reload behavior, stable identity, query bounds, and
no accidental N+1 reads. Never “recover” by deleting the database.

### F. DEFEND DOMAIN PURITY

Domain must not import Angular, Dexie, Capacitor, Electron, DOM/browser APIs, or UI translation
catalogs. Business invariants are implemented once in domain/application commands, not copied
into components. The existing `domain/types.ts -> i18n/catalog.ts` edge is debt to remove, not a
precedent.

### G. DEFEND PERFORMANCE

Before calling anything optimized, measure it or prove it structurally. Check IndexedDB query
count, indexes/full-table scans, locale-triggered reads, duplicate reads, N+1 patterns, large-list
rendering, and bundle impact for dependency/config changes.

### H. DEFEND ACCESSIBILITY

UI work must verify keyboard operation, visible focus, semantic controls, appropriate
`aria-live`/status/alert behavior, no clickable divs, at least 44px intended targets, reduced
motion, 200% reflow, and mobile/desktop behavior. Use an isolated real browser after rendered UI
or routing changes.

### I. DEFEND I18N

Every new user-visible message exists in EN, LT, and RU with identical key structure, equivalent
placeholders, and equivalent plural contracts. User data is not concatenated into translated
fragments. Locale-only changes do not trigger persistence reads after Stage 1.

### J. DEFEND SECURITY/PRIVACY

Never log private record bodies, render raw corruption payloads/errors, claim IndexedDB
encryption, expose secrets, add unsafe `innerHTML`, or trust imported/IndexedDB JSON through a
TypeScript assertion alone. Treat persisted and imported data as untrusted at decoder boundaries.

### K. DEFEND DEPENDENCY QUALITY

Before installing anything, prove the current stack is insufficient and inspect maintenance,
bundle cost, security and license implications. Do not blanket-upgrade dependencies as part of
another task. Update `package.json` and `pnpm-lock.yaml` together only with explicit ownership.

## Automated architecture / quality guards

### Present and enforced

- `tsconfig.json`: strict TypeScript, strict templates, strict standalone.
- `src/app/i18n/i18n.spec.ts`: EN/LT/RU key, plural and placeholder parity.
- `src/app/styles-architecture.spec.ts`: ordered import-only SCSS entrypoint, selector ownership,
  hover gating, overwritten/no-op declaration checks, logical geometry, token use, source budget,
  and production styles budget configuration.
- `src/app/design-system.spec.ts`: palette, no gradient/glass, focus, responsive shell, icon,
  list containment and mobile-row contracts.
- `src/app/app.routes.spec.ts`: lazy feature routes, page-title keys and recovery route.
- `src/app/app.config.spec.ts`: persistence/language initialization, dev-only seed and production
  service worker boundary.
- `src/app/data/persistence-provider.spec.ts`: historical production database-name preservation.
- `src/app/native-config.spec.ts`: Android automatic backup remains disabled.
- `src/app/architecture-boundaries.spec.ts`: production import boundaries for domain and
  presentation layers. It permits only the two documented temporary edges and reports exact
  `path -> specifier` failures; focused evidence is 4/4 passing.
- Domain, fake-indexedDB integration, application and TestBed component suites cover current
  commands, transactions, migrations, resource states and primary UI contracts.
- CI runs frozen install, high-severity audit, lint, tests, typecheck, production build and a Java
  21/API 36 Android debug build.

### Remaining candidates not added

- A global TypeScript-escape regex would mix production smells with intentional test fixtures and
  existing assertions; add a production-only parser/allowlist guard in a separate characterized
  slice rather than a noisy grep test.
- Hardcoded user-visible-string detection is not reliable across templates, domain event keys and
  test fixtures without parsing and an explicit allowlist.
- Do not freeze the transient `BorrowedApp`/service surface while Stage 1 is splitting it.
- After Stage 1, first remove the two import-boundary exceptions, then consider production-only
  TypeScript escape detection, version synchronization, generated-artifact hygiene and plan-status
  sanity. Every guard must report actionable paths and add no dependency unless justified.

## Known integration hazards

| Severity     | Hazard                                                                                                                                                                                                                   | Required resolution/order                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRITICAL** | `AGENTS.md`/environment text says IndexedDB `borrowed-app`, but production code and preservation test use historical `borrowed`. Renaming would hide existing user data.                                                 | Treat `borrowed` as authoritative. Resolve documentation separately; any future rename requires a tested in-place data migration and rollback.                                            |
| **HIGH**     | Published `c7100bb` has a documentation-only subject but combines Stage 0, Task 2 and coordination changes in one 15-file commit.                                                                                        | Do not amend, reset, rebase or force-push published history. Record its true scope here; require exact path review and single-task commits for every future slice.                        |
| **HIGH**     | Task 2 code is committed while its plan boxes, empty/whitespace zero-read characterization, clean-HEAD gates and browser acceptance remain incomplete.                                                                   | Close evidence with a dedicated minimal follow-up before Task 3. If the characterization exposes a defect, stop and claim the exact production fix rather than folding it into Home work. |
| **HIGH**     | Stage 1 Tasks 3-6 all touch `BorrowedApp`; Tasks 4/6 touch most features.                                                                                                                                                | Execute serially with intermediate-green commits; do not parallelize product work inside Stage 1.                                                                                         |
| **HIGH**     | Removing global revision while introducing liveQuery changes query invalidation and cross-tab behavior simultaneously.                                                                                                   | Establish typed query services and transaction-specific live-query tests before deleting revision/touch.                                                                                  |
| **HIGH**     | Normal export is intentionally unversioned and no decoded transactional import exists.                                                                                                                                   | Use `BackupService` only for current export; keep `BackupImportPort` unimplemented until a separate versioned restore plan supplies validation, preview, atomicity and rollback.           |
| **MEDIUM**   | Task 2's empty-search acceptance is structurally implemented through an undefined `resource` request, but no test observes the boundary and proves zero `search()`/`remainingMap()` calls for empty or whitespace input. | Add a focused spy-based characterization; keep the stale-generation test. Do not manufacture RED for pre-existing behavior.                                                               |
| **MEDIUM**   | `domain/types.ts` imports the i18n catalog while Stage 1 makes summaries presentation-neutral and Stage 3 plans domain-purity repair.                                                                                    | Stage 1 removes locale-shaped query output first; Stage 3 then moves the language type inward without a second competing type.                                                            |
| **MEDIUM**   | `DetailPage` imports the `LoanRecord` type from the data-layer store contract.                                                                                                                                           | Do not add more feature-to-store imports. Publish the detail view/query shape from the Stage 1 application service, migrate Detail, then remove the exact guard exception.                |
| **MEDIUM**   | Lists router URL state and Stage 1 resource/live-query params are coupled.                                                                                                                                               | Preserve `scope/filter/q` serialization and Back/Forward tests while changing query services.                                                                                             |
| **LOW**      | The filesystem briefly reached 143 MiB free and caused `ENOSPC`; about 16 GiB was available at 14:47 after external recovery.                                                                                            | Recheck free space before native packaging or a long gate, but do not delete caches or user/other-worker data from an unrelated task.                                                     |
| **LOW**      | Historical plan status is misleading because some implemented work remains unchecked.                                                                                                                                    | Use actual code plus this coordination status; update only the active plan with fresh evidence.                                                                                           |

## Immediate executable plan for the current dirty baseline

This sequence is valid only while HEAD remains `7377199` and the dirty paths still match the
snapshot above. Any new path or HEAD change requires a fresh status/diff/log reconciliation.

### Lane A — finish the non-record service handoff

- **OWNER:** Current non-record decomposition task.
- **FILES:** Only the dirty paths listed in the snapshot above.
- **WORK:** Preserve published service implementations, finish direct Home/Detail/current-day and
  persistence-test migration, remove extracted APIs from `BorrowedApp`, keep query behavior intact,
  and record honest completion evidence.
- **ACCEPTANCE:** Focused service/caller/persistence matrices and 50 files / 272 tests pass;
  ESLint/Prettier, typecheck, production build and diff check pass; no schema, store port, domain,
  i18n, style or dependency change enters the slice.
- **HANDOFF:** Do not start query services, liveQuery or revision removal from this lane.

### Lane B — next work after Lane A is settled

- **OWNER:** `UNKNOWN — RECHECK BEFORE EDITING`.
- **WORK:** Close Stage 1 Task 2's empty/whitespace zero-read characterization and browser evidence,
  then re-plan presentation-neutral Home (Task 3) against the new service surface.
- **SERIAL RULE:** Query-service extraction follows Task 3; liveQuery follows characterized query
  services; revision removal follows relevant/unrelated write and second-tab propagation tests.

### Checkpoint — re-plan before Task 3

After Task 2 closes, re-read HEAD, dirty/staged state, the last 40 commits and this file. Create a
bounded Task 3 plan with two intermediate-green slices: first an additive raw Home-summary domain
contract, then the `BorrowedApp`/Home consumer migration and removal of obsolete localized fields.
Only after that checkpoint may Tasks 4-6 be decomposed against the actual service surface. The
serial dependency remains Task 3 → services → live query → revision removal.

## Recommended execution ordering

1. **Non-record decomposition handoff:** settle the verified dirty continuation on `7377199` as one
   coherent slice. Stage 0 and the four services must not be restarted.
2. **Stage 1 Task 2 closeout:** add the missing empty/whitespace-search zero-read characterization,
   reconcile the published `c7100bb` scope in its plan, and run the required browser locale checks.
   Do not duplicate the raw-balance implementation or rewrite published history.
3. **Stage 1 Task 3:** make Home summary presentation-neutral; remove locale from its query.
4. **Stage 1 Task 4 remainder:** characterize and introduce query services, then migrate feature
   query injection one slice at a time. Command and non-record services already exist.
5. **Stage 1 Task 5:** add the store-owned typed Dexie live-query bridge with relevant/unrelated
   transaction and second-instance tests.
6. **Stage 1 Task 6:** migrate reads and only then remove `revision`/`touch`.
7. **Stage 1 browser closeout:** verify two-tab propagation, route reuse, locale-only rendering,
   async states and full gates.
8. **Stage 2:** atomic settings initialization, runtime row/backup decoders, recovery shell,
   mutation retention and versioned transactional import.
9. **Stage 3:** split large components, type i18n keys/params, repair domain dependency direction,
   and add precise architecture guards.
10. **Stage 4:** bound/measure Home/history/search, PWA update UX, version sync, browser E2E,
    native/release CI and physical-device evidence.

Do not package/install an APK from a source tree whose full tests/lint/build or browser acceptance
is red.

## Parallel-safe task groups

### Safe now

- Read-only review of old specs/commits can run concurrently because it mutates nothing.
- No product implementation is safe in parallel with the active non-record closeout because its
  dirty caller specs and `BorrowedApp` overlap every remaining Stage 1 lane.

### Not safe now

- No new product implementation may start until the non-record closeout is handed off and Task 2
  closes its missing test/plan/browser evidence.
- Stage 1 Tasks 2 and 3 are not acceptance-parallel: Task 3 must start from Task 2's green, settled
  contract even if Task 2's remaining source files do not include `BorrowedApp`.
- Stage 1 Tasks 4-6 are strictly serial: service boundaries must exist before liveQuery, and
  liveQuery/relevant-write tests must exist before removing revision.
- Stage 2 persistence subprojects are not parallel-safe until exact decoder/schema/backup and
  mutation ownership is decomposed into separate plans; they share Dexie transactions and version
  contracts.
- Browser/PWA/native acceptance follows a stable tested source commit. It is verification, not a
  parallel substitute for incomplete implementation.

### Potential future parallel group, only after Stage 1 is green

- A path-isolated documentation/ADR task and a precise quality-guard task may run together if
  neither touches Stage 2 production paths and both use separate explicit staging ownership. No
  future product pair is declared safe in advance; recheck current code and ownership first.
