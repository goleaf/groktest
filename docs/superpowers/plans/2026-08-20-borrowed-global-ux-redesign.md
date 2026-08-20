# Borrowed Global UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every current Borrowed surface with the custody-board UX defined in the global redesign specification while preserving local data and domain behavior.

**Architecture:** Keep `BorrowedApp` as the feature boundary, add one all-record route, enrich the existing Home presentation contract, and rebuild templates around shared shell, icon, row, and empty-state primitives. Global SCSS provides the complete token and responsive system; individual components retain data and event ownership.

**Tech Stack:** Angular 22 standalone components, signals, Angular Router and Forms, Dexie/IndexedDB, SCSS, Vitest, Chrome DevTools MCP.

---

### Task 1: Records route and active-record contract

**Files:**

- Create: `src/app/features/lists/records-page.ts`
- Create: `src/app/features/lists/records-page.spec.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/data/borrowed-app.ts`
- Modify: `src/app/data/persistence-provider.spec.ts`
- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/app/features/lists/list-page.spec.ts`

- [ ] Write failing tests asserting `/records` exists, all active records are returned when no direction is supplied, and the shared surface exposes All/Lent/Borrowed scope controls.
- [ ] Run `pnpm test -- src/app/features/lists/records-page.spec.ts src/app/features/lists/list-page.spec.ts src/app/data/persistence-provider.spec.ts` and confirm failures describe the missing route/contract.
- [ ] Add `activeLoans(direction?: 'lent' | 'borrowed')`, `RecordsPage`, the route, and a direction scope signal in `ListPage`.
- [ ] Run the same targeted tests and confirm they pass.

### Task 2: Navigation shell and icon vocabulary

**Files:**

- Modify: `src/app/layout/shell.ts`
- Modify: `src/app/layout/shell.spec.ts`
- Modify: `src/app/ui/icon.ts`
- Modify: `src/app/design-system.spec.ts`

- [ ] Write failing tests for mobile Home/Records/Add/Search/More navigation, desktop People/History/Settings destinations, and new icon names.
- [ ] Run `pnpm test -- src/app/layout/shell.spec.ts src/app/design-system.spec.ts` and confirm the old Lent/Borrowed primary navigation causes the expected failure.
- [ ] Implement the new navigation hierarchy and extend the SVG switch with `records`, `filter`, `close`, and `info`.
- [ ] Run the targeted tests and confirm they pass.

### Task 3: Home action contract and custody board

**Files:**

- Modify: `src/app/domain/types.ts`
- Modify: `src/app/domain/home-summary.ts`
- Modify: `src/app/domain/home-summary.spec.ts`
- Modify: `src/app/features/home/home-page.ts`
- Modify: `src/app/features/home/home-page.spec.ts`

- [ ] Write failing tests that each `HomeAction` exposes `direction` and `assetKind`, Home says `Today`, renders the open count, and offers an inline return action only for an active physical record.
- [ ] Run `pnpm test -- src/app/domain/home-summary.spec.ts src/app/features/home/home-page.spec.ts` and confirm the presentation contract is missing.
- [ ] Add presentation metadata in `summarizeHome`, computed lead/rest groups in Home, and a guarded `markReturned()` handler that uses `BorrowedApp` and refreshes through `revision`.
- [ ] Run the targeted tests and confirm they pass.

### Task 4: Capture and detail workflows

**Files:**

- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/features/detail/detail-page.spec.ts`
- Modify: `src/app/i18n/en.ts`

- [ ] Write failing tests for `New record`, sentence-builder semantics, stable field labels, progressive details, `Save record`, detail direction sentence, missing-record recovery, and the semantic history list.
- [ ] Run `pnpm test -- src/app/features/add/add-page.spec.ts src/app/features/detail/detail-page.spec.ts` and confirm failures are copy/structure related.
- [ ] Rebuild both templates while keeping `createRecord`, `markReturned`, and `repay` unchanged.
- [ ] Run the targeted tests and confirm they pass.

### Task 5: Supporting screens and shared rows

**Files:**

- Modify: `src/app/ui/loan-row.ts`
- Modify: `src/app/ui/loan-row.spec.ts`
- Modify: `src/app/ui/empty-state.ts`
- Modify: `src/app/features/search/search-page.ts`
- Modify: `src/app/features/history/history-page.ts`
- Modify: `src/app/features/people/people-page.ts`
- Modify: `src/app/features/people/person-page.ts`
- Modify: `src/app/features/more/more-page.ts`
- Modify: `src/app/features/settings/settings-page.ts`
- Modify: `src/app/features/settings/settings-page.spec.ts`
- Modify: `src/app/i18n/en.ts`

- [ ] Write failing tests for the revised row anatomy, search guidance, grouped More navigation, local-data warning, and settings section labels.
- [ ] Run the targeted UI test files and confirm the old templates fail the new contract.
- [ ] Update the shared primitives first, then migrate each supporting page to those primitives without adding data queries.
- [ ] Run the targeted tests and confirm they pass.

### Task 6: Global visual system

**Files:**

- Modify: `src/styles.scss`
- Modify: `src/app/design-system.spec.ts`
- Modify: `public/icon.svg`
- Modify: `public/manifest.webmanifest`
- Modify: `src/index.html`
- Modify: `docs/DESIGN.md`

- [ ] Write failing design-system assertions for dark chrome, mineral-blue action, flat fills, 248px desktop rail, 44px controls, 880px structural breakpoint, and reduced-motion coverage.
- [ ] Run `pnpm test -- src/app/design-system.spec.ts` and confirm the current token/shell contract fails.
- [ ] Replace the SCSS with ordered token, base, shell, primitive, feature, state, and responsive layers. Keep gradients and decorative wide shadows absent.
- [ ] Update manifest/browser theme colors and the design-system document.
- [ ] Run the design-system test, formatting check, and development build.

### Task 7: Full verification and visual fidelity

**Files:**

- Verify all changed files; do not add screenshots or generated build output to the repository.

- [ ] Run `pnpm test && pnpm lint && pnpm typecheck && pnpm build && git diff --check` sequentially.
- [ ] Start an isolated local server and Chrome profile.
- [ ] Populate disposable records through the real Add flow and verify Home, Records, Lent, Borrowed, Add, Detail, Search, More, People, Person, History, and Settings.
- [ ] Verify 320x700, 390x844, 768x1024, and 1440x1000 for horizontal overflow, sticky shell, reachable primary actions, 44px targets, and one `h1`/`main`.
- [ ] Exercise return, repayment, filters, search, export, reload persistence, keyboard focus, and reduced motion.
- [ ] Run Lighthouse mobile checks and inspect console/network errors.
- [ ] Capture final Home/Add/Detail images outside the repository and compare them with the four concept images using `view_image`.
- [ ] Record concept/render differences for hierarchy, copy, typography, palette, container model, icons, and responsive behavior; fix every material mismatch before handoff.

## Plan self-review

- Spec coverage: every route, shared primitive, primary interaction, responsive shell, accessibility state, and verification gate maps to a task.
- Placeholder scan: no deferred behavior or unspecified implementation steps remain.
- Type consistency: `direction?: 'lent' | 'borrowed'`, direction scope values, and `HomeAction.direction/assetKind` are named consistently across tasks.
- Scope: no persistence schema, remote service, or deferred product feature is included.
