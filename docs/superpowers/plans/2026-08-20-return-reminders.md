# Return Reminders Implementation Plan

> **Execution note:** Work inline in the existing dirty worktree, preserve all redesign/i18n changes, and do not commit unless the user explicitly requests it.

**Goal:** Add local-first, calendar-correct return reminders, exact overdue duration, and deadline changes without contacting another person or auto-closing a record.

**Architecture:** Keep `Loan.dueOn` as date-only source data. Add one pure signed day-distance function, include the derived value in Home actions, and render every visible reminder through one standalone shared component. Add a domain command for due-date changes and persist it through the existing atomic store update path.

**Tech Stack:** Angular 22 standalone components, strict TypeScript, signals, Dexie/IndexedDB, Vitest, EN/RU/LT locale files.

---

### Task 1: Lock calendar and reminder semantics

**Files:**

- Modify: `src/app/domain/calendar-date.spec.ts`
- Modify: `src/app/domain/calendar-date.ts`
- Modify: `src/app/domain/home-summary.spec.ts`
- Modify: `src/app/domain/home-summary.ts`
- Modify: `src/app/domain/types.ts`
- Create: `src/app/layout/current-day-tracker.spec.ts`
- Create: `src/app/layout/current-day-tracker.ts`

- [x] Add failing tests for signed calendar-day distance: overdue, today, tomorrow, leap/month/year boundaries.
- [x] Add failing Home-summary tests for exact `daysUntilDue` on overdue and due-soon actions.
- [x] Run the targeted tests and confirm the new assertions fail for the missing behavior.
- [x] Implement date-only day distance and carry it on `HomeAction`; rerun until green.
- [x] Add a reactive local-day signal that refreshes at midnight and on app focus/visibility, then prove open screens update without a loan mutation.

### Task 2: Add the shared reminder UI

**Files:**

- Create: `src/app/ui/due-status.spec.ts`
- Create: `src/app/ui/due-status.ts`
- Modify: `src/app/ui/loan-row.ts`
- Modify: `src/app/features/home/home-page.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`
- Modify: `src/styles.scss`

- [x] Add failing component tests for today, tomorrow, in-days, overdue-by-days, and ordinary future-date rendering.
- [x] Add locale keys with proper plural forms in all three independent language files.
- [x] Implement one icon-led `DueStatus` component and replace duplicated due/overdue rendering in Home, rows, and Details.
- [x] Update affected component stubs and rerun targeted UI and locale parity tests.

### Task 3: Implement moving a deadline as an offline domain action

**Files:**

- Modify: `src/app/domain/commands.spec.ts`
- Modify: `src/app/domain/commands.ts`
- Modify: `src/app/data/borrowed-app.ts`
- Modify: `src/app/data/dexie-store.spec.ts`
- Modify: `src/app/features/detail/detail-page.spec.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`

- [x] Add failing domain tests for a valid change, an unchanged/earlier-than-handoff date, and an inactive record.
- [x] Add a failing IndexedDB test proving updated date, activity, mutation queue, and reload persistence.
- [x] Add a failing Details test for the inline change-date form and localized timeline event.
- [x] Implement `changeLoanDueDate`, expose it through `BorrowedApp`, wire the form, and rerun all targeted tests.

### Task 4: Keep documentation truthful

**Files:**

- Modify: `docs/product.md`
- Modify: `docs/workflows.md`
- Modify: `docs/architecture.md`
- Modify: `docs/roadmap.md`
- Modify: `docs/requirements-coverage.md`
- Modify: `docs/testing.md`

- [x] Document the in-app reminder lifecycle, three-day threshold, date-only semantics, and deadline-change event.
- [x] Explicitly distinguish shipped in-app reminders from deferred OS notifications and custom schedules.

### Task 5: Verify the vertical slice

- [x] Run targeted tests while implementing, then run `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- [x] Use an isolated browser profile at desktop and mobile widths to create a due-soon record and move its date.
- [x] Verify Russian and Lithuanian reminder copy, keyboard/accessible labels, no horizontal overflow, and a clean console.
- [x] Keep the development server running and report the exact URL.
