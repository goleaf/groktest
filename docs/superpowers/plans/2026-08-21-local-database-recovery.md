# Local database recovery implementation plan

**Date:** 2026-08-21  
**Baseline:** `fe3a585af6ee90c2f7a133bdc766cc239a66f5f4`  
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

- [ ] Prove a recognized local-storage rejection resolves into a controlled `unavailable` state.
- [ ] Prove retry success clears the failure, restores language and does not run demo seeding.
- [ ] Prove repeated retry failure remains recoverable and does not duplicate concurrent attempts.
- [ ] Prove unrecognized programmer failures still reject.
- [ ] Prove the root never renders a raw exception message or corruption metadata.
- [ ] Run the focused tests and record expected RED failures against the missing recovery API/UI.

## Task 2: GREEN — typed state, retry and raw persistence export

**Files:**

- Modify `src/app/application-initialization.ts`
- Modify `src/app/data/store.ts`
- Modify `src/app/data/borrowed-app.ts`
- Modify `src/app/data/dexie-store.ts`
- Add `src/app/data/local-recovery-export.spec.ts`

- [ ] Classify only typed corruption and recognized IndexedDB/Dexie failures as recoverable.
- [ ] Implement a single-flight retry closure that skips seeding and clears state only on success.
- [ ] Add a read-only, transactionally consistent raw-table diagnostic export at the Dexie boundary.
- [ ] Prove a corrupt row is exported without running a decoder and no delete/reset path is called.
- [ ] Keep the diagnostic envelope distinct from the normal app export and future backup contract.
- [ ] Re-run focused tests to GREEN, then refactor without broadening the public surface.

## Task 3: GREEN — accessible localized recovery screen

**Files:**

- Modify `src/app/app.ts`
- Modify `src/app/app.scss`
- Modify `src/app/app.spec.ts`
- Modify `src/app/i18n/en.ts`
- Modify `src/app/i18n/lt.ts`
- Modify `src/app/i18n/ru.ts`

- [ ] Render the same safe boundary for corruption and unavailable storage without raw data.
- [ ] Add Retry and raw diagnostic download actions with busy/disabled feedback.
- [ ] Explain destructive reset without implementing it.
- [ ] Render an honest disabled future-restore entry point with no fake behavior.
- [ ] Add EN/LT/RU keys with catalog/placeholder parity.
- [ ] Verify native keyboard controls, visible focus, initial focus, live status and touch targets.

## Task 4: Full verification and handoff

- [ ] Run focused decoder, persistence, initialization, root and i18n tests.
- [ ] Search the changed diff for raw exception logging, destructive IndexedDB APIs, automatic seed
      on retry and forbidden TypeScript escapes.
- [ ] Run full typecheck, tests, ESLint, format check, production build and `git diff --check`.
- [ ] Verify retry failure, retry success, download affordance, disabled restore and keyboard order in
      a disposable browser at mobile and desktop widths.
- [ ] Re-read status/stat/diff, preserve every foreign dirty path and record exact evidence below.

## Done criteria

- Corrupt or unavailable local persistence produces a useful localized root screen, never a blank
  app.
- Retry is repeatable, single-flight and successful recovery returns to the unchanged normal app.
- A user can explicitly download raw recoverable rows without exposing them on screen or console.
- Reset is never automatic or offered as an accidental click; restore is visibly future work only.
- No schema, dependency, identity, seed, normal export or feature architecture changes are included.

## Completion evidence

Pending implementation and verification.
