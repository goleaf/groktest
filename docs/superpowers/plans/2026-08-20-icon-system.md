# Semantic Icon System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task in the current session. Do not delegate because the shared dirty worktree contains the active localization and design slice.

**Goal:** Add consistent, meaningful icons to every important Borrowed UI surface without adding decorative noise or a third-party dependency.

**Architecture:** Extend the existing typed inline-SVG component, centralize filter/scope mappings, and add small shared heading and empty-state primitives. Feature templates compose those primitives while retaining visible translated labels and semantic native controls.

**Tech Stack:** Angular, TypeScript strict mode, inline SVG, SCSS, Vitest, Chrome DevTools MCP.

---

## File map

- `src/app/ui/icon.ts`: closed icon vocabulary and SVG paths.
- `src/app/ui/icon-for.ts`: domain and UI-state-to-icon mappings.
- `src/app/ui/page-heading.ts`: reusable icon-bearing page heading.
- `src/app/ui/empty-state.ts`: reusable context and action icon treatment.
- `src/app/features/**`: semantic icon composition at each user surface.
- `src/styles.scss`: shared icon sizing, wells, alignment and responsive behavior.
- `src/app/**/*.spec.ts`: vocabulary, mapping and representative rendering contracts.

### Task 1: Lock the icon vocabulary and mappings with RED tests

**Files:**

- Modify: `src/app/ui/icon.spec.ts`
- Modify: `src/app/ui/icon-for.spec.ts`
- Modify: `src/app/ui/empty-state.spec.ts`
- Create: `src/app/ui/page-heading.spec.ts`

- [x] Add expectations for `language`, `download`, `warning`, `all`, and `clock` icon cases.
- [x] Add expectations that scope values map to records/lent/borrowed and filters map to all/item/money/overdue/clock.
- [x] Add component expectations for a visible heading icon and a context-specific empty-state icon.
- [x] Run `pnpm exec ng test --watch=false --include='src/app/ui/**/*.spec.ts'` and confirm failure because the new vocabulary and component do not exist.

### Task 2: Implement the shared icon foundation

**Files:**

- Modify: `src/app/ui/icon.ts`
- Modify: `src/app/ui/icon-for.ts`
- Create: `src/app/ui/page-heading.ts`
- Modify: `src/app/ui/empty-state.ts`

- [x] Add the five tested SVG symbols using the existing view box, stroke and accessibility contract.
- [x] Export `iconForScope()` and `iconForFilter()` with exhaustive typed inputs.
- [x] Implement `PageHeading` with required `icon` and `title` inputs plus optional `intro`.
- [x] Add `icon` and `actionIcon` inputs to `EmptyState`, defaulting to `records` and `add`.
- [x] Re-run the targeted UI tests and confirm they pass.

### Task 3: Apply icons to page hierarchy and core flows

**Files:**

- Modify: `src/app/features/home/home-page.ts`
- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/app/features/search/search-page.ts`
- Modify: `src/app/features/history/history-page.ts`

- [x] Replace repeated heading markup with `PageHeading` using home/add/list/search/history icons.
- [x] Add icons to Add direction/type selectors, recent people, optional-fields summary and error feedback.
- [x] Render scope/filter icons from typed mappings and add icons to result/guidance states.
- [x] Pass context icons into all empty states and keep every control label visible.
- [x] Run the affected component specs and fix only regressions caused by these template changes.

### Task 4: Apply icons to people, details, More and Settings

**Files:**

- Modify: `src/app/features/people/people-page.ts`
- Modify: `src/app/features/people/person-page.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/features/more/more-page.ts`
- Modify: `src/app/features/settings/settings-page.ts`

- [x] Use semantic page and section heading icons across People, More and Settings.
- [x] Add active/history icons to person sections and status/action/error icons to loan details.
- [x] Add language, download and information symbols to Settings without duplicating flags.
- [x] Keep user initials as person identity markers and preserve existing direction wording.
- [x] Run the affected component specs.

### Task 5: Polish shared icon styling

**Files:**

- Modify: `src/styles.scss`
- Modify: `src/app/design-system.spec.ts`

- [x] Add shared `.page-heading`, `.heading-icon`, `.control-icon`, `.empty-icon`, `.status-with-icon`, and compact chip rules.
- [x] Ensure icons use `flex: 0 0 auto`, labels use `min-width: 0`, and 320px layouts do not overflow.
- [x] Preserve 44px targets, visible focus, current palette, reduced motion, and the existing no-gradient/no-wide-shadow contract.
- [x] Run design-system and full style lint checks.

### Task 6: Final verification and live handoff

**Files:**

- Update: `docs/DESIGN.md`
- Update: `docs/testing.md`

- [x] Document the completed semantic icon vocabulary and icon accessibility rules.
- [x] Run `pnpm lint && pnpm test && pnpm typecheck && pnpm build && git diff --check`.
- [x] Run Chrome checks at 320, 390, 768 and 1440px across Home, Add, Records, Search, More and Settings.
- [x] Confirm no horizontal overflow, missing accessible labels, console errors or warnings.
- [x] Leave the verified local dev server running and report its exact URL.

## Risks and mitigations

| Risk                     | Mitigation                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------ |
| Visual clutter           | One semantic icon per scan point; no icons on prose-only sentences                   |
| Mixed icon geometry      | All paths remain inside the existing shared 24px component                           |
| Mobile wrapping          | Fixed icon width, flexible text width and explicit 320px browser verification        |
| Accessibility regression | Icons stay decorative; visible translated labels remain authoritative                |
| Dirty-worktree overlap   | Modify only the active Borrowed UI slice and never reset or discard existing changes |
