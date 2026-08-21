# Persisted row runtime decoding implementation plan

> **Worker note:** read `AGENTS.md` and
> `docs/superpowers/plans/0000-ACTIVE-CODEX-COORDINATION.md` before editing. Recheck HEAD and dirty
> ownership because `dexie-store.ts` already contains valid concurrent work.

**Goal:** Validate every current IndexedDB row at the data boundary and route bootstrap-time
corruption into a controlled, fail-closed Angular state without adding a dependency or changing the
database schema.

**Starting baseline:** `0865ac5d676ebb923d5699cb368df8160c2a888e` on `main` at 2026-08-21.  
**Reconciled completion baseline:** `fe3a585af6ee90c2f7a133bdc766cc239a66f5f4`.  
**Design:**
`docs/superpowers/specs/2026-08-21-persisted-row-runtime-decoding-design.md`

## Reconciliation

- [x] Read current row interfaces, mappers, Dexie store/database, domain primitives, root
      initializer/component, Stage 2 design, coordination plan, package/compiler configuration,
      and existing fake-indexeddb tests.
- [x] Confirmed current runtime trust gaps: direct `BigInt`, asserted `JSON.parse`, shallow row
      copies, direct draft return, and pre-decode tombstone/ack filtering.
- [x] Confirmed no validation dependency is installed or needed and no schema/index change is
      justified.
- [x] Claimed only the new decoder/error/initialization paths plus narrow edits to mappers,
      `dexie-store.ts`, root initialization/component, i18n catalogs, and focused tests.
- [x] Preserved foreign dirty work: atomic settings creation, active-only repayment reads, their
      existing spec changes, `store.ts`, and staged plan documents.
- [x] Reconciled the concurrent deployment/CI commits that advanced `main` and `origin/main` from
      `0865ac5` to `fe3a585`; they have no persistence/application overlap. Included their new
      `pnpm test:deployment` gate in final verification.

## Task 1: RED — decoder and mapper contract

**Files:**

- Create `src/app/data/row-decoders.spec.ts`
- Create `src/app/data/persistence-corruption.ts`
- Create `src/app/data/row-decoders.ts`
- Modify `src/app/data/mappers.ts`

- [x] Add valid fixtures for settings, person, loan, repayment, event, mutation, and draft.
- [x] Add the smallest failing cases for wrong object shape, missing/nullable fields, enums,
      currency, calendar date, instant, bigint decimal string/range, versions, tombstones, event
      types, mutation entity/operation, event parameter JSON, and mutation payload JSON.
- [x] Run the focused spec and prove RED because explicit decoders/error type do not exist.
- [x] Implement small field decoders and per-row decoders; construct exact domain objects.
- [x] Make every from-row mapper accept `unknown`; remove direct unguarded `BigInt`, `JSON.parse`,
      and persistence type assertions.
- [x] Rerun the focused spec to green and inspect the new data-layer diff for type escapes.

## Task 2: RED — corrupted IndexedDB rows

**Files:**

- Create `src/app/data/dexie-corruption.spec.ts`
- Modify `src/app/data/dexie-store.ts`

- [x] Insert deliberately malformed rows directly through a raw Dexie connection without changing
      the production schema.
- [x] Prove settings, person, loan, repayment, event, mutation, and draft reads reject with
      `PersistenceCorruptionError` and stable entity/path/reason metadata.
- [x] Prove missing or invalid `deletedAt`/`ackedAt` cannot be silently filtered away.
- [x] Preserve the current active-only repayment and atomic settings behavior while decoding before
      application filtering.
- [x] Run focused persistence tests to green, including the pre-existing repayment/settings race
      suite.

## Task 3: RED — controlled initialization

**Files:**

- Create `src/app/application-initialization.ts`
- Create `src/app/application-initialization.spec.ts`
- Modify `src/app/app.config.ts`
- Modify `src/app/app.ts`
- Create `src/app/app.scss`
- Modify `src/app/app.spec.ts`
- Modify `src/app/i18n/catalog.ts`
- Modify `src/app/i18n/en.ts`
- Modify `src/app/i18n/lt.ts`
- Modify `src/app/i18n/ru.ts`

- [x] Start from a real fake-indexeddb database containing corrupt settings, prove store
      initialization rejects with the typed error, and drive that same path through the new
      application boundary.
- [x] Add a root initialization state and a testable initializer function that catches only typed
      persistence corruption, preserves it for diagnostics, skips seeding, and resolves.
- [x] Prove unrelated initializer failures still reject unchanged.
- [x] Render an accessible, localized, payload-free corruption state instead of the router.
- [x] Prove EN/LT/RU catalog parity and root-component rendering.

## Task 4: Verification and handoff

- [x] Run focused decoder, corrupt-IndexedDB, initializer, root, i18n, Dexie, seed, persistence
      provider, and domain tests.
- [x] Run `pnpm lint:eslint` and focused Prettier on every owned file.
- [x] Run `pnpm typecheck`, full `pnpm test`, `pnpm build`, `pnpm audit --audit-level high`, and
      `git diff --check`.
- [x] Run full `pnpm lint`; if the known Stage 1 formatting baseline remains red, record only its
      exact foreign files and do not absorb them.
- [x] Search the owned diff for `any`, `$any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`,
      `eslint-disable`, non-null assertions, raw `JSON.parse`, and unvalidated `BigInt` calls.
- [x] Re-read status, staged/unstaged diffs, and preserve every foreign change.
- [x] Append exact commands, counts, HEAD, remaining blockers, and completion evidence below.

## Completion evidence

- **RED evidence:** `row-decoders.spec.ts` initially failed to resolve the missing typed boundary;
  the raw Dexie suite then failed 5/7 because pre-decode filters hid corrupt tombstones/acks and the
  draft bypassed mapping. Review-added event-semantic and acknowledged-mutation tests failed 2/58
  for the intended reasons before their fixes.
- **Focused GREEN:** the final domain, persistence, app initializer/root, app-config, and i18n matrix
  passed 17 files / 150 tests. The decoder/corrupt-Dexie/initializer subset passed 3 files / 61 tests.
- **Full GREEN:** `pnpm test` passed 45 files / 259 tests; `pnpm lint`, `pnpm typecheck`,
  `pnpm build`, `pnpm test:deployment` (10/10 at final HEAD), and `git diff --check` exited 0.
  `pnpm audit --audit-level high` exited 0 with one moderate and no high/critical advisory.
- **Production build:** initial bundle 498.01 kB raw / 133.80 kB estimated transfer; styles remain
  37.92 kB raw / 6.58 kB transfer.
- **Browser:** a disposable Chrome context first initialized `borrowed`, then changed only its local
  settings currency to an unsupported value and reloaded. The typed corruption path rendered one
  `main`, one `h1`, one assertive alert, zero router outlets, zero raw error fields, and no horizontal
  overflow at 390x844 and 1440x1000. Console errors/warnings/issues were zero. Lighthouse snapshot
  scores were 100 for accessibility, best practices, SEO, and agentic browsing. The page/context was
  closed and the dev server stopped.
- **Scope:** no dependency, lockfile, schema, index, backup/import, mutation-retention, data reset, or
  feature architecture change. Existing staged Stage 0/settings/repayment work remains staged and
  untouched except for the required unstaged decoder integration layered onto `dexie-store.ts`.
- **Current HEAD:** `fe3a585af6ee90c2f7a133bdc766cc239a66f5f4`, matching `origin/main` at
  final reconciliation.
- **Blockers:** none for this runtime-decoding slice.
