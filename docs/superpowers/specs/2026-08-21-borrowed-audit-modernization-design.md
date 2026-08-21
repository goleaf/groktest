# Borrowed Audit Modernization Design

**Date:** 2026-08-21

**Repository:** `goleaf/groktest`

**Branch policy:** Work only in the existing `main` branch. Do not create feature branches or
worktrees. Commit only attributable, verified slices and preserve unrelated dirty work.

## Goal

Turn the confirmed findings from the audit of commit
`5d2aed53a97a56e116742121a59ac364b70a0eeb` into incremental, test-driven changes against the
current `main`, without rewriting the application or mixing correctness fixes with the later
reactive-data and persistence redesigns.

## Current-state reconciliation

The audit is useful input, but it is not an implementation checklist. The current code already
contains several improvements described by the audit, and a few audit conclusions do not match
the actual behavior.

### Already present in committed `main`

- Angular 22 standalone, zoneless bootstrapping, lazy route components, Signal Forms, `resource`,
  PWA, Capacitor, Electron development shell, Vitest and SCSS partials.
- URL-backed Records scope/filter/search state.
- Indexed active/completed loan reads and bounded repayment reads for visible money records.
- `resource`-based Home, Records and Detail reads with stale-result protection.
- Reactive Detail route-id handling through `route.paramMap` rather than a fixed snapshot.
- Signal Forms for Add, due-date editing and repayments.
- Domain-level `activeRepayments()` filtering, which prevents soft-deleted repayments from
  reducing balances even though persistence read methods currently return those rows.
- A modular global SCSS structure and static design-system checks.

### Confirmed remaining defects

- `strictTemplates` and `strictStandalone` are documented but not enabled in `tsconfig.json`.
- Add applies unconditional `maxLength` rules to conditionally absent item/amount fields.
- Add renders an editable form before settings, people and draft initialization finishes; a late
  draft can overwrite user input.
- Draft persistence errors are silently swallowed and cannot be distinguished from final submit
  errors.
- `markItemReturned()` does not reject a return date before `occurredOn`.
- Detail has no operation-specific busy guard for marking an item returned.
- Loan ordering has no single stable comparator shared by all attention-oriented views.
- History, People, Person and Search still load through `effect` plus unguarded Promises.
- Settings initialization is not atomic across first-run tabs.
- IndexedDB row mappers trust stored values and JSON without runtime decoding.
- `BorrowedApp` remains a broad facade and one global revision invalidates unrelated reads.
- Backup, mutation retention, recovery, PWA updates and release automation remain incomplete.

### Work already in flight in the shared tree

Uncommitted routing, Shell, Home, Detail and SCSS changes are owned by another active slice. They
are not counted as complete until committed and verified. Modernization work must not overwrite,
revert or accidentally commit those files. Tasks that need the same files run only after the
in-flight slice settles.

## Delivery roadmap

Each stage is independently testable and leaves the committed `main` usable.

### Stage 0: Correctness baseline

Enable the compiler contracts already claimed by the documentation and fix the confirmed form,
return, ordering and History async defects. Keep the existing facade, revision signal and Dexie
schema so behavioral fixes remain reviewable.

### Stage 1: Reactive data flow

Split commands from queries, replace screen-loading effects with Angular resources or Dexie
`liveQuery`, remove locale from persistence queries, and retire the global revision signal.
Cross-tab IndexedDB writes must update only affected screens.

### Stage 2: Persistence and recovery

Make first-run settings creation atomic across tabs, introduce runtime row/backup decoders, add a
recovery shell, define mutation compaction/retention, and implement a complete versioned backup
with validated transactional import.

### Stage 3: Component and contract cleanup

Split the large Add and Detail components, keep presentation components persistence-free, type
i18n keys and message parameters, repair domain dependency direction, and move feature-owned
styles into component styles incrementally.

### Stage 4: Scale, PWA and release

Bound Home/history/search reads, add debounced indexed search and large-list strategy, implement
service-worker update UX, centralize versions, add checked-in browser E2E, and harden Android,
iOS and release CI.

## Stage 0 architecture

Stage 0 is deliberately narrow. It adds no dependency, database table, schema migration, state
library or visual redesign.

### Compiler contract

Add `strictTemplates: true` and `strictStandalone: true` to the shared Angular compiler options.
A diagnostic Angular compilation against the current source already passes with both flags, so
the configuration change is expected to expose future regressions rather than require `$any`
workarounds. Update architecture/testing documentation to match the real configuration.

### Add initialization and validation

Add has one initialization boundary that loads settings, people and the saved draft. The editable
form is not mounted until this boundary resolves. While it is pending, the page renders a
localized loading state; on failure it renders an error and explicit retry action. This makes a
late draft overwrite impossible because the user cannot edit the model before the initial model
is selected.

The initialized model uses the draft when present, otherwise the preferred currency, followed by
an optional valid `personId` query-parameter override. Draft persistence starts only after this
model is ready.

Signal Forms owns conditional availability. `itemName` is hidden for money records and `amount`
is hidden for physical-item records. Hidden fields do not participate in validation. The
template renders from the same form hidden state, preventing the schema and DOM conditions from
drifting apart.

The existing debounced effect remains only as an imperative IndexedDB synchronization boundary,
which is an appropriate effect use. Its state becomes explicit:

- `idle`: no user content to persist;
- `saving`: debounce elapsed and a write is active;
- `saved`: the latest draft write completed;
- `error`: the latest draft write failed and can be retried by the next edit or an explicit retry.

Final record submission keeps a separate actionable error. A draft is cleared only after the
loan transaction commits successfully.

### Return command and operation state

`markItemReturned()` derives `returnedOn` from the injected clock and rejects it with the existing
`date_order_invalid` domain error when it is earlier than `loan.occurredOn`. The check lives in the
pure command so every UI and future sync/import caller receives the same rule.

Detail adds an independent `savingReturn` signal. The action returns early while a write is in
flight, disables the button, exposes `aria-busy`, and restores the state in `finally`. Domain and
storage errors use return-specific presentation state rather than the Add fallback message.

### Canonical attention ordering

Introduce one pure `compareLoansByAttention(left, right, today)` comparator in the domain rule
layer. It orders by:

1. active records before non-active records;
2. overdue, due today, due soon, future dated, no date, then non-active;
3. `dueOn` ascending when both records are dated, placing the longest-overdue or nearest-future
   record first within its band;
4. `updatedAt` descending;
5. `id` ascending as the final deterministic tie-breaker.

Home, active Records, Search active results and Person active groups use this comparator. History
keeps its completed-record recency order. The comparator does not format labels or depend on a
locale.

### History async state

History replaces `effect + void Promise.then` with one Angular resource keyed by the existing
application revision. The loader returns raw completed loans. Component-local search remains a
pure computed filter and does not re-query IndexedDB.

The page distinguishes loading, loaded-empty, loaded-results and error states. Error state has an
explicit retry calling the resource reload operation. Resource generation semantics prevent an
older response from replacing a newer revision.

`liveQuery` is intentionally deferred to Stage 1, where the revision signal and query-service
boundaries are removed coherently across all list screens.

## Error handling

- Domain errors remain typed and translated at the feature boundary.
- IndexedDB exceptions are never rendered verbatim or logged with private record data.
- Add initialization failure preserves the possibility of retry and never initializes draft
  persistence from partial data.
- Draft-sync failure does not discard form contents or masquerade as a committed-record failure.
- History keeps a stable error state until retry or a new successful resource value.
- Busy flags are operation-specific and always reset in `finally`.

## Test design

Every behavior change follows red-green verification.

### Compiler and documentation

- Angular app compilation succeeds with configured strict templates and strict standalone mode.
- Architecture documentation no longer claims an option absent from configuration.

### Add

- An overlong hidden `itemName` cannot invalidate a money record.
- An overlong hidden `amount` cannot invalidate a physical-item record.
- A controllable late draft cannot overwrite input because controls are unavailable until
  initialization resolves.
- Initialization loading, failure and retry render distinct accessible states.
- Draft write failure leaves form contents intact and shows draft-specific feedback.
- Final save failure leaves the initialized form and draft intact.

### Return

- A clock date before `occurredOn` produces `date_order_invalid` and no event/update.
- Two rapid return activations execute one application write.
- The button exposes disabled/busy state during the transaction and recovers after success or
  failure.

### Ordering

- Equal urgency bands sort by the nearest or longest-overdue `dueOn` as specified.
- Equal dates sort by newest `updatedAt`, then stable `id`.
- Active records never sort behind completed records merely because a completed record has an old
  due date.
- Home, Records, Search and Person reuse the same comparator rather than duplicating sort logic.

### History

- Initial load shows loading rather than an empty-state flash.
- Failure shows an error and retry.
- Retry replaces the error with data.
- A stale older request cannot replace a newer revision.
- Empty and filtered-empty states remain distinct.

## Verification gates

For each slice:

1. Run the focused Vitest file and observe the new test fail for the intended reason.
2. Apply the minimal implementation.
3. Run the focused test and adjacent domain/persistence tests to green.
4. Run Angular development compilation.
5. Inspect the attributable diff and commit only that slice directly to `main`.

Before Stage 0 completion:

- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- isolated-browser Add, Detail and History checks at mobile and desktop widths
- keyboard focus, busy-state, retry and console checks

The current baseline includes red tests from an unrelated uncommitted navigation slice and one
Prettier failure in that same slice. No full-suite success claim is allowed until those external
dirty changes are completed or otherwise made green by their owner.

## Git and shared-tree policy

- Stay on `main`; do not create branches or worktrees.
- Re-read `git status`, staged diff and overlapping file diffs before every edit and commit.
- Start with non-overlapping compiler, domain, Add and History files.
- Delay Detail edits while the existing Detail dirty slice remains active.
- Never reset, checkout, stash, clean, force-push or delete unrelated work.
- Use path-scoped staging/commits so existing staged or unstaged changes remain untouched.
- Do not push until the intended committed range and all required gates are freshly verified.

## Out of scope for Stage 0

- Removing `BorrowedApp.revision` or introducing Dexie `liveQuery`.
- Splitting `BorrowedApp` into command/query services.
- Changing IndexedDB schema or indexes.
- Runtime decoding, recovery shell, backup import or mutation compaction.
- Component decomposition, typed i18n, style ownership migration or broad visual changes.
- PWA update UX, search indexing, pagination, native release signing or CI expansion.
- Dependency upgrades or Angular major-version migration.

## Acceptance criteria

- All Stage 0 regression tests fail before their fixes and pass afterward.
- Strict Angular template/standalone checks are part of normal project compilation.
- No hidden Add field can block submission.
- User input cannot be overwritten by a late initialization result.
- Return chronology and duplicate-return writes are prevented in domain and UI layers.
- All attention-oriented views use one deterministic comparator.
- History has complete loading/error/retry/empty/data behavior without Promise-writing effects.
- Full tests, lint, typecheck and production build pass after the concurrent dirty slice settles.
- Browser verification finds no console errors and confirms accessible operation states.
- Only attributable Stage 0 files are committed to `main`; unrelated dirty work is preserved.

## Self-review

The design contains no placeholder, unresolved implementation choice or schema ambiguity. Stage 0
does not depend on Stage 1 services, and Stage 1 does not need to undo Stage 0 behavior. Error
states, ordering semantics, data-safety constraints, shared-tree ownership and verification gates
are explicit.
