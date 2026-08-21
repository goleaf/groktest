# Borrowed Audit Stage 0 Final Verification Plan

> **For agentic workers:** Execute inline in the existing `main` checkout. Do not delegate,
> branch, create a worktree, commit, or push. Checkboxes record fresh evidence from this run.

**Goal:** Verify the already-implemented Stage 0 audit corrections as one coherent release
candidate without rewriting completed work or touching unrelated hardening/SCSS scopes.

**Architecture:** Treat commits `6d8f951` through `2006dcf` as the implementation under test.
Use focused component/domain checks for the Stage 0 behaviors, remove only unsafe typing found by
the final review, then run the complete repository gates and isolated-browser acceptance.

**Tech Stack:** Angular 22 standalone/zoneless, Angular Signal Forms and `resource`, TypeScript 6
strict mode, Dexie 4/IndexedDB, Vitest/jsdom/fake-indexeddb, pnpm, Playwright MCP.

---

## Current-state findings

- Pre-flight started from clean `main` at `88fa697`, seven commits ahead of `origin/main` after
  the concurrent History slice settled.
- During pre-flight, another active task modified the History component/spec and EN/LT/RU
  catalogs. Those paths were inspected but not edited by this slice.
- The overlapping work was committed as `2006dcf fix(history): expose complete async states`;
  the worktree returned to clean before this plan was created.
- Stage 0 Tasks 1-5 are represented by `6d8f951`, `1b89a64`, `ef89da5`, `e71d94b`, and
  `88fa697`. Task 6 is represented by `2006dcf`. The current code therefore takes precedence over
  the older unchecked boxes in the original plan.
- The SCSS optimization plans are already represented by older commits and are outside this
  verification-only slice. No newer plan/spec existed when this verification plan was created.
- After the Stage 0 quality gates completed, commit `6d7479d` added the Stage 1 modernization
  plan and another active task began editing Person, Dexie integration, `BorrowedApp`, and the
  EN/LT/RU catalogs. Those later dirty paths are external to this slice and must remain untouched.
- Final diff review found one explicit quality-contract violation in `88fa697`:
  `AddPage` uses `$any($event.target)` in a strict template. The new Add/History deferred helpers
  also duplicate definite-assignment assertions. These are verification blockers and require one
  behavior-preserving typed cleanup before Stage 0 can close.

## Files in scope

- Create/update:
  `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-0-final-verification.md`
- Update after evidence is complete:
  `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-0.md`
- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/features/history/history-page.spec.ts`
- Create: `src/app/testing/deferred-promise.ts`
- Verify only: the exact Stage 0 files changed by commits `6d8f951..2006dcf`.

## Files that must not be touched

- All production/test source under `src/` except the four typed-cleanup paths listed above. In
  particular, do not change History production behavior or any i18n catalog.
- `package.json`, `pnpm-lock.yaml`, Angular configuration, IndexedDB schema/migrations, native
  projects, generated web/native assets, screenshots, traces, and browser profiles.
- SCSS modules and their architecture tests; those belong to the completed optimization plans.

## Dependencies and overlap

- Approved design:
  `docs/superpowers/specs/2026-08-21-borrowed-audit-modernization-design.md`.
- Source plan: `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-0.md`.
- The broader hardening and SCSS plans remain historical dependencies, not executable scope.
- The only discovered overlap was History/i18n work from another active task. It is now committed
  as `2006dcf`; this plan verifies it and does not amend or recommit it.
- The later Stage 1 work depends on this Stage 0 baseline but is not a reason to absorb, stage,
  amend, or verify its in-progress Person/Dexie/i18n changes here.

## Execution steps

- [x] Inspect each Stage 0 commit's path list and confirm it stays within its documented slice.
- [x] Run the focused Stage 0 domain, persistence, Add, History, Detail, and catalog tests.
- [x] Re-run the Add and History specs as a green characterization baseline, replace the template
      `$any` with a typed input reference, extract one initialized deferred-Promise test helper,
      then re-run both specs and strict Angular compilation. No visible behavior may change.
- [x] Replace the draft-error test's fixed 300 ms sleep over a 250 ms production debounce with a
      bounded wait for the actual alert condition after a shared-tree full run exposed the timing
      race. Keep the behavioral assertions unchanged and repeat the focused test under load.
- [x] Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
      `pnpm audit --audit-level high`, and `git diff --check` sequentially.
- [x] Start the Angular development server through Angular CLI MCP and use the Playwright MCP's
      disposable browser context only.
- [x] At 390x844 and 1440x1000 verify Add item/money switching, History loaded data, Detail return
      state, one main landmark, one page heading, reachable keyboard controls, no horizontal
      overflow, and a clean console/network log.
- [x] Treat initialization/draft failure and History retry/stale-generation behavior as component
      test evidence; do not add production fault-injection hooks solely for browser QA.
- [x] Search the complete attributable diff for `any`, `$any`, `@ts-ignore`,
      `@ts-expect-error`, `eslint-disable`, non-null assertions, silent catches, unhandled Promise
      paths, duplicate logic, architecture violations, and EN/LT/RU key drift.
- [x] Update this plan and the source Stage 0 plan with exact pass/fail evidence and any honest
      blocker. Do not mark a check complete without fresh evidence.

## Exact focused tests

```bash
pnpm exec ng test borrowed --watch=false \
  --include src/app/domain/commands.spec.ts \
  --include src/app/domain/loan-rules.spec.ts \
  --include src/app/domain/home-summary.spec.ts \
  --include src/app/domain/person-summary.spec.ts \
  --include src/app/data/dexie-store.spec.ts \
  --include src/app/features/add/add-page.spec.ts \
  --include src/app/features/history/history-page.spec.ts \
  --include src/app/features/detail/detail-page.spec.ts \
  --include src/app/i18n/i18n.spec.ts
```

Expected: all selected files pass with no unhandled rejection, stale-result overwrite, or catalog
parity failure.

## Completion criteria

- Every Stage 0 requirement is either proven by a focused automated test or explicitly mapped to
  browser evidence.
- Full tests, lint, Angular development compilation, production build, high-severity audit, and
  diff check exit zero in this run.
- Browser checks pass at both required widths without mutating or resetting existing user data.
- EN/LT/RU catalogs remain structurally equivalent and no unsafe TypeScript suppression appears.
- This slice modifies only its verification plan and the four typed-cleanup paths. Any additional
  dirty Person/Dexie/i18n paths at handoff are identified as concurrent Stage 1 work, not included
  in this slice and not claimed as verified by the earlier whole-repository run.

## Completion evidence

- Focused Stage 0 matrix: 9 files and 79 tests passed.
- Typed-cleanup characterization and post-change run: 2 files and 13 tests passed both before and
  after the refactor; normal strict Angular compilation passed afterward.
- A later full-suite run reproduced one draft-error test timing failure: the test allowed only a
  50 ms scheduling margin after the production debounce. It now waits for the same accessible
  error state rather than elapsed wall time. Five consecutive focused runs passed 10/10 tests
  each, and the final full run passed 41 files / 183 tests.
- Full repository: 41 files and 179 tests passed; ESLint and Prettier passed; development
  typecheck and production build passed; production styles remained 37.92 kB raw / 6.58 kB
  estimated transfer.
- `pnpm audit --audit-level high` exited 0 with one moderate advisory and no high/critical
  advisory. `git diff --check` exited 0.
- Playwright at 390x844 verified Add initialization error/retry/form, item/money state, typed person
  input/live preview, a one-shot draft-write failure with preserved input, keyboard-visible 3px
  focus, one `main`/`h1`, and no horizontal overflow.
- Playwright at 1440x1000 verified desktop-only navigation, History loaded data, a one-shot History
  read failure followed by successful Retry and 33 returned rows, one `main`/`h1`, and no
  horizontal overflow. Detail return was completed in the disposable database and announced in a
  polite status region.
- Final clean browser run reported zero console errors/warnings and all observed local development
  requests returned HTTP 200. Fault injection changed only browser prototypes for one operation;
  it did not clear, migrate, reseed, or otherwise destroy IndexedDB data.
- Commit path inspection found no cross-slice paths. The final attributable diff has no `$any`,
  `any`, `as unknown as`, TypeScript suppression, ESLint disable, or new non-null assertion.
- The full-repository evidence above was captured before concurrent Stage 1 source edits appeared.
  After those edits appeared, a fresh shared-tree snapshot also passed 41 files / 183 tests,
  ESLint/Prettier, development typecheck, production build, high-severity audit, and
  `git diff --check`. This automated snapshot does not replace the focused, cross-tab, and browser
  evidence still required by the Stage 1 owner, so this plan makes no completion claim for that
  later work.
- On the final aggregate lint rerun, ESLint passed but repository-wide Prettier was blocked solely
  by the concurrently created untracked
  `docs/superpowers/plans/0000-ACTIVE-CODEX-COORDINATION.md`. That foreign file was not formatted or
  otherwise edited by this slice. Scoped Prettier for every attributable path passed; the final
  typecheck, production build, high-severity audit, and `git diff --check` also passed.
