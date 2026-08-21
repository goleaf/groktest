# ⚠️ THIS FILE MUST BE READ BEFORE EXECUTING ANY OTHER PLAN OR CODEX TASK IN THIS REPOSITORY.

> **Live shared-checkout warning:** this repository is being changed by multiple workers. This
> document is a coordination snapshot, not permission to trust stale state. Re-run the pre-flight
> below immediately before every edit, test, stage, commit, package, browser run, or device action.
> Actual code at the current HEAD, the newest approved specification, and explicit user
> requirements override an older plan or unchecked checkbox.

## Current repository baseline

Snapshot reconciled at **2026-08-21T14:36:52+03:00** (`Europe/Vilnius`).

| Item                             | Verified baseline                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Repository                       | `goleaf/groktest`                                                                                       |
| HEAD                             | `50884e76e8f28e27a367ad25766b51f6e6b5282c` (`50884e7`, `fix(people): make person reads route reactive`) |
| Branch                           | existing `main`, four commits ahead of `origin/main` at snapshot time                                   |
| Package manager                  | pnpm `10.33.0`                                                                                          |
| Angular                          | packages `22.1.3`; CLI/build `22.1.5`                                                                   |
| TypeScript                       | `6.0.3`                                                                                                 |
| Dexie                            | `4.4.5`                                                                                                 |
| Capacitor                        | Android/Core/iOS/CLI `8.5.0`                                                                            |
| RxJS                             | `7.8.2`                                                                                                 |
| Vitest / jsdom                   | `4.1.11` / `28.1.0`                                                                                     |
| Electron                         | `43.4.1` development shell                                                                              |
| Local schema                     | Dexie schema v3                                                                                         |
| Actual production IndexedDB name | `borrowed` in `provideBorrowedPersistence()`; see the critical documentation mismatch below             |
| Automated test inventory         | 41 `*.spec.ts` files; 186 tests in the current mixed Stage 0/Stage 1 Task 2 tree                        |
| Authored SCSS                    | 2,821 lines / 47,832 bytes across `src/styles.scss` and `src/styles/*.scss`                             |

### Fresh gate evidence at this snapshot

- `pnpm test`: at 14:27 the coordinator freshly observed 41 files / 186 tests pass in the exact
  mixed tree containing the Stage 0 closeout slice and the uncommitted Stage 1 Task 2 changes.
  The focused Task 2 matrix (`dexie-store`, Lists, Person, Search and `LoanRow`) also passed 5 files
  / 30 tests immediately beforehand. Earlier Stage 0 red/timing history and its state-based repair
  remain recorded in the final-verification plan; this new green run does not transfer ownership
  or replace each active owner's focused RED/GREEN evidence. At 14:36, the coordinator refreshed
  the focused Search suite alone: 1 file / 4 tests passed.
- `pnpm audit --audit-level high`: exited 0 at the configured threshold with one moderate advisory
  and no high/critical advisory.
- `pnpm lint`: **not green**. Angular ESLint passed, but repository-wide Prettier reported exactly
  `src/app/features/lists/list-page.ts` and `src/app/features/people/person-page.ts`, both owned by
  active Stage 1 Task 2. The coordinator did not format or otherwise alter those foreign files.
- `pnpm typecheck`: passed the Angular development build with strict templates/standalone checks.
- `pnpm build`: passed; production styles were 37.92 kB raw / 6.58 kB estimated transfer, below
  the named 38.5 kB warning budget.
- `git diff --check`: exited 0 after the gate sequence. The coordination document itself is
  Prettier-formatted; the only aggregate formatting failures are the two Task 2 files above.
- No browser, PWA offline, native build, APK installation, or physical-device claim was refreshed
  by this coordinator snapshot.

The mixed history above is intentional: it records the reproduced failure, its targeted repair,
and the later green runs without treating a shared-tree pass as proof for either owner's slice.
Re-run all gates from one stable tree after Stage 0 settles its index and again at each Stage 1
handoff.

### Current dirty/staged ownership snapshot

The following paths are **foreign staged work** owned by the active Stage 0 final-verification
slice. Do not edit, unstage, restore, commit, format, or otherwise absorb them:

- `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-0-final-verification.md` (added in the
  index and also modified unstaged while its owner records evidence; `AM`)
- `src/app/features/add/add-page.spec.ts` (modified, staged, and modified again unstaged by the
  Stage 0 timing repair; `MM`)
- `src/app/features/add/add-page.ts` (modified, staged)
- `src/app/features/history/history-page.spec.ts` (modified, staged)
- `src/app/testing/deferred-promise.ts` (added, staged)

Stage 1 Task 1 and its plan evidence were committed atomically as `50884e7`. A Stage 1 Task 2 owner
is now actively changing the raw remaining-balance contract. Treat all of these **foreign
unstaged** paths as one indivisible Task 2 slice:

- `src/app/data/borrowed-app.ts`
- `src/app/data/dexie-store.spec.ts`
- `src/app/features/lists/list-page.spec.ts`
- `src/app/features/lists/list-page.ts`
- `src/app/features/people/person-page.ts`
- `src/app/features/search/search-page.spec.ts`
- `src/app/features/search/search-page.ts`
- `src/app/ui/loan-row.spec.ts`
- `src/app/ui/loan-row.ts`

The Stage 1 plan names seven of those paths. `dexie-store.spec.ts` verifies the changed
`remainingMap()` boundary and `person-page.ts` is a required `LoanRow` consumer, but this expanded
ownership must be reconciled in the Task 2 plan/handoff before commit. Do not edit, format, stage,
restore or partially commit any of these paths from another task.

The coordinator alone owns the untracked
`docs/superpowers/plans/0000-ACTIVE-CODEX-COORDINATION.md`.

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
- `src/app/data/borrowed-app.ts` is the current broad application facade. It owns explicit
  commands, query composition, the current global `revision`, current-day state, draft handling,
  settings and export. The active Task 2 tree has already made Records/Search remaining values
  presentation-neutral; Home still returns locale-shaped actions. Stage 1 may split this facade
  only in reviewed, intermediate-green slices.
- `src/app/data/store.ts` is the persistence port. `dexie-store.ts`, `database.ts`, `rows.ts`, and
  `mappers.ts` are the Dexie adapter and the only production Dexie boundary.
- `src/app/features/` owns route-level loading/error/empty/success state and interaction wiring. It
  calls application services/facades, not Dexie.
- `src/app/ui/` owns reusable presentation. In the active Task 2 tree, `LoanRow` accepts raw
  `bigint | null` remaining minor units and formats them against the current locale. It still
  injects `BorrowedApp` for `daysUntilDue`; do not add more service coupling to UI primitives.
- `src/app/i18n/` owns independent EN/LT/RU catalogs, locale metadata, parameter/plural contracts,
  and formatting presentation.
- `src/app/layout/` owns shell, navigation, current-day refresh, focus, and page-title behavior.
- `capacitor.config.ts`, `android/`, `ios/`, and `electron/` are delivery boundaries. A feature
  must consume a small application interface before using a platform implementation.

The intended inward dependency rule is stricter than current code: `domain/types.ts` currently
imports `SupportedLanguage` from `i18n/catalog.ts`. This is known architecture debt from the
modernization design. Do not broaden the exception. Stage 3 must move the shared language type to
an inward-neutral contract so domain no longer imports UI catalogs.

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
- In the active Task 2 tree, Records/Search resource parameters no longer include locale, and
  `remainingMap()` plus `LoanRow` exchange raw minor units. This is uncommitted and is not a stable
  contract until its owner reconciles the expanded file set, updates the plan and completes the
  handoff.
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
- **STATUS:** PARTIALLY COMPLETE.
- **PRIORITY:** Highest until final verification settles.
- **DEPENDENCIES:** Settled hardening implementation.
- **LIKELY FILE OWNERSHIP:** Final verification owns the staged Add/History/helper cleanup.
- **OVERLAPS:** Stage 1 future feature/service work and current full-suite gate.
- **SUPERSEDES:** Older audit assumptions contradicted by current code.
- **SUPERSEDED BY:** Final-verification plan for closeout evidence.
- **NOTES:** Functional commits exist. The coordinator reproduced a timing-sensitive failure; the
  final-verification owner repaired its assertion and records later green runs. Keep this parent
  plan partial until the active closeout slice is settled; do not infer completion from boxes alone.

### `2026-08-21-borrowed-audit-stage-0-final-verification.md`

- **PLAN:** Typed cleanup and coherent Stage 0 release-candidate verification.
- **STATUS:** ACTIVE.
- **PRIORITY:** Highest.
- **DEPENDENCIES:** Stage 0 commits through `329bdac`.
- **LIKELY FILE OWNERSHIP:** Exactly the five paths listed in the baseline, including both index and
  worktree layers of `add-page.spec.ts`; source Stage 0 plan may be updated after evidence.
- **OVERLAPS:** Stage 1 Task 4/6 eventually touches feature tests; all global gates.
- **SUPERSEDES:** Earlier Stage 0 completion claim where evidence is stale.
- **SUPERSEDED BY:** None.
- **NOTES:** Its owner diagnosed the draft-error timing assertion, changed it to state-based
  waiting, and records repeated focused plus full green runs. The slice remains active because its
  plan is `AM`, `add-page.spec.ts` is `MM`, and no attributable commit/handoff has settled it yet.

### `2026-08-21-borrowed-audit-stage-1.md`

- **PLAN:** Presentation-neutral reads, application service split, Dexie `liveQuery`, cross-tab
  updates, removal of global revision.
- **STATUS:** ACTIVE (Task 1 COMPLETE; Task 2 PARTIALLY COMPLETE in the current dirty tree).
- **PRIORITY:** Task 2 may be finished only by its current owner after Stage 0's foreign index is
  settled; do not start Task 3 or another product slice.
- **DEPENDENCIES:** Stage 0 functional commits exist; final-verification files remain staged. The
  Stage 1 plan was formatted in `7cdb4c3`; Task 1 implementation and evidence landed in `50884e7`.
- **LIKELY FILE OWNERSHIP:** The active Task 2 owner holds the nine unstaged paths listed in the
  baseline. Seven are named by the plan; the Dexie integration spec and Person consumer are a
  necessary but not yet documented scope expansion. Future tasks broaden ownership to Home,
  domain summaries, store/Dexie, application services and most feature specs.
- **OVERLAPS:** Every Stage 1 task overlaps another through `BorrowedApp`; Task 4/6 overlaps most
  feature pages. It is not safe to parallelize internally in this checkout.
- **SUPERSEDES:** Revision-driven whole-app invalidation and Person's Promise-writing effect.
- **SUPERSEDED BY:** None.
- **NOTES:** Task 2 currently implements raw remaining values across `BorrowedApp`, Lists, Search,
  Person and `LoanRow`; 5 focused files / 30 tests and the mixed-tree 41 files / 186 tests passed
  in this coordinator run. The stale-search-generation regression remains present, but the plan's
  separate requirement that an empty/whitespace global search perform no IndexedDB read is not yet
  proved by a spy/assertion characterization: the initial-guidance test uses unobserved async
  stubs. This behavior predates Task 2, so fabricating a RED state is neither required nor honest.
  The task remains partial because that characterization, RED evidence for its actual behavioral
  changes, plan checkboxes, expanded ownership, browser acceptance and attributable commit/handoff
  are not yet settled.

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

`Safe for parallel work?` assumes the current mixed Stage 0/Stage 1 state. A clean path is not
automatically unowned.

| Path / area                                                | Current owner/task                                       | Safe for parallel work?                             | Notes                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `docs/superpowers/plans/0000-ACTIVE-CODEX-COORDINATION.md` | Coordinator                                              | Documentation updates only                          | Reconcile, never replace wholesale                                   |
| Stage 0 final-verification plan                            | Stage 0 final verification                               | No                                                  | Foreign `AM`: staged add plus unstaged evidence update               |
| `src/app/testing/deferred-promise.ts`                      | Stage 0 final verification                               | No                                                  | Foreign staged add                                                   |
| `src/app/domain/`                                          | Stage 1 Tasks 3/6 planned; no dirty source owner proven  | No during Stage 1                                   | `domain/types.ts` i18n dependency is known debt                      |
| `src/app/application/`                                     | Stage 1 Tasks 4-6 planned                                | No                                                  | Directory does not exist yet; Stage 1 owns proposed boundary         |
| `src/app/data/`                                            | Stage 1 Task 2 active                                    | **No**                                              | `BorrowedApp` and Dexie integration spec are foreign unstaged work   |
| `src/app/features/add/`                                    | Stage 0 final verification                               | **No**                                              | Component is staged; spec is `MM`; no other task may touch either    |
| `src/app/features/detail/`                                 | Stage 1 Task 6 planned; current dirty owner unproven     | No during Stage 1                                   | Resource/command contract is cross-task sensitive                    |
| `src/app/features/home/`                                   | Stage 1 Tasks 3/6 planned                                | No during Stage 1                                   | Presentation-neutral summary and revision removal overlap            |
| `src/app/features/history/`                                | Stage 0 owns staged spec; Stage 1 Task 6 later           | **No**                                              | Settle Stage 0 first                                                 |
| `src/app/features/lists/`                                  | Stage 1 Task 2 active; Task 6 later                      | **No**                                              | Preserve `scope/filter/q`; raw balance migration is dirty            |
| `src/app/features/people/`                                 | Stage 1 Task 2 owns dirty `person-page.ts`; Task 6 later | **No**                                              | Task 1 is committed; Person consumes the changing `LoanRow` contract |
| `src/app/features/search/`                                 | Stage 1 Task 2 active                                    | **No**                                              | Shares raw remaining-value contract with Lists/LoanRow               |
| `src/app/features/more/`                                   | `UNKNOWN — RECHECK BEFORE EDITING`                       | Only after fresh check                              | No active plan-specific change currently proven                      |
| `src/app/features/settings/`                               | Stage 2 future; current owner unknown                    | No persistence work yet                             | Settings initialization/backup contracts are unresolved              |
| `src/app/ui/`                                              | Stage 1 Task 2 active                                    | **No**                                              | Dirty `LoanRow` contract now accepts raw remaining minor units       |
| `src/app/i18n/`                                            | No active dirty owner proven                             | Only after Stage 0 settles and fresh check          | Task 1 keys landed; future EN/LT/RU edits must move together         |
| `src/app/layout/`                                          | `UNKNOWN — RECHECK BEFORE EDITING`                       | Only for isolated fixes after check                 | Shell uses revision/current-day and may be affected by service split |
| `src/styles/` and `src/styles.scss`                        | No active source owner proven; SCSS plans historical     | Yes only for an explicitly isolated style-only task | Never re-run old dead-selector deletion; browser proof required      |
| `angular.json`                                             | No active owner proven                                   | Only after fresh check                              | Named styles budget is protected by tests                            |
| `tsconfig.json`                                            | No active owner proven                                   | Only after fresh check                              | Strict template/standalone flags are non-negotiable                  |
| `package.json` / `pnpm-lock.yaml`                          | No active owner proven                                   | No blanket changes                                  | New dependencies require explicit evidence and lockfile ownership    |
| Android files                                              | Stage 4 future; no current owner proven                  | No mutation without device/package gate             | Preserve app data; build output is not source ownership              |
| iOS files                                                  | Stage 4 future; no current owner proven                  | Only isolated native work after check               | No fresh Xcode/device evidence                                       |
| `.github/workflows/ci.yml`                                 | Stage 4 future; no current owner proven                  | Only isolated CI task after check                   | CI currently runs audit/lint/test/typecheck/build and Android build  |

## Cross-task contracts

These are integration surfaces. Change them only in a dedicated plan with consumer tests.

### `BorrowedStore`

The abstract contract currently owns initialization/settings, Person reads, transactional loan
bundle/update writes, all/active/completed/person Loan reads, repayment/event/detail reads,
pending mutations, one Add draft, and close. Feature components must never receive a Dexie table
or row type. Stage 1 may add one typed observable read boundary, but existing indexed methods stay
inside it until measurements prove otherwise.

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
version, created/updated instants. The identity is installation-local and not a credential. The
current check-then-create initialization is not atomic across first-run tabs; Stage 2 owns the
repair. Stage 1 cross-tab work must not silently redefine identity creation.

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

In the active Task 2 tree, `LoanRow` accepts `loan: Loan` and
`remainingMinorUnits: bigint | null`, injects `BorrowedApp` only for due distance, and formats the
raw balance plus translated labels against the current locale. Lists, Search and Person have been
migrated as one dirty consumer set. This is not yet a committed contract: do not create a second
temporary row API, edit only one consumer, or restore the previous formatted-string input.

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
- Domain, fake-indexedDB integration, application and TestBed component suites cover current
  commands, transactions, migrations, resource states and primary UI contracts.
- CI runs frozen install, high-severity audit, lint, tests, typecheck, production build and a Java
  21/API 36 Android debug build.

### Not added by this coordinator

No new executable guard was added in this snapshot. Adding a broad regex checker now would either
produce false confidence or collide with active work:

- a full domain-boundary guard is correctly expected to fail on the known i18n import debt;
- a global TypeScript-escape guard would overlap the staged Stage 0 cleanup and existing
  test-only assertions;
- hardcoded user-visible-string detection is not reliable across templates, test fixtures and
  domain event keys without a parser/allowlist;
- Stage 1 is about to change the application/data boundary, so freezing its pre-split shape would
  encode a transient architecture.

Recommended guard order after Stage 1 is green: framework/Dexie import boundaries, production-only
TypeScript escape detection, generated-artifact hygiene, then plan-status sanity. Add each as a
characterization guard with actionable file/import output and no new dependency.

## Known integration hazards

| Severity     | Hazard                                                                                                                                                                                                                                  | Required resolution/order                                                                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRITICAL** | Stage 0 work remains staged and `add-page.spec.ts` is `MM` because its owner repaired the staged test in the worktree. Any normal staging/commit can collapse those layers or absorb the foreign index.                                 | Stage 0 exclusively owns both layers and must settle its attributable slice before Task 2 is staged/committed or any new product task starts. Inspect both cached and unstaged diffs.                               |
| **CRITICAL** | `AGENTS.md`/environment text says IndexedDB `borrowed-app`, but production code and preservation test use historical `borrowed`. Renaming would hide existing user data.                                                                | Treat `borrowed` as authoritative. Resolve documentation separately; any future rename requires a tested in-place data migration and rollback.                                                                      |
| **HIGH**     | The coordinator reproduced nondeterministic/red full runs; Stage 0 later repaired one timing assertion and reports repeated focused plus full green, including 183 tests with Task 1.                                                   | Preserve both facts. Stage 0 must commit/handoff its exact repair; each later Stage 1 task reruns focused and full gates from its settled slice. Never hide this with timeout increases.                            |
| **HIGH**     | Aggregate gates are time-sensitive in a live tree. The mixed tree passes tests/typecheck/build but currently fails Prettier on Task 2's dirty Lists and Person files without any HEAD change.                                           | The Task 2 owner formats only its owned files, then reruns focused and full gates. Record dirty-path identity with every result; never carry this mixed-tree evidence forward to a later commit.                    |
| **HIGH**     | Stage 1 Task 2 is active while Stage 0 still owns staged/index layers. Task 2 also expanded from seven planned files to nine by adding the Dexie integration spec and Person consumer.                                                  | Stage 0 settles first. Then the Task 2 owner must reconcile its plan/file list, inspect both Git layers, retain all nine consumers as one slice, and rerun focused/full gates before an attributable commit.        |
| **MEDIUM**   | Task 2's empty-search acceptance is structurally implemented through an undefined `resource` request, but no test currently observes the data boundary and proves zero `search()`/`remainingMap()` calls for empty or whitespace input. | Add a focused spy-based characterization before closing Task 2; keep the existing stale-generation test and prove both cases in the focused Search suite. Do not manufacture a RED state for pre-existing behavior. |
| **HIGH**     | Stage 1 Tasks 1-6 all touch `BorrowedApp`; Tasks 4/6 touch most features.                                                                                                                                                               | Execute serially in plan order with intermediate green commits; do not parallelize Stage 1 tasks in this checkout.                                                                                                  |
| **HIGH**     | Removing global revision while introducing liveQuery changes query invalidation and cross-tab behavior simultaneously.                                                                                                                  | Establish typed query services and transaction-specific live-query tests before deleting revision/touch.                                                                                                            |
| **HIGH**     | Dexie mappers trust bigint strings and `summaryParamsJson`; export has no decoder/import.                                                                                                                                               | Do not broaden trusted assertions. Stage 2 introduces runtime decoders/recovery before import or backup claims.                                                                                                     |
| **HIGH**     | `initialize()` performs get-then-create outside one atomic creation decision, so two first-run tabs can create different local identities.                                                                                              | Preserve current contract during Stage 1; repair atomically in Stage 2 with a multi-tab regression.                                                                                                                 |
| **HIGH**     | Repayment store reads can include soft-deleted rows; current domain rules filter them. Raw Stage 1 view models could bypass that protection.                                                                                            | Keep `activeRepayments()`/outstanding rules authoritative and test raw-value migrations with deleted repayment fixtures.                                                                                            |
| **HIGH**     | Stage 1 Tasks 1-3 and any UI work share EN/LT/RU catalogs and `BorrowedApp`.                                                                                                                                                            | Serialize catalog edits and run parity after each slice. Never merge three independent catalog branches blindly.                                                                                                    |
| **MEDIUM**   | `domain/types.ts` imports the i18n catalog while Stage 1 makes summaries presentation-neutral and Stage 3 plans domain-purity repair.                                                                                                   | Stage 1 removes locale-shaped query output first; Stage 3 then moves the language type inward without a second competing type.                                                                                      |
| **MEDIUM**   | Lists router URL state and Stage 1 resource/live-query params are coupled.                                                                                                                                                              | Preserve `scope/filter/q` serialization and Back/Forward tests while changing query services.                                                                                                                       |
| **MEDIUM**   | Old SCSS plans have open boxes although source work landed; a worker may repeat dead-selector deletion.                                                                                                                                 | Treat source plus current guards as authoritative. Reopen only a measured defect with browser baselines.                                                                                                            |
| **LOW**      | Historical plan status is misleading because many plans were never checkbox-updated.                                                                                                                                                    | Use this coordination status and actual code; do not mechanically edit old checkboxes without fresh evidence.                                                                                                       |

## Immediate executable plan for the current mixed tree

This plan is valid only while HEAD remains `50884e7` and the ownership snapshot above is
unchanged. A different HEAD or dirty-path set invalidates the sequence and requires a new
reconciliation before any edit, stage or commit.

### Lane A — Stage 0 attributable closeout

- **OWNER:** Existing Stage 0 final-verification worker only.
- **DEPENDENCIES:** None. This lane owns the current Git index.
- **FILES:** The five Stage 0 paths listed in the dirty ownership snapshot; no others.
- **WORK:** Inspect both cached and unstaged versions, retain the state-based Add timing repair,
  ensure the final-verification evidence matches the exact diff, and prepare an attributable
  Stage 0 commit/handoff. Do not absorb Task 2 or this coordination file.
- **ACCEPTANCE:** `add-page.spec.ts` no longer has an unexplained `MM` split; the intended staged
  slice contains exactly the five owned paths; no Task 2 path is staged; focused Stage 0 tests and
  every non-foreign gate are green. If aggregate Prettier is red only on the two Task 2 files,
  record that external blocker and wait for Lane B formatting rather than editing those files.
- **VERIFICATION:** Run the nine-file focused command from the Stage 0 final-verification plan,
  then `pnpm audit --audit-level high`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`
  and `git diff --check` sequentially. Inspect `git diff --cached --stat` and
  `git diff --cached` before commit.
- **ESTIMATED SCOPE:** Small closeout; no new behavior.

### Lane B — Task 2 pre-commit completion

- **OWNER:** Existing Stage 1 Task 2 worker only.
- **DEPENDENCIES:** May prepare in parallel with Lane A because source/test paths are disjoint, but
  must not stage or commit until Lane A settles the index.
- **FILES:** The existing nine Task 2 source/test paths plus
  `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-1.md` for truthful ownership and evidence
  reconciliation. No other feature, catalog, dependency or configuration file.
- **WORK:** Add a spy-based Search characterization proving both initial empty and whitespace-only
  input call neither `search()` nor `remainingMap()`; preserve the stale-generation regression;
  format only the owned Lists and Person files; reconcile the plan's seven-file declaration with
  the actual nine-file contract migration. Record RED evidence only for actual Task 2 behavior;
  explicitly label empty-search as pre-existing characterization.
- **ACCEPTANCE:** Locale changes reformat Records, Search and Person balances without another data
  read; `remainingMap()` returns raw `bigint | null`; the bounded repayment integration assertion
  remains green; empty/whitespace search performs zero observed reads; stale results cannot win;
  all ten closeout paths are formatted and free of new TypeScript escapes.
- **FOCUSED VERIFICATION:**

  ```bash
  pnpm exec ng test borrowed --watch=false \
    --include src/app/data/dexie-store.spec.ts \
    --include src/app/features/lists/list-page.spec.ts \
    --include src/app/features/people/person-page.spec.ts \
    --include src/app/features/search/search-page.spec.ts \
    --include src/app/ui/loan-row.spec.ts
  ```

- **BROWSER VERIFICATION:** In one disposable profile, at 390px and 1440px, verify a partially
  repaid money row in Records and Search across EN/LT/RU changes without refresh; preserve list URL
  state, keyboard focus, status semantics, no horizontal overflow and a clean console. Unit spies,
  not browser inference, prove the zero-read contract.
- **ESTIMATED SCOPE:** Medium closeout of an already implemented contract; no new feature.

### Checkpoint 1 — settle Stage 0 before Task 2 staging

After Lane A is green and ready, the Stage 0 owner commits or hands off exactly its five paths.
Then the coordinator must re-read HEAD, status, cached/unstaged diffs and the last 40 commits.
Proceed only if the remaining product diff is exactly Lane B's nine source/test files plus its plan
evidence. Update this file's baseline to the new HEAD before authorizing Task 2 staging.

### Task 2 attributable closeout

- Stage only Lane B's nine source/test paths and the Stage 1 plan evidence path. Never use a broad
  staging command in this shared checkout.
- Run the focused matrix, then audit, lint, full tests, typecheck, production build and
  `git diff --check` sequentially from the settled post-Stage-0 tree.
- Inspect both staged and unstaged diffs, verify that the coordination document remains owned by
  the coordinator, and commit/handoff only the attributable Task 2 slice. Do not push without an
  explicit user request.
- Mark Task 2 COMPLETE only when the plan checkboxes, focused characterization, browser evidence,
  complete gates and exact commit path list all agree.

### Checkpoint 2 — re-plan before Task 3

After Task 2 settles, do not immediately edit Home. Reconcile the new HEAD and create a bounded
Task 3 plan with two intermediate-green slices: first an additive raw Home-summary domain contract,
then the `BorrowedApp`/Home consumer migration and removal of the obsolete localized compatibility
fields. Only after that checkpoint may Stage 1 Tasks 4-6 be decomposed against the actual service
surface. The high-level serial order remains Task 3 → services → live query → revision removal.

## Recommended execution ordering

1. **Stage 0 final verification:** its timing diagnosis and browser/automated evidence are now
   recorded; settle exactly its five paths, including both layers of the `MM` Add spec, into an
   attributable handoff/commit without touching Stage 1 or this document.
2. **Stage 1 Task 2 closeout:** preserve the nine existing dirty paths, reconcile the two-file
   ownership expansion in its plan, add the missing empty/whitespace-search zero-read
   characterization, record RED evidence only for actual Task 2 changes, rerun its focused matrix
   and all gates, perform required browser locale checks, then settle one attributable
   handoff/commit. Do not restart or duplicate its already-present raw remaining-value
   implementation.
3. **Stage 1 Task 3:** make Home summary presentation-neutral; remove locale from its query.
4. **Stage 1 Task 4:** introduce command/query services and migrate feature injection one slice at
   a time.
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

- **Coordinator documentation on this exact file**, **Stage 0 typed cleanup on its five staged
  paths**, and **the already-active Stage 1 Task 2 nine-path slice** are path-disjoint. They may
  coexist only to finish their current ownership; repository-wide gate evidence still requires a
  stable combined tree, and no fourth product slice may start.
- Read-only review of old specs/commits can run concurrently because it mutates nothing.

### Not safe now

- No new product implementation may start until Stage 0 settles its staged/unstaged layers and
  the already-active Task 2 owner settles all nine dirty consumer/contract paths.
- Remaining Stage 1 Tasks 2 and 3 are not parallel-safe: both modify `BorrowedApp` and share
  query/value shapes; Task 2 also spans Lists, Search and `LoanRow` as one contract migration.
- Stage 1 Tasks 4-6 are strictly serial: service boundaries must exist before liveQuery, and
  liveQuery/relevant-write tests must exist before removing revision.
- Stage 2 persistence subprojects are not parallel-safe until exact decoder/schema/backup and
  mutation ownership is decomposed into separate plans; they share Dexie transactions and version
  contracts.
- Browser/PWA/native acceptance follows a stable tested source commit. It is verification, not a
  parallel substitute for incomplete implementation.

### Potential future parallel group, only after Stage 1 is green

- A path-isolated documentation/ADR task and a new architecture-boundary characterization test
  may run together if neither touches Stage 2 production paths and both use separate explicit
  staging ownership. This is the only currently defensible parallel group; recheck before use.
