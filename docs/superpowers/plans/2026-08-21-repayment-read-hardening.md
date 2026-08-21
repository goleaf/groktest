# Repayment read hardening implementation plan

> **Execution note:** Execute this plan in the current checkout without branching, committing,
> broad staging, or editing the staged Stage 0 plan. Recheck the shared worktree before every
> write and preserve other workers' changes.

**Goal:** Make active-only repayment reads a persistence contract so a tombstoned Repayment can
never reduce an outstanding balance or leak into a current point-in-time consumer.

**Architecture:** Keep `activeRepayments()` as the domain invariant and add the same defense at the
Dexie adapter boundary. All ordinary repayment reads, including the repayment snapshot passed to
transactional mutation callbacks, return only rows whose `deletedAt` is `null`. There is no
historical/deleted repayment API in the current store; one must be explicit if introduced later.
Existing `loanId` queries stay indexed and apply the tombstone predicate only to their bounded
result sets. No schema version or dependency change is required.

**Tech stack:** Angular 22, TypeScript 6 strict, Dexie 4, fake-indexeddb 6, Vitest 4, pnpm 10.

## Current-state reconciliation

- Baseline HEAD at planning time: `b6de8861511dbd0922194ae3170b8c5bb9bc687e` on `main`.
- Foreign staged work: `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-0.md`; do not edit,
  unstage, commit, or otherwise absorb it.
- `src/app/domain/loan-rules.ts` already filters tombstones through `activeRepayments()`;
  `loan-rules.spec.ts` already proves deleted repayments do not change pure outstanding/repaid
  calculations. This protection must remain and must not be reimplemented in components.
- `DexieBorrowedStore.listRepayments()`, `listRepaymentsForLoanIds()`, and the repayment snapshot
  read inside `updateLoan()` currently map every matching row, including `deletedAt != null`.
- `loadLoanRecord()`/Detail and `remainingFor()` use the one-loan read. `remainingMap()` and
  `personOverview()` use the batched read. Home and export use the all-repayment read.
- Lists and Search consume `remainingMap()`; its `null` value means that no active repayment has
  changed the displayed original amount.
- The mutation queue is not a Repayment-row read: tombstone mutation payloads must remain visible
  to future synchronization so deletion can propagate. Only the current Repayment snapshot passed
  into `updateLoan().apply` becomes active-only.
- The audit modernization spec explicitly records this persistence gap. Stage 1 plans future query
  services/liveQuery but do not supersede this boundary invariant.

## Consumer/read audit

| Path                              | Read boundary                         | Required result after hardening                            |
| --------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| One loan / `remainingFor()`       | `listRepayments(loanId)`              | Active repayments only                                     |
| Detail / `loadLoanRecord()`       | `listRepayments(loanId)`              | No tombstoned repayment in the record                      |
| Batched balances                  | `listRepaymentsForLoanIds(ids)`       | Active repayments only, one indexed query                  |
| Lists and Search remaining values | batched read via `remainingMap()`     | Tombstone cannot create a reduced remaining value          |
| Home totals/actions               | all read via `repaymentsByLoan()`     | Original outstanding amount when only repayment is deleted |
| Person overview                   | batched read                          | Original per-loan and per-currency outstanding amount      |
| Export                            | all read via `listRepayments()`       | Point-in-time export excludes tombstoned repayments        |
| Transactional mutation projection | direct indexed read in `updateLoan()` | `apply` receives active repayments only                    |
| Future sync transport             | `listPendingMutations()`              | Unchanged; tombstone mutations remain available to sync    |

## Task 1: Prove the persistence defect with fake-indexeddb

**Files:**

- Modify: `src/app/data/dexie-store.spec.ts`

- [x] Add a small fixture helper that creates a real repayment and overwrites that exact row with a
      non-null `deletedAt` through the public persistence API.
- [x] Add a RED test proving `listRepayments(loanId)`, the unscoped `listRepayments()`, and
      `listRepaymentsForLoanIds()` exclude the tombstone.
- [x] Add a RED test proving the `updateLoan().apply` callback receives no tombstoned repayment.
- [x] Run only the new tests and record that they fail because deleted rows are returned, not
      because of setup, timing, or an unrelated baseline failure.

Focused command:

```bash
pnpm exec ng test --watch=false --include src/app/data/dexie-store.spec.ts
```

## Task 2: Centralize active-row mapping in the Dexie adapter

**Files:**

- Modify: `src/app/data/dexie-store.ts`
- Modify: `src/app/data/store.ts`

- [x] Add one typed row-to-active-domain mapper in `dexie-store.ts`.
- [x] Use it for unscoped/scoped `listRepayments()`, batched
      `listRepaymentsForLoanIds()`, and the transactional `updateLoan()` snapshot.
- [x] Document in the abstract store contract that ordinary repayment reads are active-only.
- [x] Preserve the existing `loanId`/`anyOf` queries and empty-ID fast path.
- [x] Do not change `LOCAL_SCHEMA_VERSION`, the stores definition, mutation payloads, or domain
      balance logic.
- [x] Re-run the focused Dexie spec and prove GREEN.

## Task 3: Lock consumer behavior without duplicating filters

**Files:**

- Modify: `src/app/data/dexie-store.spec.ts`
- Modify only if missing characterization requires it:
  `src/app/domain/home-summary.spec.ts`, `src/app/domain/person-summary.spec.ts`

- [x] In fake-indexeddb coverage, prove a loan whose only repayment is tombstoned retains its full
      outstanding value through `remainingFor()`.
- [x] Prove Detail receives no deleted repayment.
- [x] Prove Lists/Search `remainingMap()` does not report a reduced partial balance.
- [x] Prove Home `moneyOwedToMe`/`moneyIOwe` totals and action amount ignore the tombstone.
- [x] Prove Person overview per-currency and per-loan totals ignore the tombstone.
- [x] Prove point-in-time export excludes the deleted repayment.
- [x] Keep the existing pure-domain deleted-repayment tests as defense in depth; add no component
      filters and no duplicate business rule.

Focused commands:

```bash
pnpm exec ng test --watch=false --include src/app/data/dexie-store.spec.ts
pnpm exec ng test --watch=false --include src/app/domain/loan-rules.spec.ts --include src/app/domain/home-summary.spec.ts --include src/app/domain/person-summary.spec.ts
```

## Task 4: Verify the complete boundary and repository

- [x] Search production code again for every `db.repayments` and repayment-list read; verify no raw
      current-state read bypasses the active mapper.
- [x] Search the changed diff for `any`, `$any`, `as unknown as`, `@ts-ignore`,
      `@ts-expect-error`, `eslint-disable`, and new non-null assertions.
- [x] Run focused persistence/domain tests, then typecheck, full tests, ESLint, format check, build,
      and `git diff --check`.
- [x] Re-read HEAD/status/diffs and distinguish any pre-existing or other-worker failures from this
      slice. Do not modify unrelated files to make a broad gate green.
- [x] Record exact commands, test counts, failures, and changed paths in this plan's completion
      evidence.

Full commands:

```bash
pnpm typecheck
pnpm test
pnpm lint:eslint
pnpm lint:format
pnpm build
git diff --check
```

## Done criteria

- All ordinary `Repayment` row reads are active-only at the Dexie boundary.
- `updateLoan()` validates/projects against active repayments only while remaining transactional.
- Pure domain rules still ignore tombstones independently.
- Home, Person, Detail, Lists/Search, outstanding calculation, and export have regression evidence.
- Mutation queue tombstones remain untouched for future sync.
- No IndexedDB schema/version or dependency changed.
- The attributable diff contains only this plan and repayment-boundary code/tests; foreign staged
  work remains isolated and untouched.

## Completion evidence

- Implementation started at `b6de8861511dbd0922194ae3170b8c5bb9bc687e`. During final recheck,
  another task moved `main` to `0865ac5d676ebb923d5699cb368df8160c2a888e` with only
  `chore: ignore local worktrees` (`.gitignore`, one line). It does not overlap this task; current
  HEAD is therefore `0865ac5` and is one commit ahead of `origin/main`.
- RED: focused `dexie-store.spec.ts` ran 17 tests with exactly 3 expected failures and 14 passes.
  Failures showed the tombstone in one-loan reads, in `updateLoan().apply`, and in Detail.
- GREEN: focused `dexie-store.spec.ts` passed 17/17. The separate loan-rules/Home/Person matrix
  passed 17/17 across 3 files.
- Full `pnpm typecheck` passed.
- Full `pnpm test` passed 42/42 files and 193/193 tests.
- `pnpm lint` ran both stages: ESLint passed; repository-wide Prettier remained red only on the
  pre-existing, out-of-scope `src/app/features/lists/list-page.ts` and
  `src/app/features/people/person-page.ts`. Neither file is dirty or changed by this task.
- `pnpm build` passed; production initial bundle was 488.11 kB and styles were 37.92 kB.
- Source audit found no Repayment-row read outside the centralized Dexie adapter paths. Pending
  mutation reads remain intentionally unfiltered and the regression proves a tombstone mutation
  payload is still queued.
- `LOCAL_SCHEMA_VERSION` remains 3; `database.ts`, `package.json`, and `pnpm-lock.yaml` are
  unchanged.
- Owned paths: this plan, `src/app/data/dexie-store.ts`, `src/app/data/store.ts`, and
  `src/app/data/dexie-store.spec.ts`.
- Foreign staged path preserved without edits:
  `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-0.md`.
