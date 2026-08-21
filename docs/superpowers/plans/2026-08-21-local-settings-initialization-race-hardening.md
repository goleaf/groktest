# Local settings initialization race hardening implementation plan

> **For agentic workers:** Execute this narrow plan inline in the existing checkout. Do not
> delegate, create a branch/worktree, broad-stage, commit, reset, or absorb unrelated dirty work.

**Goal:** Make first-run `LocalSettings` creation atomic so all browser tabs observe one stable
installation identity and exactly one matching settings mutation.

**Architecture:** Perform the existence check, UUIDv7 creation, settings insert, and mutation
insert inside one Dexie `rw` transaction spanning `settings` and `mutations`. Use `Table.add()` for
the fixed `settings['local']` primary key so initialization can never overwrite an already-created
identity. A later tab reads and returns the transaction winner without creating another identity
or mutation.

**Tech stack:** Angular 22, TypeScript 6 strict, Dexie 4.2, IndexedDB/fake-indexeddb 6.2, Vitest 4,
pnpm 10.

---

## Current-state reconciliation

- Planning HEAD: `0865ac5d676ebb923d5699cb368df8160c2a888e` on `main`, one unrelated
  `.gitignore` commit ahead of `origin/main`.
- `DexieBorrowedStore.initialize()` currently performs `settings.get('local')` before its write
  transaction, creates a fresh UUIDv7, then uses `put()`. Two first-run instances can both observe
  absence, return different identities, overwrite the same settings row, and enqueue two mutation
  rows.
- `LocalSettings.id` remains the fixed primary key `'local'`; `localIdentityId` remains UUIDv7 and
  installation-local, not a credential.
- `settings` and `mutations` already participate in the same schema-v3 database and no new index,
  migration, dependency, reset, or identity shape is needed.
- The audit modernization spec assigns atomic first-run settings creation to Stage 2. This plan is
  only that approved slice; runtime decoders, recovery, mutation retention, backup/import, and
  Stage 1 live queries remain out of scope.
- Existing dirty work overlaps `src/app/data/dexie-store.ts` and
  `src/app/data/dexie-store.spec.ts`: repayment tombstone hardening from the immediately preceding
  task must remain intact. `src/app/data/store.ts` and the repayment-hardening plan are also dirty.
- Foreign staged work in
  `docs/superpowers/plans/2026-08-21-borrowed-audit-stage-0.md` must remain untouched.

## Chosen design and rejected alternatives

1. **Chosen:** one `rw` transaction, recheck `settings['local']` inside it, then `add()` settings and
   add the mutation. IndexedDB serializes conflicting read-write transactions; the second
   transaction observes the winner. Primary-key uniqueness prevents replacement even if the code
   is later rearranged.
2. **Rejected:** retain the outer `get()` and merely recheck inside the transaction. It can be made
   safe, but retains the misleading unsafe decision split and an unnecessary first-run read.
3. **Rejected:** optimistic `add()` followed by `ConstraintError` recovery. It adds an error path
   and risks confusing a settings-key collision with a mutation failure; the serial transaction
   already provides a simpler total operation.

Official Dexie contracts used by the implementation:

- overlapping IndexedDB `readwrite` transactions are serialized and the later transaction sees
  the earlier committed changes: <https://www.w3.org/TR/IndexedDB/#transaction-scheduling>
- `db.transaction('rw', ...)` executes table operations in one transaction and rejects/rolls back
  on failure: <https://dexie.org/docs/Dexie/Dexie.transaction%28%29>
- `Table.add()` rejects when the same primary key already exists instead of replacing it:
  <https://dexie.org/docs/Table/Table.add%28%29>

## Task 1: Characterize normal and existing settings paths

**Files:**

- Modify: `src/app/data/dexie-store.spec.ts`

- [x] Add a normal-initialization fake-indexeddb test that creates one store, calls
      `initialize(clock)`, reads the stored row, and proves one settings mutation contains the same
      `localIdentityId`.
- [x] Add an existing-settings test using a second independent `DexieBorrowedStore` after the
      first initialization. Prove it returns the original settings and leaves the mutation count
      at one.
- [x] Run the focused persistence spec. These characterization tests should pass before the fix;
      they protect existing single-tab behavior but are not the RED proof.

Representative assertions:

```ts
expect(await store.getSettings()).toEqual(created);
expect(settingsMutations).toHaveLength(1);
expect(settingsMutations[0]?.payloadJson).toContain(created.localIdentityId);
expect(existing.localIdentityId).toBe(created.localIdentityId);
```

## Task 2: Reproduce the first-run multi-instance race

**Files:**

- Modify: `src/app/data/dexie-store.spec.ts`

- [x] Create two independent `DexieBorrowedStore` instances with the same random database name.
- [x] Start both `initialize(clock)` calls in one `Promise.all()` before either is awaited.
- [x] Assert both results have the same `localIdentityId`, the persisted row matches that winner,
      and there is exactly one settings mutation for entity id `'local'`.
- [x] Add a separate reload test: after concurrent initialization, close both stores, open a third
      instance, call `initialize(clock)`, and prove the same identity and one mutation remain.
- [x] Run the focused spec and capture RED. The current implementation must fail because callers
      observe competing UUIDs and/or two settings mutations, not due to test setup.

Core race shape:

```ts
const firstStore = new DexieBorrowedStore(dbName);
const secondStore = new DexieBorrowedStore(dbName);
const [first, second] = await Promise.all([
  firstStore.initialize(clock),
  secondStore.initialize(clock),
]);

expect(second.localIdentityId).toBe(first.localIdentityId);
```

## Task 3: Make initialization one atomic create-or-read decision

**Files:**

- Modify: `src/app/data/dexie-store.ts`

- [x] Remove the pre-transaction existence decision.
- [x] Return the value of one `rw` transaction over `settings` and `mutations`.
- [x] Inside the transaction, return `settingsFromRow(existing)` immediately when `'local'`
      already exists.
- [x] Only when absent, create the existing `LocalSettings` shape and UUIDv7, insert it with
      `settings.add(settingsToRow(settings))`, enqueue exactly one settings mutation in the same
      transaction, and return it.
- [x] Do not change `saveSettings()`, `LocalSettings`, `LOCAL_SETTINGS_ID`, mutation payload shape,
      database name, schema version, or stores/indexes.
- [x] Re-run the focused spec and prove GREEN.

Minimal implementation shape:

```ts
return this.db.transaction('rw', this.db.settings, this.db.mutations, async () => {
  const existing = await this.db.settings.get(LOCAL_SETTINGS_ID);
  if (existing) return settingsFromRow(existing);

  const settings = createCurrentSettingsShape();
  await this.db.settings.add(settingsToRow(settings));
  await this.db.mutations.add(mutationToRow(mutation('settings', settings.id, settings, clock)));
  return settings;
});
```

The actual implementation keeps the current inline settings construction rather than introducing
an unnecessary production helper.

## Task 4: Determinism and full verification

- [x] Run the complete `dexie-store.spec.ts` at least five consecutive times after GREEN.
- [x] Run adjacent persistence-provider, seed, and application initialization tests.
- [x] Search the changed source diff for TypeScript escapes and verify `database.ts`,
      `LocalSettings`, dependency manifests, and schema version are unchanged.
- [x] Run `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`, owned-file Prettier, and
      `git diff --check`.
- [x] Re-read HEAD, status, staged/unstaged diffs, and this entire plan. Record concurrent HEAD
      movement and known unrelated gate failures without editing their files.
- [x] Append exact RED/GREEN counts, repeated-run evidence, full gates, current HEAD, owned paths,
      and blockers below.

## Done criteria

- Exactly one stable `LocalSettings` record wins concurrent first-run initialization.
- Both store instances return the same UUIDv7 `localIdentityId`.
- No caller overwrites the winner and no duplicate/orphan settings mutation exists.
- A third store after reload observes the same identity and mutation count.
- Normal and already-existing settings paths remain unchanged.
- Initialization settings and mutation writes remain all-or-nothing.
- No database reset, schema/index/version, identity semantics, dependency, or unrelated file change.

## Completion evidence

- HEAD remained `0865ac5d676ebb923d5699cb368df8160c2a888e` on `main`, one unrelated
  `.gitignore` commit ahead of `origin/main`.
- RED run 1: `dexie-store.spec.ts` ran 21 tests with 2 expected failures and 19 passes. Both
  concurrent callers returned different `localIdentityId` values.
- RED run 2: the same 2/21 tests failed deterministically; the concurrent test observed two
  settings mutations, and the reload test again observed competing identities.
- GREEN: the focused persistence file passed 21/21 after moving the complete create-or-read
  decision into one transaction and replacing initialization `put()` calls with `add()`.
- Determinism: five additional consecutive focused runs each passed 21/21, for 105/105 repeated
  persistence assertions after the initial GREEN.
- Adjacent `persistence-provider`, demo-seed, and application-initializer coverage passed 3/3 files
  and 4/4 tests.
- Full `pnpm typecheck` passed.
- Full `pnpm test` passed 42/42 files and 197/197 tests.
- `pnpm lint` ran both stages: Angular ESLint passed; repository-wide Prettier remains red only on
  pre-existing, out-of-scope `src/app/features/lists/list-page.ts` and
  `src/app/features/people/person-page.ts`. Neither path is dirty or changed here.
- `pnpm build` passed with a 488.11 kB production initial bundle and 37.92 kB styles.
- `pnpm audit --audit-level high` exited 0 with one moderate advisory and no high/critical
  advisory.
- The changed source diff adds no `any`, `$any`, double assertion, TypeScript suppression, ESLint
  suppression, or non-null assertion.
- `LOCAL_SCHEMA_VERSION` remains 3. `database.ts`, `LocalSettings`, `package.json`, and
  `pnpm-lock.yaml` are unchanged. No production/user database was reset; tests only delete their
  randomized fake-indexeddb fixtures after closing every connection.
- This task owns only the initialization hunk in `src/app/data/dexie-store.ts`, the settings helper
  and four initialization tests in `src/app/data/dexie-store.spec.ts`, and this plan.
- The same two source files also contain preserved repayment-hardening work from the preceding
  task. `src/app/data/store.ts`, the repayment plan, and the foreign staged Stage 0 plan were not
  changed by this task.
