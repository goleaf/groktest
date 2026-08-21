# Borrowed SCSS Optimization Implementation Plan

> **Execution:** Work inline in small verified slices. Do not dispatch subagents. Use test-first architectural contracts and real-browser regression checks before deleting selectors.

**Goal:** Replace the accumulated 3,246-line global SCSS cascade with focused Sass modules, remove proven legacy rules and conflicting duplicates, reduce compiled CSS, preserve the approved UI pixel-for-pixel, and ship the verified update to the connected Android phone without deleting its data.

**Architecture:** Keep `src/styles.scss` as the single Angular entrypoint. Emit one ordered cascade from tokens, base, shell, shared primitives, ledger, Home, records, and supporting-screen modules. Do not migrate to Angular component-scoped CSS because the measured 8.5 KB gzip payload does not justify selector rewriting, duplicated primitives, or cross-component encapsulation risk.

**Tech stack:** Angular 22 standalone/zoneless, Dart Sass through Angular CLI, strict TypeScript, Vitest/jsdom, Chrome DevTools MCP in an isolated context, pnpm, Capacitor 8, Gradle, ADB.

**Baseline:** 54,642 SCSS source bytes; 43,736 production CSS bytes; 8,509 gzip bytes; 470 rule blocks; 1,642 declarations; 110 repeated selectors; 111 conflicting repeated selector/property pairs.

---

### Task 1: Freeze the current contract

**Files:**

- Modify: `src/app/design-system.spec.ts`
- Create: `src/app/styles-architecture.spec.ts`
- Verify: `src/styles.scss`
- Verify: `src/styles/*.scss`

- [ ] Record `git status --short --branch`, HEAD, tracked SCSS files, byte/line counts, Angular version, and current production CSS artifact.
- [ ] Run the current `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` sequentially; record any pre-existing failure without hiding it.
- [ ] Compile expanded CSS to a temporary directory and calculate rule, declaration, selector, duplicate, specificity, raw-byte, and gzip-byte baselines.
- [ ] Open `http://127.0.0.1:4200` in a named isolated browser context; do not reuse a personal profile.
- [ ] Capture full-page baseline screenshots outside the repository at 390x844 and 1440x1000 for Home, Records, Add, one Detail record, People, one Person, History, Search, More, and Settings.
- [ ] Record horizontal-overflow, current route title, visible main landmark, stylesheet count, console errors/warnings, and representative computed styles.
- [ ] Add a failing architecture test requiring the future module manifest and forbidding proven legacy selectors. Run it and confirm failure is caused by the current monolithic source.

### Task 2: Establish non-emitting Sass contracts

**Files:**

- Modify: `src/styles/_tokens.scss`
- Create if justified: `src/styles/_media.scss`
- Modify: `src/app/styles-architecture.spec.ts`

- [ ] Inventory every CSS custom property declaration and usage.
- [ ] Categorize tokens as canonical, compatibility alias, or unused.
- [ ] Keep all currently rendered values unchanged while replacing internal uses of compatibility aliases with canonical semantic names.
- [ ] Remove an alias only after `rg` shows no consumer and browser computed values remain equal.
- [ ] If at least three media-query call sites share the same exact condition, introduce a non-emitting Sass media mixin/constants module; otherwise keep readable literal queries.
- [ ] Forbid imports of emitting modules from other emitting modules.
- [ ] Run the architecture/design-system tests and a development compile.

### Task 3: Extract the base layer

**Files:**

- Create: `src/styles/_base.scss`
- Modify: `src/styles.scss`
- Modify: `src/app/styles-architecture.spec.ts`

- [ ] Move box sizing, `html`, `body`, native typography inheritance, buttons, links, headings, paragraphs, global `:focus-visible`, `.sr-only`, and `app-icon` rules to `_base.scss` in existing cascade order.
- [ ] Keep `styles.scss` as ordered `@use` declarations only.
- [ ] Preserve all token values and selector specificity.
- [ ] Compile and compare Home mobile/desktop screenshots before continuing.
- [ ] Confirm document dimensions, fonts, colors, heading metrics, and focus outline match baseline.

### Task 4: Consolidate the shell

**Files:**

- Modify: `src/styles/_shell.scss`
- Modify: `src/styles.scss`
- Modify: `src/app/layout/shell.spec.ts`
- Modify: `src/app/styles-architecture.spec.ts`

- [ ] Move the skip link, `.app-frame`, `.app-header`, `.header-inner`, brand, desktop navigation, header tools, language placement, footer, `.main`, and `.mobile-nav` rules into `_shell.scss`.
- [ ] Merge the old shell declarations with the final Handoff Ledger overrides so each base selector has one canonical block per media context.
- [ ] Delete `topbar`, `app-navigation`, rail-navigation, and other shell candidates only after static consumers and browser routes prove them dead.
- [ ] Preserve the 70rem shell switch, 1,320px content cap, safe-area variables, mobile scroll padding, sticky/fixed behavior, and 44px targets.
- [ ] Consolidate duplicate hover rules under `@media (hover: hover)` and keep touch active-state behavior.
- [ ] Run shell/design-system/architecture tests, typecheck, and browser checks at 390, 900, 1120, and 1440px.
- [ ] Confirm no header overlap, no horizontal scroll, correct mobile/desktop navigation visibility, visible keyboard focus, and identical screenshots at baseline widths.

### Task 5: Extract shared primitives

**Files:**

- Create: `src/styles/_primitives.scss`
- Modify: `src/styles.scss`
- Modify: `src/styles/_records.scss`
- Modify: `src/app/styles-architecture.spec.ts`

- [ ] Move `.page`, page headings, section headings/bars, icon links, buttons, back links, stacks, labels, inputs/selects/textareas, placeholders, error/hint text, search fields, segmented controls, chips, empty/missing states, shared list navigation, statuses, avatars, and common row anatomy into `_primitives.scss`.
- [ ] Merge repeated `.back`, `.result-count`, `.settings-group`, form control, `.page-header`, and `.page-heading` declarations into canonical blocks.
- [ ] Replace accidental `outline: none` patterns with the existing verified `:focus-visible` ring and focus-within treatment.
- [ ] Retain field-error and invalid-state rules currently in `_records.scss`, or move them only if the new owner is clearer; do not duplicate them.
- [ ] Gate hover-only styles with pointer capability and keep active/pressed feedback outside that gate.
- [ ] Run UI component specs, architecture tests, and browser checks for focus, disabled, error, hover, and touch states.

### Task 6: Consolidate shared ledger rows

**Files:**

- Modify: `src/styles/_ledger.scss`
- Modify: `src/styles.scss`
- Modify: `src/app/ui/loan-row.spec.ts`
- Modify: `src/app/design-system.spec.ts`

- [ ] Move handoff-line, loan-row, row-leading, record identity/title/asset/direction, metadata, due-status, results-bar, ledger-column, and record-list rules into `_ledger.scss`.
- [ ] Make one canonical grid definition per viewport context; remove superseded row layouts.
- [ ] Preserve `content-visibility: auto`, intrinsic size, keyboard/accessibility-tree content, and the print fallback.
- [ ] Ensure lent/borrowed direction remains conveyed by words/icons rather than color.
- [ ] Verify Home rows, Records, Lent, Borrowed, History, Search, and Person loan lists at narrow and wide widths.

### Task 7: Consolidate Home

**Files:**

- Create: `src/styles/_home.scss`
- Modify: `src/styles.scss`
- Modify: `src/app/home/home-page.spec.ts` only if a source-contract path needs correction
- Modify: `src/app/styles-architecture.spec.ts`

- [ ] Move overview ribbon, home workspace, primary ledger, ledger icon/record/due/actions, context rail, due rail, and people rail into `_home.scss`.
- [ ] Remove the superseded attention-band, lead-record, glance-list, direction-links, old home-aside, and old record-count styling after proving no runtime consumer.
- [ ] Merge the four `.home-workspace`, four `.home-context-rail`, and three `.home-ledger-row` responsive definitions into one base plus intentional media overrides.
- [ ] Preserve rust exclusively for explicit overdue status and the approved row marker.
- [ ] Compare full-page Home screenshots and computed grid/spacing values at 390x844, 900x800, and 1440x1000.

### Task 8: Consolidate Add and Detail workspaces

**Files:**

- Modify: `src/styles/_records.scss`
- Modify: `src/styles.scss`
- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/features/detail/detail-page.spec.ts`

- [ ] Move Add form, handoff builder, disclosure, submit behavior, preview card/facts, and desktop add workspace into `_records.scss`.
- [ ] Move detail hero, identity, person link, status/balance, summary, due editor, timeline, action rail, repayment form, and completion state into the same domain module.
- [ ] Merge the three submit-button positioning/width blocks into one base and one desktop override.
- [ ] Merge detail action-rail, summary, status, and workspace definitions without changing sticky behavior or responsive columns.
- [ ] Preserve field error associations, invalid states, 44px targets, preview live-region layout, and money tabular figures.
- [ ] Verify Add physical/money forms and Detail physical/money/completed states in tests and browser.

### Task 9: Consolidate supporting screens

**Files:**

- Create: `src/styles/_supporting.scss`
- Modify: `src/styles.scss`
- Modify: `src/app/styles-architecture.spec.ts`

- [ ] Move People overview/list, Person hero/relationship summary/sections, Search workbench, History results, Settings groups/language preference, More list, and local-data note styles into `_supporting.scss`.
- [ ] Merge repeated settings/person/result declarations.
- [ ] Remove only unused supporting-screen classes confirmed by source and route coverage.
- [ ] Verify empty, loading, populated, and error-capable layouts where reachable without mutating production data.
- [ ] Compare all supporting-route screenshots at 390 and 1440 widths.

### Task 10: Normalize capability and responsive contexts

**Files:**

- Modify: `src/styles/_base.scss`
- Modify: `src/styles/_shell.scss`
- Modify: `src/styles/_primitives.scss`
- Modify: `src/styles/_ledger.scss`
- Modify: `src/styles/_home.scss`
- Modify: `src/styles/_records.scss`
- Modify: `src/styles/_supporting.scss`
- Modify: `src/app/styles-architecture.spec.ts`

- [ ] Inventory all remaining media conditions after extraction.
- [ ] Merge duplicate conditions inside each module and remove equivalent px/rem variants.
- [ ] Keep only content-proven breakpoints; document why every remaining boundary exists.
- [ ] Consolidate hover behavior under capability queries.
- [ ] Keep one reduced-motion block that disables non-essential transition/animation behavior and permits its intentional `!important` declarations.
- [ ] Keep one print contract for content visibility and navigation suppression if currently rendered.
- [ ] Test 320px reflow, 200% zoom-equivalent width, tablet widths around 70rem, and wide desktop.

### Task 11: Remove dead CSS and tighten budgets

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`
- Modify: `src/app/design-system.spec.ts`
- Modify: `docs/DESIGN.md`
- Modify: `docs/testing.md`

- [ ] Re-run static selector-consumer analysis against production templates, including bound classes, router active classes, host elements, attributes, pseudo-classes, and browser states.
- [ ] Gather CSS coverage on every route at mobile and desktop widths; treat coverage as supporting evidence, not sole proof.
- [ ] Review Git origin for each unmatched selector group before deletion.
- [ ] Delete confirmed legacy groups one logical group at a time; compile and check affected routes after each deletion.
- [ ] Add final exact ceilings for source bytes, production raw/gzip bytes, repeated selectors, exact duplicates, `!important`, ID selectors, `::ng-deep`, and entrypoint contents.
- [ ] Keep the test resilient to legitimate formatting while strict about architecture and forbidden regressions.
- [ ] Update design/testing documentation with module ownership and verification commands.

### Task 12: Measure final CSS and run full automated verification

**Files:**

- Verify all attributable SCSS, tests, and documentation.

- [ ] Run the same expanded-CSS analyzer used for baseline and record before/after counts.
- [ ] Run `pnpm test`; require zero failed tests.
- [ ] Run `pnpm lint`; require ESLint and Prettier success.
- [ ] Run `pnpm typecheck`; require Angular development compilation success.
- [ ] Run `pnpm build`; require production budgets and service-worker generation success.
- [ ] Measure final CSS raw/gzip bytes from the new production artifact.
- [ ] Run `git diff --check` and inspect `git diff --stat`, `git diff`, and `git status --short` for unrelated or generated files.
- [ ] Do not claim an improvement unless the fresh final measurement is lower than or equal to the stated baseline.

### Task 13: Real-browser regression acceptance

**Files:**

- Verify only; screenshots and traces stay in a temporary directory.

- [ ] Reload the verified build/dev server in the same named isolated browser context.
- [ ] Recreate every baseline screenshot with identical viewport, route, data, scroll position, color scheme, and browser scale.
- [ ] Pixel-compare before/after screenshots; investigate every non-zero diff rather than dismissing it as expected.
- [ ] At 390x844 verify Home, Records, Add, Detail, People, Person, History, Search, More, and Settings.
- [ ] At 900x800 verify compact shell, responsive grids, bottom navigation, and no control collision.
- [ ] At 1120px boundary verify exactly one navigation mode is active.
- [ ] At 1440x1000 verify desktop header, Home columns, record grids, Add preview, and Detail action rail.
- [ ] Verify keyboard focus order and visible indicator for skip link, navigation, language selector, filters, forms, rows, and action controls.
- [ ] Inspect the accessibility tree for one main landmark, coherent headings, named controls, status/error regions, and no hidden focusable element.
- [ ] Require zero console errors/warnings and zero failed local network requests.
- [ ] Run Lighthouse accessibility/best-practices audit and explain/fix any regression.
- [ ] Delete the isolated browser context or close only its pages; never touch personal browser state.

### Task 14: Android APK update

**Files:**

- Build artifact: `android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] Run `adb devices -l`; proceed only with exactly one authorized non-emulator physical device.
- [ ] Resolve the installed Borrowed package and record version/signature metadata before update without reading unrelated device data.
- [ ] Build verified web assets and run `pnpm exec cap sync android`.
- [ ] Inspect Git status for generated tracked Android changes before packaging.
- [ ] Resolve the repository-required JDK and run Gradle `assembleDebug` with command-scoped environment variables.
- [ ] Calculate APK SHA-256 and inspect package, version, minSdk, targetSdk, and signer.
- [ ] Install with `adb -s <verified-serial> install -r <absolute-apk>`; never uninstall or clear application data.
- [ ] Cold-launch the known package activity and require successful Activity Manager status.
- [ ] Confirm the process is alive, the activity is resumed, no fatal crash appears, and existing local records are still visible.
- [ ] Report the artifact path, hash, device model/serial, install result, launch result, preserved-data evidence, web verification, CSS delta, and any remaining caveat.

## Completion gate

- [ ] Every source selector has a clear module owner.
- [ ] `src/styles.scss` is an import manifest only.
- [ ] Proven dead legacy layers are absent.
- [ ] Exact duplicate declarations are absent within the same context.
- [ ] Repeated selectors and conflicting overrides are below the recorded baseline and bounded by tests.
- [ ] Production raw and gzip CSS do not increase.
- [ ] Approved visuals remain pixel-equivalent at baseline viewports.
- [ ] Focus, hit areas, reduced motion, print, and 320px reflow remain valid.
- [ ] Tests, lint, typecheck, build, diff check, browser QA, and Android update have fresh evidence.

## Plan self-review

The plan contains no unspecified deletion or broad rewrite. Every destructive-looking CSS removal is gated by static consumers, route coverage, history, compile/test results, and visual comparison. The Android stage preserves data by requiring `install -r` and exactly one verified physical target. No new dependency or product behavior is introduced.
