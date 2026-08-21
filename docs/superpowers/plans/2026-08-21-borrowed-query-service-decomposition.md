# Borrowed query service decomposition implementation plan

> **For agentic workers:** Execute inline in the existing shared checkout. Preserve every foreign
> dirty path, use RED -> GREEN -> REFACTOR for behavioral changes, and do not start Dexie
> `liveQuery`, query-state, or global revision removal in this plan.

**Goal:** Move all current record, people and Home read orchestration out of `BorrowedApp` into
cohesive application query services while preserving observable behavior, bounded reads and the
temporary successful-write invalidation contract.

**Architecture:** Add `RecordsQueryService`, `PeopleQueryService` and `HomeQueryService` over the
existing `BorrowedStore` port and `CurrentDayService`. Query services return domain/raw values only;
Home presentation derives localized strings in `HomePage`. Feature pages inject the appropriate
query service, while `BorrowedApp` remains a thin compatibility facade for the seeder, legacy tests,
record commands, pending mutations and temporary revision invalidation.

**Tech stack:** Angular 22 standalone/zoneless, signals and `resource`, TypeScript 6 strict mode,
Dexie 4 behind `BorrowedStore`, Vitest/jsdom with fake-indexeddb, pnpm.

---

## Current reconciliation — 2026-08-21

- **HEAD:** `43e5199c68187104142f59991e2300e707d1f6e4` on `main`, matching `origin/main` at
  pre-flight time.
- **Published decomposition:** `RecordsCommandService` is complete in `5425e25`; settings, drafts,
  backup/export and current-day services are published through `43e5199`. They must not be
  recreated or folded into query services.
- **Reviewed dirty prerequisite:** the working tree contains the reviewed non-record correction
  layer: shared `ApplicationRevision`, successful currency invalidation, one production-equivalent
  revision/current-day persistence graph, exact backup coverage, language rollback coverage, stale
  Add draft-generation coverage and documentation evidence. Query work must preserve that layer.
- **Already raw:** Records, Search and Person remaining balances are `bigint` minor units. Lists and
  Search use one `listRepaymentsForLoanIds()` call for visible money records; Person uses one
  person-indexed loan read plus at most one batched repayment read.
- **Still presentation-shaped:** `summarizeHome()` and `BorrowedApp.home(locale)` format money and
  publish translated-message params. That must become raw before `HomeQueryService` can be a clean
  query boundary.
- **Current direct consumers:** Add reads people; Home reads its summary; Records/History/Search read
  loans; People/Person read relationship projections; Detail reads a composed loan record. All use
  `BorrowedApp` today.
- **Existing query guarantees:** active and completed reads use status indexes; person reads use the
  person index; detail uses bounded loan/person/repayment/event reads; Home performs one all-active-
  repayment read; visible record balances perform one batched repayment read. No schema or index
  change is required.
- **Explicitly deferred:** Dexie `liveQuery`, typed observable query state, relevant-table
  invalidation, cross-tab reactive propagation and deletion of `ApplicationRevision`/
  `BorrowedApp.revision` remain Stage 1 Tasks 5-6.

## Ownership and conflicts

This plan owns the new query services/specs, Home raw summary contract/specs, the feature read
injection migrations and their focused specs, narrow `BorrowedApp` compatibility delegation,
architecture documentation/guard reconciliation, the Stage 1 evidence and this plan.

The pre-existing dirty paths remain foreign unless an owned migration necessarily overlaps them.
`src/app/data/borrowed-app.ts`, `docs/architecture.md`, the coordination file and the Stage 1 plan
overlap by design; edits must preserve the existing reviewer correction. The dirty Add spec may be
edited only to migrate its people-read test provider while retaining the stale-generation test.
No persistence adapter, schema, row decoder, i18n catalog, style, package, lockfile, native or CI
file belongs to this slice.

## Query contracts

### `RecordsQueryService`

- `activeLoans(direction?)`: indexed active reads with the canonical attention comparator.
- `history()`: indexed completed reads sorted by newest update.
- `loanDetail(id)`: the existing bounded composed loan record.
- `search(query)`: existing local matching and canonical attention ordering.
- `filterLoans(loans, query, filter)`: synchronous derived filtering against current local day.
- `remainingFor(loan)` and `remainingMap(loans)`: raw bigint balances; the map performs exactly one
  batched repayment read for money-loan ids and no per-loan N+1 query.

### `PeopleQueryService`

- `people()`: people ordered by most recently updated related loan.
- `peopleWithCounts()`: the current active-direction/history projection with the same ordering.
- `loansForPerson(personId)`: explicit indexed read retained for compatible callers.
- `personOverview(personId)`: one person lookup, one indexed loan read and at most one batched
  repayment read, returning the existing raw relationship summary.

### `HomeQueryService`

- `home()`: one loan read plus one active-repayment read, then pure `summarizeHome()`.
- The result contains raw item names or `{currencyCode, minorUnits}` money metadata. It contains no
  locale, formatted money, translated strings or translated parameter bag.
- `HomePage` derives the existing `subject`, message key and params from raw action values in a
  locale-sensitive `computed`, so EN/LT/RU changes do not perform another persistence read.

## Task 1: Make the Home summary presentation-neutral

**Files:**

- Modify: `src/app/domain/types.ts`
- Modify: `src/app/domain/home-summary.ts`
- Modify: `src/app/domain/home-summary.spec.ts`
- Modify: `src/app/features/home/home-page.ts`
- Modify: `src/app/features/home/home-page.spec.ts`

- [ ] Write a failing domain test for discriminated raw physical-item/money action values and no
      locale parameter.
- [ ] Write a failing Home component test proving locale-only changes reformat money without a
      second Home query.
- [ ] Run the focused tests and confirm they fail against localized `subject/params` and
      `home(locale)`.
- [ ] Implement the smallest raw `HomeAction` union and locale-free `summarizeHome()`.
- [ ] Derive the existing localized Home view model in `computed` state and rerun focused tests.

## Task 2: Introduce cohesive query services with real persistence coverage

**Files:**

- Create: `src/app/application/records-query-service.ts`
- Create: `src/app/application/records-query-service.spec.ts`
- Create: `src/app/application/people-query-service.ts`
- Create: `src/app/application/people-query-service.spec.ts`
- Create: `src/app/application/home-query-service.ts`
- Create: `src/app/application/home-query-service.spec.ts`
- Modify narrowly if needed: `src/app/domain/loan-rules.ts`
- Modify: `src/app/data/borrowed-app.ts`
- Modify: `src/app/data/dexie-store.spec.ts`

- [ ] Write focused fake-indexeddb specs that import the absent services and characterize sorting,
      detail/search, people projections, raw Home data and balance outputs.
- [ ] Prove RED because the service contracts do not exist.
- [ ] Implement the three services over `BorrowedStore` and one shared pure repayment grouping
      helper; add no component, Dexie or localization dependency.
- [ ] Prove one batched visible-balance read, bounded Person overview reads and one Home repayment
      read with exact spies.
- [ ] Make every legacy `BorrowedApp` read method a one-line compatibility delegation; keep
      `pendingMutations()` and record command/revision behavior unchanged.
- [ ] Run service, domain and Dexie integration suites before caller migration.

## Task 3: Migrate feature read injection one cohesive consumer at a time

**Files:**

- Modify: Add, Home, Records, History, Search, People, Person and Detail page/spec files under
  `src/app/features/`
- Modify: `src/app/architecture-boundaries.spec.ts`

- [ ] Update each focused component spec first to provide its query service and the temporary
      `ApplicationRevision` where generation invalidation is still required; prove the old caller
      contract fails.
- [ ] Migrate Add and People/Person to `PeopleQueryService`.
- [ ] Migrate Records/History/Search and Detail to `RecordsQueryService`.
- [ ] Migrate Home to `HomeQueryService`; keep Home/Detail record mutations on `BorrowedApp`.
- [ ] Remove the Detail feature's direct type import from `data/store` and make the architecture
      guard require zero presentation-to-store imports.
- [ ] Preserve resource params, retry/loading/error/missing behavior, URL `scope/filter/q`, stale
      generation protection and successful-write invalidation.
- [ ] Run each focused feature suite after its migration and keep intermediate states green.

## Task 4: Reconcile documentation and verify the complete slice

**Files:**

- Modify: `docs/architecture.md`
- Modify: `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-1.md`
- Modify: `docs/superpowers/plans/0000-ACTIVE-CODEX-COORDINATION.md`
- Modify: this plan

- [ ] Update architecture ownership to show feature -> focused query service -> store/domain and
      `BorrowedApp` as a temporary compatibility facade, without claiming live queries.
- [ ] Mark only Stage 1 Task 3 and the query-service portion of Task 4 complete with real evidence;
      leave Task 5, Task 6 revision removal and Stage 1 browser closeout open.
- [ ] Scan the attributable diff for `any`, `$any`, double assertions, TypeScript suppressions,
      blanket ESLint disables, direct Dexie imports, hardcoded visible copy and accidental foreign
      changes.
- [ ] Run focused query/domain/persistence/component suites, then sequentially run `pnpm audit
    --audit-level high`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build` and
      `git diff --check`.
- [ ] Record exact HEAD, file/test counts, build warning and remaining Stage 1 work without claiming
      browser, live-query or cross-tab reactive evidence.

## Done criteria

- Every requested read path is owned by one cohesive query service and no feature component calls a
  `BorrowedApp` read method.
- `BorrowedApp` contains no query implementation logic; it is retained only as an explicitly
  temporary compatibility facade.
- Home/query contracts contain no locale or formatted money values.
- Existing query counts and soft-deleted repayment safety remain covered and green.
- No schema/index/dependency/state-framework change is present.
- Full repository gates and `git diff --check` pass on the final reconciled working tree, or any
  independently introduced failure is reported with exact attribution.

## Completion evidence

Pending implementation and fresh verification.
