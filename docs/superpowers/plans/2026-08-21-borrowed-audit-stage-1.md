# Borrowed Audit Stage 1 Implementation Plan

> **Execution policy:** Work inline in the existing `main` branch only. Do not create branches,
> worktrees or subagents. Preserve unrelated staged/unstaged files and commit only attributable,
> freshly verified slices.

**Goal:** Replace the remaining mixed screen-loading model with consistent Angular 22 resources
and Dexie live queries, keep localized presentation out of IndexedDB reads, split record commands
from feature queries, and remove the global `BorrowedApp.revision` invalidation signal.

**Architecture:** Parameterized one-shot reads use Angular `resource`; long-lived IndexedDB reads
use a store-owned Dexie `liveQuery` bridge exposed as typed observable query state. Mutations remain
explicit command methods and pure domain commands. Query results contain raw domain values;
components derive localized strings with `computed` state. No state propagation is implemented
with `effect`.

**Tech stack:** Angular 22 standalone/zoneless, signals, `resource`, RxJS interop, Dexie 4
`liveQuery`, TypeScript 6 strict mode, Vitest/jsdom, pnpm.

**Approved design:**
`docs/superpowers/specs/2026-08-21-borrowed-audit-modernization-design.md`

---

## Current reconciliation

Stage 0 is complete in commits `6d8f951` through `329bdac`. The current implementation differs
from the original audit in these material ways:

- Home, Records, Detail, History, People and Search already use Angular `resource`.
- Person is the only feature page still loading through `effect` plus an unguarded Promise.
- History, People and Search still depend on the global revision even though their async state is
  resource-based.
- Home, Records, Search and Person still include locale in read parameters because
  `BorrowedApp` returns formatted money strings.
- Every successful record/settings mutation calls `touch()`, invalidating unrelated screens only
  in the current tab.

The shared tree currently contains unrelated staged changes in Add, History, the deferred test
helper and a Stage 0 verification document. Stage 1 must not edit, restage or commit those paths
until their owner settles them.

## Completion criteria

- Changing `/people/:id` in a reused component always loads the new person.
- A stale person/search/detail response cannot overwrite a newer result.
- Every read page exposes loading, error, empty/missing and retry states where applicable.
- Switching EN/LT/RU changes translated and formatted output without another IndexedDB read.
- An unrelated write does not reload unrelated features.
- A write from a second tab updates affected visible data without reload.
- `BorrowedApp.revision`, `touch()` and all revision test doubles are removed.
- Mutations remain explicit methods; no `resource` or `liveQuery` performs a mutation.

---

### Task 1: Make Person route-reactive and locale-independent

**Files:**

- Modify: `src/app/features/people/person-page.spec.ts`
- Modify: `src/app/features/people/person-page.ts`
- Modify: `src/app/data/borrowed-app.ts`
- Modify: `src/app/data/dexie-store.spec.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/lt.ts`
- Modify: `src/app/i18n/ru.ts`

- [x] Add failing tests for initial loading, failure/retry, route-id changes, stale response
      rejection and language changes without a second `personOverview()` call.
- [x] Replace `route.snapshot + effect + Promise.then` with `toSignal(route.paramMap)` and one
      `resource` keyed by person id and the temporary revision only.
- [x] Return `remainingMinorUnitsByLoan` from `personOverview(personId)` and remove its locale
      argument and formatted-string map.
- [x] Format each raw balance in a Person `computed`, so locale changes affect only presentation.
- [x] Add localized Person load-error and retry messages and an accessible `aria-busy` boundary.
- [x] Run the focused Person and Dexie tests, Angular typecheck, lint for touched files and diff
      checks; commit only this slice.

**Task 1 evidence (2026-08-21):** the focused Person test failed in four intended states before
implementation and then passed 5/5. The language-revision regression failed `2` versus `1` before
the fix and passed afterward. Final shared-tree gates passed 41 files/183 tests, ESLint, Prettier,
development typecheck and production build. Isolated Playwright verified reused-route navigation
Peter → Aistė, EN → LT raw-money reformatting, 1440px and 390px layouts without horizontal
overflow, and zero console errors or warnings.

### Task 2: Remove locale from Records and Search reads

**Files:**

- Modify: `src/app/data/borrowed-app.ts`
- Modify: `src/app/features/lists/list-page.spec.ts`
- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/app/features/search/search-page.spec.ts`
- Modify: `src/app/features/search/search-page.ts`
- Modify: `src/app/ui/loan-row.spec.ts`
- Modify: `src/app/ui/loan-row.ts`

- [ ] Add tests proving language changes re-render remaining balances without calling
      `remainingMap()` or `search()` again.
- [ ] Change the remaining-balance query to return raw minor units keyed by loan id.
- [ ] Make `LoanRow` accept raw remaining minor units and format with its current locale.
- [ ] Remove locale from Records/Search resource params while retaining query/scope params.
- [ ] Verify empty global search performs no IndexedDB read and stale search generations remain
      protected.
- [ ] Run focused feature/UI tests, typecheck and diff checks; commit only this slice.

### Task 3: Make Home summary presentation-neutral

**Files:**

- Modify: `src/app/domain/types.ts`
- Modify: `src/app/domain/home-summary.spec.ts`
- Modify: `src/app/domain/home-summary.ts`
- Modify: `src/app/data/borrowed-app.ts`
- Modify: `src/app/features/home/home-page.spec.ts`
- Modify: `src/app/features/home/home-page.ts`

- [ ] Add a failing test proving locale changes update money text with no second `home()` call.
- [ ] Replace localized Home action subjects/params with raw money metadata in the domain summary.
- [ ] Keep domain summary construction free of `Intl`, locale and translation concerns.
- [ ] Derive localized Home action labels and formatted totals in component computed state.
- [ ] Remove locale from the Home resource params and `BorrowedApp.home()` signature.
- [ ] Run Home/domain tests, typecheck and diff checks; commit only this slice.

### Task 4: Introduce explicit command and query services

**Files:**

- Create: `src/app/application/records-command-service.ts`
- Create: `src/app/application/records-query-service.ts`
- Create: `src/app/application/people-query-service.ts`
- Create: `src/app/application/query-state.ts`
- Modify: feature pages and their tests under `src/app/features/`
- Modify: `src/app/data/borrowed-app.ts`

- [ ] Characterize current public methods with focused service tests before moving behavior.
- [ ] Move create/return/due-date/repayment mutations into `RecordsCommandService`.
- [ ] Move record/home/history/search/detail reads into `RecordsQueryService`.
- [ ] Move people list/person overview reads into `PeopleQueryService`.
- [ ] Keep settings, draft, backup and current-day responsibilities temporarily compatible; they
      move in their dedicated later stages rather than growing the new services.
- [ ] Update feature injection one page at a time and keep every intermediate commit green.

### Task 5: Add the Dexie live-query bridge

**Files:**

- Modify: `src/app/data/store.ts`
- Modify: `src/app/data/dexie-store.ts`
- Modify: `src/app/data/dexie-store.spec.ts`
- Modify: `src/app/application/query-state.ts`
- Modify: `src/app/application/records-query-service.ts`
- Modify: `src/app/application/people-query-service.ts`

- [ ] Define one typed observable read boundary in `BorrowedStore`; its Dexie implementation wraps
      `liveQuery` without exposing Dexie to components.
- [ ] Represent initial loading, data and controlled read failure as explicit typed query state.
- [ ] Prove a relevant transaction emits updated data and an unrelated table write does not.
- [ ] Prove two `DexieBorrowedStore` instances on one database name receive cross-tab-equivalent
      updates.
- [ ] Preserve existing bounded/indexed store methods inside the watched query closures.

### Task 6: Migrate feature reads and remove global revision

**Files:**

- Modify: Home, Records, History, People, Person, Search and Detail pages/specs
- Modify: `src/app/data/borrowed-app.ts`
- Modify: application query/command services

- [ ] Migrate History and People lists to live query state.
- [ ] Migrate scoped Records, Home and Search to live query state with reactive params.
- [ ] Keep parameterized Detail/Person reads resource-based where one-shot reload semantics are
      clearer, with targeted query-service invalidation from relevant writes only.
- [ ] Delete `BorrowedApp.revision`, `touch()` and every revision dependency/test double.
- [ ] Add integration tests for unrelated-mutation isolation and second-tab propagation.
- [ ] Run all unit tests, lint, typecheck, production build and `git diff --check`.

### Task 7: Browser verification and Stage 1 closeout

**Files:**

- Modify: this plan with checked evidence only after verification
- Modify: `docs/architecture.md` if service/data-flow diagrams changed
- Modify: `docs/testing.md` with stable cross-tab commands if needed

- [ ] Start the Angular dev server through the Angular CLI MCP and wait for a successful build.
- [ ] In an isolated Playwright profile verify Person route reuse, retry, language switch, Records
      filters, Search and Detail after mutations at mobile and desktop widths.
- [ ] Open a second isolated tab, mutate shared IndexedDB data and verify affected first-tab UI
      updates without reload.
- [ ] Check keyboard focus, `aria-busy`, retry controls, horizontal overflow and console errors.
- [ ] Re-run the complete quality gate after browser checks and record exact evidence.

## Verification commands

Focused tests use the Angular project name:

```bash
pnpm exec ng test borrowed --watch=false --include src/app/features/people/person-page.spec.ts
pnpm exec ng test borrowed --watch=false --include src/app/data/dexie-store.spec.ts
pnpm typecheck
pnpm lint
pnpm test
pnpm build
git diff --check
```

Before every commit, inspect `git status`, `git diff`, `git diff --cached` and commit only paths
owned by the current task. Do not push until the user explicitly requests it.
