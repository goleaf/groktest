# Borrowed Audit Stage 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan
> task-by-task. The user requires inline execution in the existing `main`; do not dispatch
> subagents, create branches or create worktrees. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Complete the confirmed Stage 0 correctness work on top of the now-settled routing and
async-state hardening commit.

**Architecture:** Keep `BorrowedApp`, its revision signal and Dexie schema v3 intact. Land pure
compiler/domain fixes first, then repair Add initialization/validation and complete History retry
and stale-generation states. Every behavioral change uses a focused red-green test and an
attributable path-scoped commit directly on `main`.

**Tech Stack:** Angular 22 standalone/zoneless, Angular Signal Forms and `resource`, TypeScript 6
strict mode, Dexie 4/IndexedDB, Vitest/jsdom, SCSS, pnpm.

**Approved design:**
`docs/superpowers/specs/2026-08-21-borrowed-audit-modernization-design.md`

---

## Current reconciliation

Committed `main` already contains URL-backed Records state, indexed active/completed reads,
bounded repayment reads, Signal Forms, and `resource` reads for Home, Records and Detail.

Commit `222ba08` settled the previously unrelated dirty slice. It completed route titles, Shell
focus/current-page behavior, Home/Detail action feedback, and resource-based loading states for
History, People and Search. Detail now guards duplicate item-return writes with disabled/busy/live
feedback, so that item is removed from remaining Stage 0 work.

Fresh clean-HEAD baseline on 2026-08-21:

- 41 test files and 166 tests pass.
- ESLint and Prettier pass.
- Angular development typecheck and production build pass.
- `main` matches `origin/main` before this plan document is committed.

## File ownership for this plan

Clean and safe to edit:

- `tsconfig.json`
- `docs/architecture.md`
- `docs/testing.md`
- `src/app/domain/commands.ts`
- `src/app/domain/commands.spec.ts`
- `src/app/domain/loan-rules.ts`
- `src/app/domain/loan-rules.spec.ts`
- `src/app/domain/home-summary.ts`
- `src/app/domain/home-summary.spec.ts`
- `src/app/domain/person-summary.ts`
- `src/app/domain/person-summary.spec.ts`
- `src/app/data/borrowed-app.ts`
- `src/app/features/add/add-page.ts`
- `src/app/features/add/add-page.spec.ts`
- `src/app/features/history/history-page.ts`
- `src/app/features/history/history-page.spec.ts`
- `src/app/features/detail/detail-page.ts`
- `src/app/features/detail/detail-page.spec.ts`
- `src/app/i18n/en.ts`
- `src/app/i18n/lt.ts`
- `src/app/i18n/ru.ts`

---

### Task 1: Enforce the documented Angular compiler contract

**Files:**

- Modify: `tsconfig.json`
- Modify: `docs/architecture.md`
- Modify: `docs/testing.md`

- [ ] **Step 1: Prove the options are absent from normal configuration**

Run:

```bash
rg -n '"strictTemplates": true|"strictStandalone": true' tsconfig.json
```

Expected: exit 1 with no matches.

- [ ] **Step 2: Enable both Angular compiler options**

Change the shared options to:

```json
"angularCompilerOptions": {
  "enableI18nLegacyMessageIdFormat": false,
  "strictInjectionParameters": true,
  "strictInputAccessModifiers": true,
  "strictTemplates": true,
  "strictStandalone": true
}
```

- [ ] **Step 3: Align architecture and testing documentation**

State explicitly in `docs/architecture.md` that both flags are configured in `tsconfig.json`.
Add this normal gate to `docs/testing.md`:

```bash
pnpm typecheck
```

Document that it compiles application templates with `strictTemplates` and rejects non-standalone
declarations with `strictStandalone`.

- [ ] **Step 4: Verify compiler and production build**

Run:

```bash
pnpm typecheck
pnpm build
git diff --check -- tsconfig.json docs/architecture.md docs/testing.md
```

Expected: all commands exit 0; no `$any` is added as a compiler workaround.

- [ ] **Step 5: Commit only the compiler contract**

```bash
git add -- tsconfig.json docs/architecture.md docs/testing.md
git diff --cached --check
git commit --only -m "build(angular): enforce strict template checks" -- \
  tsconfig.json docs/architecture.md docs/testing.md
```

---

### Task 2: Reject returns before the handoff date

**Files:**

- Modify: `src/app/domain/commands.spec.ts`
- Modify: `src/app/domain/commands.ts`

- [ ] **Step 1: Write the failing command regression**

Add under `describe('return and repayment')`:

```typescript
it('rejects returning an item before its handoff date', () => {
  const { loan } = createLoan(
    {
      kind: 'physical_item',
      direction: 'lent',
      personId: 'p',
      personName: 'Peter',
      itemName: 'drill',
      occurredOn: '2026-08-21',
    },
    clock,
  );

  expect(() => markItemReturned(loan, clock)).toThrowError('date_order_invalid');
});
```

- [ ] **Step 2: Run the focused test and observe red**

```bash
pnpm exec ng test borrowed --watch=false --include src/app/domain/commands.spec.ts
```

Expected: the new assertion fails because the current command completes the loan.

- [ ] **Step 3: Add the domain invariant before constructing the update**

In `markItemReturned()` use:

```typescript
const returnedOn = today(clock);
if (returnedOn < loan.occurredOn) {
  throw new DomainError('date_order_invalid');
}
const at = instantFrom(clock.now());
```

Keep the existing asset-kind and active-loan guards before this check.

- [ ] **Step 4: Verify command and transaction behavior**

```bash
pnpm exec ng test borrowed --watch=false \
  --include src/app/domain/commands.spec.ts \
  --include src/app/data/dexie-store.spec.ts
pnpm typecheck
git diff --check -- src/app/domain/commands.ts src/app/domain/commands.spec.ts
```

Expected: focused tests and typecheck exit 0.

- [ ] **Step 5: Commit only the return invariant**

```bash
git add -- src/app/domain/commands.ts src/app/domain/commands.spec.ts
git commit --only -m "fix(domain): reject returns before handoff" -- \
  src/app/domain/commands.ts src/app/domain/commands.spec.ts
```

---

### Task 3: Introduce one deterministic attention comparator

**Files:**

- Modify: `src/app/domain/loan-rules.spec.ts`
- Modify: `src/app/domain/loan-rules.ts`
- Modify: `src/app/domain/home-summary.ts`
- Modify: `src/app/domain/home-summary.spec.ts`
- Modify: `src/app/domain/person-summary.ts`
- Modify: `src/app/domain/person-summary.spec.ts`
- Modify: `src/app/data/borrowed-app.ts`

- [ ] **Step 1: Write failing comparator tests**

Import `compareLoansByAttention` in `loan-rules.spec.ts` and add:

```typescript
describe('attention ordering', () => {
  const today = '2026-08-20' as const;

  it('orders active records by urgency and nearest relevant date', () => {
    const records = [
      moneyLoan({ id: 'future', dueOn: '2026-09-01' }),
      moneyLoan({ id: 'tomorrow', dueOn: '2026-08-21' }),
      moneyLoan({ id: 'old-overdue', dueOn: '2026-08-10' }),
      moneyLoan({ id: 'new-overdue', dueOn: '2026-08-19' }),
      moneyLoan({ id: 'undated', dueOn: null }),
    ];

    expect(
      [...records].sort((a, b) => compareLoansByAttention(a, b, today)).map(({ id }) => id),
    ).toEqual(['old-overdue', 'new-overdue', 'tomorrow', 'future', 'undated']);
  });

  it('puts active before completed and uses updatedAt then id as stable tie breakers', () => {
    const records = [
      moneyLoan({ id: 'b', dueOn: null, updatedAt: '2026-08-18T10:00:00.000Z' }),
      moneyLoan({ id: 'a', dueOn: null, updatedAt: '2026-08-18T10:00:00.000Z' }),
      moneyLoan({
        id: 'completed-old-due',
        status: 'completed',
        dueOn: '2026-01-01',
        updatedAt: '2026-08-21T10:00:00.000Z',
      }),
    ];

    expect(
      [...records].sort((a, b) => compareLoansByAttention(a, b, today)).map(({ id }) => id),
    ).toEqual(['a', 'b', 'completed-old-due']);
  });
});
```

- [ ] **Step 2: Run the rules test and observe missing comparator failure**

```bash
pnpm exec ng test borrowed --watch=false --include src/app/domain/loan-rules.spec.ts
```

Expected: compilation/test failure because `compareLoansByAttention` is not exported.

- [ ] **Step 3: Implement the pure comparator**

Add to `loan-rules.ts`:

```typescript
function attentionBand(loan: Loan, today: CalendarDate): number {
  if (loan.status !== 'active' || loan.deletedAt !== null) return 5;
  if (isLoanOverdue(loan, today)) return 0;
  if (loan.dueOn === today) return 1;
  if (isLoanDueSoon(loan, today)) return 2;
  if (loan.dueOn !== null) return 3;
  return 4;
}

export function compareLoansByAttention(left: Loan, right: Loan, today: CalendarDate): number {
  const band = attentionBand(left, today) - attentionBand(right, today);
  if (band !== 0) return band;

  const dueDate =
    left.dueOn !== null && right.dueOn !== null
      ? compareCalendarDates(left.dueOn, right.dueOn)
      : left.dueOn !== null
        ? -1
        : right.dueOn !== null
          ? 1
          : 0;

  return (
    dueDate || right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id)
  );
}
```

- [ ] **Step 4: Replace duplicated attention sorts**

Use this exact call in `BorrowedApp.activeLoans()`, `BorrowedApp.search()`, `summarizeHome()` and
`summarizePersonRelationships()`:

```typescript
.sort((left, right) => compareLoansByAttention(left, right, today))
```

Keep History/completed recency sorting unchanged. For Home `dueNext`, use the comparator after its
existing non-overdue/date/action-id filter so the same date/update/id semantics apply.

- [ ] **Step 5: Add integration assertions at the summary boundaries**

In Home and Person summary specs, construct two active records with the same urgency band but
different `dueOn` values and assert the nearer/longest-overdue record is first. Add one Search
application assertion that an active undated record precedes a completed record with an old due
date.

- [ ] **Step 6: Verify all comparator consumers**

```bash
pnpm exec ng test borrowed --watch=false \
  --include src/app/domain/loan-rules.spec.ts \
  --include src/app/domain/home-summary.spec.ts \
  --include src/app/domain/person-summary.spec.ts \
  --include src/app/data/dexie-store.spec.ts
pnpm typecheck
git diff --check -- src/app/domain src/app/data/borrowed-app.ts
```

Expected: focused tests and typecheck exit 0.

- [ ] **Step 7: Commit the shared ordering rule**

```bash
git add -- \
  src/app/domain/loan-rules.ts src/app/domain/loan-rules.spec.ts \
  src/app/domain/home-summary.ts src/app/domain/home-summary.spec.ts \
  src/app/domain/person-summary.ts src/app/domain/person-summary.spec.ts \
  src/app/data/borrowed-app.ts
git commit --only -m "fix(records): stabilize attention ordering" -- \
  src/app/domain/loan-rules.ts src/app/domain/loan-rules.spec.ts \
  src/app/domain/home-summary.ts src/app/domain/home-summary.spec.ts \
  src/app/domain/person-summary.ts src/app/domain/person-summary.spec.ts \
  src/app/data/borrowed-app.ts
```

---

### Task 4: Remove hidden Add-field validation

**Files:**

- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/features/add/add-page.ts`

- [ ] **Step 1: Add two failing DOM regressions**

Use the existing BorrowedApp test stub and native inputs. The money test must enter an overlong
physical item, switch to money, enter a valid amount/person, submit and expect one create write:

```typescript
expect(createRecord).toHaveBeenCalledWith(
  expect.objectContaining({ kind: 'money', amount: '25', personName: 'Peter' }),
);
```

The physical-item test must enter an overlong amount, switch to item, enter a valid item/person,
submit and expect:

```typescript
expect(createRecord).toHaveBeenCalledWith(
  expect.objectContaining({ kind: 'physical_item', itemName: 'Drill', personName: 'Peter' }),
);
```

- [ ] **Step 2: Observe both tests fail because hidden max-length rules remain active**

```bash
pnpm exec ng test borrowed --watch=false --include src/app/features/add/add-page.spec.ts
```

- [ ] **Step 3: Make Signal Forms the source of conditional availability**

Import `hidden` and add:

```typescript
hidden(record.itemName, {
  when: ({ valueOf }) => valueOf(record.kind) === 'money',
});
hidden(record.amount, {
  when: ({ valueOf }) => valueOf(record.kind) === 'physical_item',
});
```

Keep both `maxLength` rules. Render the conditional block from
`!addForm.itemName().hidden()` instead of a separate `kind()` condition.

- [ ] **Step 4: Verify Add behavior and strict templates**

```bash
pnpm exec ng test borrowed --watch=false --include src/app/features/add/add-page.spec.ts
pnpm typecheck
```

- [ ] **Step 5: Commit the validation fix**

```bash
git add -- src/app/features/add/add-page.ts src/app/features/add/add-page.spec.ts
git commit --only -m "fix(add): ignore hidden field validation" -- \
  src/app/features/add/add-page.ts src/app/features/add/add-page.spec.ts
```

---

### Task 5: Make Add initialization and draft persistence explicit

**Files:**

- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/lt.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/i18n.spec.ts`

- [ ] **Step 1: Add failing initialization tests**

Use deferred settings/people/draft Promises. Before resolution, assert the page contains a
`role="status"` loading message and no `<form>`. After resolution, assert the form appears with the
draft. Add a rejection/retry test whose second call resolves and mounts the form.

- [ ] **Step 2: Add a failing draft-write error test**

Reject `saveRecordDraft`, edit the person field, advance 250 ms, and assert:

```typescript
expect(root.querySelector('[role="alert"]')?.textContent).toContain('draft');
expect((root.querySelector('#person') as HTMLInputElement).value).toBe('Peter');
expect(createRecord).not.toHaveBeenCalled();
```

- [ ] **Step 3: Add explicit initialization and draft states**

Use:

```typescript
type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

protected readonly initializing = signal(true);
protected readonly initializationError = signal('');
protected readonly draftStatus = signal<DraftStatus>('idle');
private initializationVersion = 0;
private latestDraftPersistence: Promise<unknown> | undefined;
```

Wrap the editable workspace in loading/error/loaded template branches. `loadForm()` increments
`initializationVersion`, loads all three inputs, applies results only for the newest version, sets
`draftReady` only after a complete result, and always clears `initializing` in `finally` for the
current version.

- [ ] **Step 4: Report draft writes without clearing form data**

When the debounce starts, set `draftStatus` to `saving`. Store the returned Promise in
`latestDraftPersistence`; only its current completion may set `saved`, `idle` or `error`. Never
clear or reset `formModel` in the rejection path.

- [ ] **Step 5: Add synchronized EN/LT/RU messages**

Add the same keys and parameters in every catalog:

```typescript
loading: 'Loading your saved draft…',
loadError: 'Couldn’t load this form from this device.',
retryLoad: 'Retry',
draftSaving: 'Saving draft…',
draftSaved: 'Draft saved on this device.',
draftError: 'Couldn’t save this draft. Your form is still open.',
```

Use natural Lithuanian and Russian translations and let `i18n.spec.ts` enforce catalog parity.

- [ ] **Step 6: Verify initialization, draft, i18n and strict compilation**

```bash
pnpm exec ng test borrowed --watch=false \
  --include src/app/features/add/add-page.spec.ts \
  --include src/app/i18n/i18n.spec.ts
pnpm typecheck
```

- [ ] **Step 7: Commit Add initialization as one behavior slice**

```bash
git add -- \
  src/app/features/add/add-page.ts src/app/features/add/add-page.spec.ts \
  src/app/i18n/en.ts src/app/i18n/lt.ts src/app/i18n/ru.ts src/app/i18n/i18n.spec.ts
git commit --only -m "fix(add): protect form initialization and drafts" -- \
  src/app/features/add/add-page.ts src/app/features/add/add-page.spec.ts \
  src/app/i18n/en.ts src/app/i18n/lt.ts src/app/i18n/ru.ts src/app/i18n/i18n.spec.ts
```

---

### Task 6: Complete History retry and stale-generation states

Preserve the resource implementation and loading test from `222ba08` rather than recreating them.

**Files:**

- Modify: `src/app/features/history/history-page.spec.ts`
- Modify: `src/app/features/history/history-page.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/lt.ts`
- Modify: `src/app/i18n/ru.ts`

- [ ] **Step 1: Repair the loading test seam**

Do not await `fixture.whenStable()` while the resource Promise is intentionally unresolved. Use
`vi.waitFor()` to assert the initial `role="status"`, then resolve the deferred Promise and wait for
the empty state.

- [ ] **Step 2: Add failing error/retry and stale-generation tests**

The first History call rejects and the second resolves. Click a localized retry button and assert
results render. For stale protection, change the revision signal, resolve the newer Promise first
and the older Promise last, then assert only newer data remains.

- [ ] **Step 3: Expose a retry action from the resource**

Add:

```typescript
protected retry(): void {
  this.historyResource.reload();
}
```

Render it only in the error branch with `type="button"`. Keep loading, empty, filtered-empty and
results branches mutually exclusive.

- [ ] **Step 4: Add the same History retry key to EN/LT/RU**

Use `history.retry: 'Retry'` and natural Lithuanian/Russian equivalents. Preserve existing
`history.loading` and `history.loadError` keys from `222ba08`.

- [ ] **Step 5: Verify History and catalog parity**

```bash
pnpm exec ng test borrowed --watch=false \
  --include src/app/features/history/history-page.spec.ts \
  --include src/app/i18n/i18n.spec.ts
pnpm typecheck
```

- [ ] **Step 6: Commit only the completed History state model**

```bash
git add -- \
  src/app/features/history/history-page.ts src/app/features/history/history-page.spec.ts \
  src/app/i18n/en.ts src/app/i18n/lt.ts src/app/i18n/ru.ts
git commit --only -m "fix(history): expose complete async states" -- \
  src/app/features/history/history-page.ts src/app/features/history/history-page.spec.ts \
  src/app/i18n/en.ts src/app/i18n/lt.ts src/app/i18n/ru.ts
```

---

### Task 7: Full Stage 0 verification and browser acceptance

**Files:** Verify only; do not retain browser profiles, screenshots, traces or generated bundles.

- [ ] Re-read `git status --short --branch` and require every remaining dirty path to be
      attributable or explicitly identified as external.
- [ ] Run full gates sequentially:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

Expected: zero failed tests, ESLint/Prettier clean, development and production builds exit 0, and
no whitespace errors.

- [ ] Start the project through Angular CLI MCP at `http://127.0.0.1:4200` using an isolated
      browser profile.
- [ ] At 390x844 and 1440x1000 verify Add loading/retry/form transitions, item-money switching,
      draft error preservation, Detail return busy state and History loading/error/retry/empty/data.
- [ ] Verify keyboard focus, accessible names, `aria-busy`, live regions and zero console errors.
- [ ] Inspect `git log --oneline` and confirm every Stage 0 commit contains only its documented
      paths.
- [ ] Update this plan's completed checkboxes and report any deferred item with exact evidence.

## Plan self-review

- **Spec coverage:** Tasks 1-6 cover every remaining Stage 0 compiler, Add, return, comparator and
  History requirement; Task 7 covers full and browser gates. Detail duplicate-return protection
  was completed by `222ba08` and removed from the remaining task list.
- **Current-state accuracy:** Existing resource/Signal Form work and settled
  navigation/Home/Detail/People/Search behavior are not re-planned.
- **Completeness:** No placeholder marker, generic test instruction or unresolved API name
  remains.
- **Type consistency:** The plan uses existing `Loan`, `CalendarDate`, `DomainError`, Signal Forms,
  `BorrowedApp.revision` and Angular resource contracts without a schema or dependency change.
- **Data safety:** No reset, stash, checkout, clean, database deletion, reseed or force-push is
  allowed.
