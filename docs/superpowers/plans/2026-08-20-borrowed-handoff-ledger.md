# Borrowed Handoff Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rejected dark-sidebar design with an information-rich responsive handoff ledger and seed exactly 100 fully related demo loans on an empty installation.

**Architecture:** Keep `BorrowedApp` and schema v3 unchanged. Build the data fixture through public application commands, add presentation-only summary data and one reusable handoff primitive, then reshape the existing standalone Angular templates and global SCSS around a horizontal desktop shell and dense responsive ledger.

**Tech Stack:** Angular 22 standalone and zoneless signals, strict TypeScript, Dexie/IndexedDB, SCSS, Vitest/jsdom/fake-indexeddb, Chrome DevTools and Playwright MCP.

---

### Task 1: Deterministic 100-loan demo graph

**Files:**

- Modify: `src/app/data/seed.ts`
- Modify: `src/app/data/seed.spec.ts`

- [ ] Add failing assertions that an empty database receives exactly 100 Loans connected to exactly 24 People, with both directions, both asset kinds, active/completed status, EUR/USD/GBP, overdue/due-soon/future/no-date coverage, partial/full/multiple repayments, return events, due-date-change events, and referentially valid mutations.
- [ ] Run `pnpm test -- src/app/data/seed.spec.ts` and confirm the current nine-loan fixture fails the exact-count assertions.
- [ ] Replace the hand-written nine-row seed with deterministic arrays for people and assets plus a 100-iteration record builder. Reuse each created Person ID for later records. Call `createRecord()`, `repay()`, `markReturned()`, and `changeDueDate()` rather than writing Dexie rows.
- [ ] Keep the existing early-return guard based on active plus history counts, and never create a `RecordDraft`.
- [ ] Run `pnpm test -- src/app/data/seed.spec.ts` and confirm the complete graph and second-call idempotence pass.

### Task 2: Presentation contracts for the ledger

**Files:**

- Create: `src/app/ui/handoff-line.ts`
- Create: `src/app/ui/handoff-line.spec.ts`
- Modify: `src/app/ui/loan-row.ts`
- Modify: `src/app/ui/loan-row.spec.ts`
- Modify: `src/app/domain/types.ts`
- Modify: `src/app/domain/home-summary.ts`
- Modify: `src/app/domain/home-summary.spec.ts`

- [ ] Write failing component tests for translated `You → Peter` and `Anna → You` output, explicit direction wording, asset title, state, remaining balance, and due state.
- [ ] Add `HandoffLine` as a pure standalone component with required `direction` and `personName` inputs. It renders native text, a hidden directional SVG, and no persistence calls.
- [ ] Expand `HomeSummary` with a bounded `recentPeople` presentation list derived during the existing loaded-loan pass; do not add a Store query.
- [ ] Update `LoanRow` to compose `HandoffLine` and preserve the existing link, status, and due-date semantics.
- [ ] Run the four targeted tests and confirm all presentation contracts pass.

### Task 3: Horizontal responsive shell

**Files:**

- Modify: `src/app/layout/shell.ts`
- Modify: `src/app/layout/shell.spec.ts`
- Modify: `src/app/ui/language-switcher.ts`
- Modify: `src/app/app.spec.ts`

- [ ] Write failing tests for a desktop header with brand, Home, Records, People, History, Search, Settings, Add record, and language controls; preserve the mobile Home/Records/Add/Search/More navigation.
- [ ] Rebuild `Shell` markup so one semantic header/navigation frames one main landmark. Remove the desktop-only dark rail and keep the mobile tab bar.
- [ ] Keep the skip link first, all route links native, visible translated labels present, and language buttons at least 44px.
- [ ] Run `pnpm test -- src/app/layout/shell.spec.ts src/app/app.spec.ts src/app/ui/language-switcher.spec.ts` and confirm pass.

### Task 4: Information-rich Home and record lists

**Files:**

- Modify: `src/app/features/home/home-page.ts`
- Modify: `src/app/features/home/home-page.spec.ts`
- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/app/features/lists/list-page.spec.ts`
- Modify: `src/app/features/people/people-page.ts`
- Modify: `src/app/features/people/people-page.spec.ts`

- [ ] Write failing tests for one overview ribbon, a main open-record ledger, a deadline rail, related-people links, compact filters, and desktop column labels that remain hidden from mobile accessibility only when redundant.
- [ ] Recompose Home from the existing `HomeSummary` signal: summary ribbon first, open records second, due/people context rail third. Preserve the guarded inline return action and cap Home rendering to the existing eight actions.
- [ ] Recompose Records as a ledger with handoff, asset, status/due, and action columns on desktop; retain native list semantics and the existing in-memory filters.
- [ ] Update People rows to expose both directions and history counts in one scannable line.
- [ ] Run the three targeted component test files and confirm pass.

### Task 5: Add preview and Detail action rail

**Files:**

- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/features/detail/detail-page.spec.ts`

- [ ] Write failing tests for the Add live handoff preview and Detail two-column structure. Assert the preview is derived from signals and that save/return/repayment/due-date behaviors still call `BorrowedApp` once.
- [ ] Add computed preview text from direction, selected person, asset kind, value, and due date; do not add an effect or database read.
- [ ] Move Detail status, person, due date, balance, and primary action into an aside while keeping activity history and notes in the main column.
- [ ] Preserve labels, draft persistence, errors, busy states, missing-record recovery, and existing domain validation.
- [ ] Run both targeted component test files and confirm pass.

### Task 6: EN/RU/LT copy and visual system

**Files:**

- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`
- Modify: `src/app/i18n/i18n.spec.ts`
- Modify: `src/styles.scss`
- Modify: `src/app/design-system.spec.ts`
- Modify: `docs/DESIGN.md`
- Modify: `public/manifest.webmanifest`
- Modify: `src/index.html`

- [ ] Add failing catalog-integrity and design-system assertions for every new label, hue-188 white/teal tokens, horizontal header, 1320px workspace, ledger columns, 44px targets, rust-only overdue treatment, mobile collapse, focus-visible, hover media gating, and reduced motion.
- [ ] Add complete equivalent copy to all three locale files with identical keys and interpolation parameters.
- [ ] Replace the rejected shell and page CSS with ordered token, base, shell, primitive, feature, state, and breakpoint sections. Do not introduce Tailwind, gradients, cream, serif, or color-only direction.
- [ ] Update the design document and browser/PWA theme color to the new teal system.
- [ ] Run `pnpm test -- src/app/i18n/i18n.spec.ts src/app/design-system.spec.ts`, `pnpm format`, and `pnpm typecheck`; fix every failure.

### Task 7: Full verification and live browser handoff

**Files:**

- Verify all changed files; do not add screenshots, traces, browser profiles, or generated bundles to the repository.

- [ ] Run sequentially: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `git diff --check`.
- [ ] Start a fresh server on an unused loopback port and a named isolated Chrome context.
- [ ] Verify database counts and foreign-key-like references in IndexedDB: 100 Loans, 24 People, Repayments only for money Loans, Events only for existing Loans, and no Draft.
- [ ] Verify Home, Records, Add, Detail, Search, People, Person, History, More, and Settings at 1440x1000 and 390x844.
- [ ] Exercise one filter, search, language switch, physical return, money repayment, due-date change, reload, and keyboard-only navigation.
- [ ] Confirm page title/URL, meaningful DOM, no framework overlay, no relevant console warnings/errors, no horizontal overflow, visible focus, and screenshot evidence.
- [ ] Leave the final dev server running and provide its exact `http://127.0.0.1:<port>/` link.

## Plan self-review

- Spec coverage: the data graph, every requested relation, new shell, signature handoff line, Home, record lists, Add, Detail, supporting screens, three locales, accessibility, and browser handoff all map to a task.
- Placeholder scan: no deferred implementation or unspecified “appropriate” work remains.
- Type consistency: the plan reuses existing `Loan.direction`, `Loan.assetKind`, `Person.id`, `HomeSummary`, and public `BorrowedApp` commands; no schema-only type is introduced.
- Scope: the plan does not add a backend, images, accounts, contacts, new schema, or unsupported statuses.
