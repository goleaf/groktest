# Core Borrowed Flow Implementation Plan

> **For agentic workers:** Execute inline in this existing dirty worktree; preserve the current redesign and do not commit unless the user explicitly requests it. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the visible Borrowed workflow exactly match “record → remember → show outstanding → close after return → retain history”.

**Architecture:** Keep the existing Angular local-first vertical slice. Add only presentation helpers for derived money values, direction-aware localized copy in the Add and Detail components, and regression coverage around those boundaries. Domain commands and Dexie transactions remain unchanged unless a failing acceptance test exposes a contradiction.

**Tech Stack:** Angular 22 standalone components, strict TypeScript, signals, Dexie/IndexedDB, Vitest, EN/RU/LT locale catalogs.

---

### Task 1: Lock the simple create contract

**Files:**

- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`

- [ ] Add a component test that expects the person and due-date labels to change between `lent` and `borrowed`, expects the due date outside `<details>`, and expects only the note in the disclosure.
- [ ] Run `pnpm exec ng test --watch=false --include=src/app/features/add/add-page.spec.ts` and confirm the new assertions fail against the generic copy.
- [ ] Replace the generic labels with `add.personLent`, `add.personBorrowed`, `add.dueLent`, and `add.dueBorrowed`; remove the duplicated subject/article fragments; move the due input above the note disclosure.
- [ ] Add matching strings to all three locale files and rerun the targeted test until it passes.

### Task 2: Make return actions match direction

**Files:**

- Modify: `src/app/features/detail/detail-page.spec.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`

- [ ] Add component tests that expect “Returned to me” for a lent item, “I returned it” for a borrowed item, and direction-aware money repayment prompts.
- [ ] Run the targeted Detail test and confirm the new copy assertions fail.
- [ ] Add computed translation keys based on `loan.direction`, add complete EN/RU/LT copy, and rerun the test until it passes.

### Task 3: Show original, returned, and remaining money

**Files:**

- Modify: `src/app/domain/loan-rules.spec.ts`
- Modify: `src/app/domain/loan-rules.ts`
- Modify: `src/app/features/detail/detail-page.spec.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`
- Modify: `src/styles.scss`

- [ ] Add a failing domain test for `repaidMinorUnits` and a failing Detail test for the 100 EUR → 30 EUR → 70 EUR summary.
- [ ] Implement `repaidMinorUnits` from active repayments, format all three values in Detail, and expose them as a semantic three-column definition list.
- [ ] Format the stored minor-unit amount before rendering repayment history and include `{amount}` in all locale messages.
- [ ] Rerun the affected domain, Detail, and locale parity tests until they pass.

### Task 4: Verify the complete vertical slice

**Files:**

- Verify: `src/app/domain/commands.spec.ts`
- Verify: `src/app/data/dexie-store.spec.ts`
- Update: `docs/product.md`
- Update: `docs/workflows.md`

- [ ] Update the product/workflow docs with the four-fact input and explicit money balance presentation.
- [ ] Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` with zero failures.
- [ ] In an isolated browser profile, create and return a physical item, then create a 100 EUR money record, add a 30 EUR repayment, and verify 70 EUR remains active.
- [ ] Check Russian and Lithuanian switch behavior, mobile and desktop layout, accessibility labels, and a clean console.
- [ ] Keep the development server running and report its exact local URL.
