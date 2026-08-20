# Borrowed Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one production-quality responsive design across every current Borrowed route without changing the local-first domain model or persistence contract.

**Architecture:** Keep the standalone Angular feature components and `BorrowedApp` service boundary. Consolidate the visual vocabulary in the existing `Icon`, `Shell`, `LoanRow`, and global SCSS primitives; feature pages compose those primitives and retain their current data calls. Verify behavior with focused Vitest component/helper tests and the complete browser flow.

**Tech Stack:** Angular 22 standalone components, TypeScript 6, SCSS, Angular Router, Dexie/IndexedDB, Vitest, Chrome DevTools MCP.

**Shared-tree rule:** The checkout already contains user-owned uncommitted UI work. Execute inline, preserve and incorporate current changes, and do not create intermediate commits that could accidentally include unrelated files.

---

### Task 1: Protect the shared shell and icon vocabulary

**Files:**

- Modify: `src/app/ui/icon.ts`
- Modify: `src/app/layout/shell.ts`
- Modify: `src/app/layout/shell.spec.ts`

- [ ] **Step 1: Extend the failing shell contract**

Require exactly five primary links, a branded mark, visible local-device copy, shared icon components, and accessible navigation:

```ts
const root = fixture.nativeElement as HTMLElement;
const navigation = root.querySelector('nav[aria-label="Primary"]');
expect(navigation?.querySelectorAll('a')).toHaveLength(5);
expect(root.querySelector('.brand-mark app-icon')).toBeTruthy();
expect(root.querySelectorAll('.tabbar app-icon')).toHaveLength(5);
expect(root.textContent).toContain('On this device');
```

- [ ] **Step 2: Run the focused test and observe the missing brand mark**

Run: `pnpm exec ng test --watch=false --include src/app/layout/shell.spec.ts`

Expected: the new `.brand-mark` assertion fails before the shell implementation.

- [ ] **Step 3: Implement the shell structure**

Use a single brand link/mark, five code-native icon links, a desktop device footer, and a mobile top-bar device label. Preserve `<main id="main">` and the existing router outlet.

- [ ] **Step 4: Run the focused test**

Run: `pnpm exec ng test --watch=false --include src/app/layout/shell.spec.ts`

Expected: PASS.

### Task 2: Build the responsive design system and correct desktop placement

**Files:**

- Modify: `src/styles.scss`

- [ ] **Step 1: Define the locked token set**

Use true white `--bg`, pale teal `--surface`, readable `--ink`/`--muted`, dark teal `--primary`, coral `--overdue`, semantic focus/success tokens, 12px/16px radii, a semantic z-index scale, and a 180ms ease-out transition.

- [ ] **Step 2: Implement mobile shell primitives**

Make `.app-frame` a three-row `min-height: 100dvh` layout, `.topbar` sticky, `.main` scroll-safe, and `.tabbar` sticky with five equal 44px+ destinations. Keep Add as the only circular filled action.

- [ ] **Step 3: Implement the desktop structural breakpoint**

At `min-width: 800px`, explicitly place the rail and content rather than relying on grid auto-placement:

```scss
.app-frame {
  grid-template-columns: 232px minmax(0, 1fr);
  grid-template-rows: 1fr;
}

.topbar,
.tabbar {
  grid-column: 1;
}

.main {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}
```

Combine the desktop brand/navigation/device blocks into the first column and keep the main content measure between 760px and 900px.

- [ ] **Step 4: Implement shared product primitives**

Style page headers, attention band, summary rail, section headings, rows, status badges, leading icons/avatars, forms, segmented controls, disclosure, timeline, empty states, settings groups, hover/focus/disabled/loading states, long-text wrapping, and reduced motion.

- [ ] **Step 5: Build to catch invalid selectors or SCSS**

Run: `pnpm typecheck`

Expected: Angular development build completes without errors.

### Task 3: Reshape Home and reusable rows

**Files:**

- Modify: `src/app/features/home/home-page.ts`
- Modify: `src/app/ui/loan-row.ts`
- Modify: `src/app/ui/icon-for.ts`
- Modify: `src/app/ui/icon-for.spec.ts`
- Modify: `src/app/i18n/en.ts`

- [ ] **Step 1: Extend icon mapping tests**

Verify money maps to `money`, physical items map by direction, and each current Home action key retains the correct direction icon.

- [ ] **Step 2: Run the icon helper test**

Run: `pnpm exec ng test --watch=false --include src/app/ui/icon-for.spec.ts`

Expected: PASS for the existing mapping or a focused failure that identifies a missing current key.

- [ ] **Step 3: Implement Home information architecture**

Render an explicit page header, lead attention band, one summary rail, “Needs attention,” and “Open loans.” Use existing `HomeSummary.actions`; classify action entries by the same urgency ordering already provided by the domain service, without adding persistence reads or recomputing business status in the template.

- [ ] **Step 4: Implement the shared loan row**

Render a leading icon/avatar, primary person/title, direction label, due/status metadata, and chevron. Preserve the existing router link and computed `BorrowedApp.isOverdue()`/`isDueSoon()` calls.

- [ ] **Step 5: Run unit tests and typecheck**

Run: `pnpm test && pnpm typecheck`

Expected: all Vitest suites pass and the Angular development build succeeds.

### Task 4: Apply the shared hierarchy to every route

**Files:**

- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/app/features/lists/lent-page.ts`
- Modify: `src/app/features/lists/borrowed-page.ts`
- Modify: `src/app/features/history/history-page.ts`
- Modify: `src/app/features/more/more-page.ts`
- Modify: `src/app/features/people/people-page.ts`
- Modify: `src/app/features/people/person-page.ts`
- Modify: `src/app/features/settings/settings-page.ts`
- Modify: `src/app/ui/empty-state.ts`
- Modify: `src/app/i18n/en.ts`

- [ ] **Step 1: Rebuild Add as one fast form**

Keep two segmented fieldsets, person quick-fill, conditional item/money fields, optional details, inline error, and submit behavior. Add semantic pressed state through `[attr.aria-pressed]`, the copy “Add a loan” / “What moved, and which way?”, and “Save loan” while preserving `save()`.

- [ ] **Step 2: Rebuild Detail hierarchy**

Keep `record()`, `remaining()`, `markReturned()`, and `repay()` behavior. Present back context, direction, title, person, overdue/due, note/detail rows, primary action, inline repayment form, error alert, and semantic history timeline.

- [ ] **Step 3: Standardize list and utility screens**

Use `.page-header`, `.page-title`, `.section-heading`, `.loan-list`, `.utility-list`, `.settings-group`, and shared icon/row components. No screen may create a new data call solely for decoration.

- [ ] **Step 4: Verify route compilation**

Run: `pnpm typecheck`

Expected: all templates compile and all required component inputs are supplied.

### Task 5: Add static design regression guards

**Files:**

- Create: `src/app/design-system.spec.ts`

- [ ] **Step 1: Write source-level contract tests**

Read `src/styles.scss` and assert the structural desktop placement, reduced-motion query, absence of banned gradient-text/glass patterns, and presence of 44px target sizing:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('../styles.scss', import.meta.url), 'utf8');

describe('design system contract', () => {
  it('keeps structural desktop placement and reduced motion', () => {
    expect(styles).toContain('grid-template-columns: 232px minmax(0, 1fr)');
    expect(styles).toContain('grid-column: 2');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('avoids decorative gradient text and glass', () => {
    expect(styles).not.toContain('background-clip: text');
    expect(styles).not.toContain('backdrop-filter');
  });
});
```

- [ ] **Step 2: Run the new test**

Run: `pnpm exec ng test --watch=false --include src/app/design-system.spec.ts`

Expected: PASS after Tasks 2–4.

### Task 6: Production and browser verification

**Files:**

- Modify only if verification exposes a defect in the files above.

- [ ] **Step 1: Run repository gates sequentially**

Run: `pnpm test`

Run: `pnpm typecheck`

Run: `pnpm lint`

Run: `pnpm build`

Expected: every command exits 0. If formatting fails only in touched files, run Prettier on the explicit touched paths and repeat all gates.

- [ ] **Step 2: Verify the real UI in isolated Chrome**

Use the isolated `groktest-redesign-audit` context. Verify all routes at 390x844, 320x700, 768x1024, and 1440x1000; inspect console, failed requests, landmarks, labels, focus, overflow, minimum targets, sticky navigation, Add form behavior, item return, and money repayment.

- [ ] **Step 3: Perform concept fidelity review**

Capture final mobile Home, desktop Home, mobile Add, and mobile Detail screenshots. Inspect each final screenshot and each corresponding accepted concept with `view_image`. Record at least five comparison points for hierarchy, palette, typography, container model, icon treatment, and responsive behavior; fix any remaining agency-review issue.

- [ ] **Step 4: Review the attributable diff**

Run: `git diff --check`

Run: `git status --short`

Run: `git diff -- src/app src/styles.scss docs/superpowers`

Expected: no whitespace errors, no generated build output, no personal browser data, and no unrelated file reset or deletion.
