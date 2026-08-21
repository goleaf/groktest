# Local database recovery implementation plan

**Date:** 2026-08-21  
**Original baseline:** `fe3a585af6ee90c2f7a133bdc766cc239a66f5f4`

**Verified HEAD:** `83e59955f30247af11747f1984b0039a1b372f10`

**Design:** `docs/superpowers/specs/2026-08-21-local-database-recovery-design.md`

## Reconciliation and ownership

- [x] Re-read HEAD, status, recent commits, staged/unstaged diffs and active coordination guidance.
- [x] Verify the prerequisite implementation, not only its plan: focused runtime-decoder and corrupt
      fake-indexeddb tests pass 2 files / 58 tests.
- [x] Confirm no existing recovery implementation provides retry, unavailable-storage handling or a
      raw persistence snapshot; extend the current initialization boundary instead of competing with
      it.
- [x] Preserve staged Stage 0, settings-race and repayment-hardening work. The decoder slice already
      owns unstaged initializer/root/i18n/mappers and part of `dexie-store.ts`; this follow-up layers
      only the recovery contract on that exact worktree.
- [x] Confirm no schema, dependency, route, feature component, reset, restore or seed change is
      required.

## Task 1: RED — initialization recovery lifecycle

**Files:**

- Modify `src/app/application-initialization.spec.ts`
- Modify `src/app/app.spec.ts`

- [x] Prove a recognized local-storage rejection resolves into a controlled `unavailable` state.
- [x] Prove retry success clears the failure, restores language and does not run demo seeding.
- [x] Prove repeated retry failure remains recoverable and does not duplicate concurrent attempts.
- [x] Prove unrecognized programmer failures still reject.
- [x] Prove the root never renders a raw exception message or corruption metadata.
- [x] Run the focused tests and record expected RED failures against the missing recovery API/UI.

## Task 2: GREEN — typed state, retry and raw persistence export

**Files:**

- Modify `src/app/application-initialization.ts`
- Modify `src/app/data/store.ts`
- Modify `src/app/data/borrowed-app.ts`
- Modify `src/app/data/dexie-store.ts`
- Add `src/app/data/local-recovery-export.spec.ts`

- [x] Classify only typed corruption and recognized IndexedDB/Dexie failures as recoverable.
- [x] Implement a single-flight retry closure that skips seeding and clears state only on success.
- [x] Add a read-only, transactionally consistent raw-table diagnostic export at the Dexie boundary.
- [x] Prove a corrupt row is exported without running a decoder and no delete/reset path is called.
- [x] Keep the diagnostic envelope distinct from the normal app export and future backup contract.
- [x] Re-run focused tests to GREEN, then refactor without broadening the public surface.

## Task 3: GREEN — accessible localized recovery screen

**Files:**

- Modify `src/app/app.ts`
- Modify `src/app/app.scss`
- Modify `src/app/app.spec.ts`
- Modify `src/app/i18n/en.ts`
- Modify `src/app/i18n/lt.ts`
- Modify `src/app/i18n/ru.ts`

- [x] Render the same safe boundary for corruption and unavailable storage without raw data.
- [x] Add Retry and raw diagnostic download actions with busy/disabled feedback.
- [x] Explain destructive reset without implementing it.
- [x] Render an honest disabled future-restore entry point with no fake behavior.
- [x] Add EN/LT/RU keys with catalog/placeholder parity and device-language fallback.
- [x] Verify native keyboard controls, visible focus, initial focus, live status and touch targets.

## Task 4: Full verification and handoff

- [x] Run focused decoder, persistence, initialization, root and i18n tests.
- [x] Search the changed diff for raw exception logging, destructive IndexedDB APIs, automatic seed
      on retry and forbidden TypeScript escapes.
- [x] Run full typecheck, tests, ESLint, format check, production build and `git diff --check`.
- [x] Verify retry failure, retry success, download affordance, disabled restore and keyboard order in
      a disposable browser at mobile and desktop widths.
- [x] Re-read status/stat/diff, preserve every foreign dirty path and record exact evidence below.

## Done criteria

- Corrupt or unavailable local persistence produces a useful localized root screen, never a blank
  app.
- Retry is repeatable, single-flight and successful recovery returns to the unchanged normal app.
- A user can explicitly download raw recoverable rows without exposing them on screen or console.
- Reset is never automatic or offered as an accidental click; restore is visibly future work only.
- No schema, dependency, identity, seed, normal export or feature architecture changes are included.

## Completion evidence

- HEAD moved during the shared-worktree task: prerequisite code landed in `17f4dc6`; this plan/design
  landed separately in `f408b4d`; source-disjoint deployment work then moved local `main` to
  `83e5995`, two commits ahead of `origin/main`. Every transition was re-read before continuing.
- Prerequisite proof: decoder/corrupt-row suite passed 2 files / 58 tests before recovery changes.
- Initial RED failed compilation on the missing failure/retry/raw-export APIs. The device-language
  fallback RED failed on the missing `fallbackLanguage` contract. Browser keyboard QA then exposed
  focus loss during native-disabled retry; its deterministic deferred regression failed because the
  button became disabled.
- GREEN focused evidence: recovery lifecycle/root/raw export passed 3 files / 13 tests; the broader
  decoder, persistence, initialization, root and i18n matrix passed 7 files / 99 tests.
- The full suite exposed a pre-existing worker-order race where Dexie could load before
  `fake-indexeddb/auto`. It reproduced as 267/267 followed by 266/267 with `MissingAPIError`.
  `src/test-setup.ts` plus Angular/TypeScript test setup registration removed the ordering dependency;
  the full 46-file / 267-test suite then passed four consecutive runs and the final acceptance run.
- Final commands passed: `pnpm typecheck`, `pnpm test` (46 files / 267 tests), `pnpm lint`,
  `pnpm build`, `pnpm test:deployment` (11/11), `pnpm audit --audit-level high`, and
  `git diff --check`. Audit still reports one moderate advisory and no high/critical failure.
- Production build passed at 508.82 kB raw / 136.22 kB estimated initial transfer and 37.92 kB
  styles. It emits the existing 500 kB warning threshold by 8.82 kB; the 1 MB error gate is not
  exceeded. No budget was weakened and no dependency was added.
- Disposable Chrome verified normal boot, controlled corrupt-settings boot, repeated retry failure,
  repair followed by retry success, and diagnostic download. Desktop 1440px rendered LT from the
  safe device-language fallback; mobile 390x844 rendered RU with 390px scroll width, 48px controls,
  no raw field/value in the DOM, no console messages, and logical Retry → Export tab order. Retry
  retained keyboard focus after failure. Lighthouse snapshot scored 100 accessibility, best
  practices, SEO and agentic browsing.
- No IndexedDB schema/index, identity semantics, normal export, reset/delete, restore handler,
  production seed behavior or dependency changed. Development seeding remains unchanged on normal
  boot and is explicitly skipped on recovery retry.
