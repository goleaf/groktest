# People Hub Implementation Plan

> **For agentic workers:** Execute inline in the current shared checkout. Preserve unrelated dirty-worktree changes, use TDD for behavior, and do not commit or publish without explicit authorization.

**Goal:** Turn each private local person into one complete view of active lending, outstanding money, and completed history.

**Architecture:** Derive a typed person relationship summary from person-scoped loans and batched repayments. Keep identity and persistence in the existing local-first data layer, then render the summary through the existing open-row design system and file-per-language catalogs.

**Tech Stack:** Angular 22 standalone components, strict TypeScript, Signals, Dexie/IndexedDB, Vitest, Angular Router, SCSS, EN/RU/LT catalogs.

---

### Task 1: Person relationship domain summary

**Files:**

- Create: `src/app/domain/person-summary.ts`
- Create: `src/app/domain/person-summary.spec.ts`
- Modify: `src/app/domain/types.ts`

- [ ] Write failing tests for direction grouping, physical-item counts, partial money repayments, multi-currency totals, urgency ordering, and completed history.
- [ ] Run `pnpm test -- --include src/app/domain/person-summary.spec.ts` and confirm failure because the summary API does not exist.
- [ ] Implement the smallest pure summary function using existing outstanding-balance and urgency rules.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Indexed person persistence boundary

**Files:**

- Modify: `src/app/data/store.ts`
- Modify: `src/app/data/dexie-store.ts`
- Modify: `src/app/data/borrowed-app.ts`
- Modify: `src/app/data/dexie-store.spec.ts`

- [ ] Add a failing persistence test that creates three loans under one person, records a partial repayment and a completed return, reloads, and expects one correct person overview.
- [ ] Add a failing query-boundary test expecting person-indexed loans and one batched repayment read without full loan/repayment scans.
- [ ] Add `listLoansForPerson()` and `listRepaymentsForLoanIds()` to the store contract and Dexie adapter using existing indexes.
- [ ] Replace `BorrowedApp.personOverview()` with the person-scoped query and pure summary.
- [ ] Run the focused persistence tests and confirm they pass.

### Task 3: People list and person detail UX

**Files:**

- Modify: `src/app/features/people/people-page.ts`
- Modify: `src/app/features/people/people-page.spec.ts`
- Modify: `src/app/features/people/person-page.ts`
- Create: `src/app/features/people/person-page.spec.ts`
- Modify: `src/styles.scss`

- [ ] Write failing component tests for local people filtering, active direction/history counts, the four-answer summary, split active sections, history, and the person-specific Add action.
- [ ] Run the focused component tests and confirm the new UI contracts fail.
- [ ] Implement the searchable People list and the relationship-ledger person page with semantic headings and shared icons/loan rows.
- [ ] Add mobile-first styles, desktop two-column summary behavior, focus states, and long-text wrapping.
- [ ] Re-run the focused component tests and confirm they pass.

### Task 4: Existing-person selection in Add

**Files:**

- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/data/seed.ts`

- [ ] Write failing tests for matching the complete people list and preselecting `personId` from the route query.
- [ ] Run the Add tests and confirm failure for the missing behavior.
- [ ] Implement computed recent/matching choices and route-based person preselection without auto-merging equal names.
- [ ] Update demo seeding to reuse stable people across related loans.
- [ ] Re-run Add and persistence tests.

### Task 5: Localization and documentation

**Files:**

- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`
- Modify: `src/app/i18n/i18n.spec.ts`
- Modify: `docs/product.md`
- Modify: `docs/data-model.md`
- Modify: `docs/workflows.md`
- Modify: `docs/requirements-coverage.md`
- Modify: `docs/testing.md`

- [ ] Add complete EN/RU/LT people and person-page copy, including pluralized item and record counts.
- [ ] Extend locale-parity tests and verify representative Russian/Lithuanian plural cases.
- [ ] Document stable private person identity, indexed overview queries, duplicate-person behavior, and the finished workflow.
- [ ] Run i18n tests and formatting checks.

### Task 6: Complete verification and browser QA

**Files:**

- Review all files changed by Tasks 1–5.

- [ ] Run `pnpm test` and require every test to pass.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check`.
- [ ] Start or reuse an isolated local development server.
- [ ] In an isolated Chrome profile, create/reuse one person across lent item, lent money, and borrowed item records; add a partial repayment; complete one record; reload; verify grouping and history persist.
- [ ] Switch EN/RU/LT and verify the People list and person page update live.
- [ ] Inspect 320px, 390px, tablet, and desktop widths; verify keyboard focus, no horizontal overflow, no console errors, and no broken routes.
- [ ] Record the exact local URL and verified results in the implementation report.
