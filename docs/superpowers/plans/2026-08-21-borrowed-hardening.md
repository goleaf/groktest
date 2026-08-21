# Borrowed Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` and execute inline. Do not dispatch subagents unless the user explicitly requests delegation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the approved Borrowed Handoff Ledger across responsive design, list state/performance, Angular async state, Home hierarchy, Signal Forms, and a verified in-place Android APK update.

**Architecture:** Preserve domain commands, Dexie schema v3, routes, translations, and the installed dataset. Introduce small pure URL-state helpers, indexed store reads, page-level Angular resources, typed Signal Form models, and focused SCSS partials. Land each concern test-first and keep the app runnable after every task.

**Tech Stack:** Angular 22 standalone/zoneless, TypeScript strict, Angular Signal Forms and `resource`, Dexie/IndexedDB, SCSS, Vitest/jsdom/fake-indexeddb, Playwright/Chrome DevTools MCP, Capacitor 8, Gradle/JDK 21, ADB.

**Execution policy:** Work in the existing dirty tree without reset, checkout, cleanup of unrelated changes, commit, or push. Run targeted checks after every slice and full checks before Android packaging.

---

### Task 1: Baseline and responsive-shell regression

**Files:**

- Modify: `src/app/layout/shell.spec.ts`
- Modify: `src/app/design-system.spec.ts`
- Modify: `src/styles.scss`
- Create: `src/styles/_tokens.scss`
- Create: `src/styles/_shell.scss`

- [ ] Record the attributable dirty-tree baseline with `git status --short`, `git diff --stat`, `pnpm test`, `pnpm lint`, and `pnpm typecheck`.
- [ ] Remove only the generated root-level `borrowed-audit-mobile.png` QA artifact created by the browser audit.
- [ ] Add a failing design-system assertion that expanded desktop navigation begins at `70rem` and that the compact mobile navigation remains the active navigation below that boundary.
- [ ] Run `pnpm test -- src/app/design-system.spec.ts src/app/layout/shell.spec.ts`; expect the breakpoint assertion to fail against the current 880px rule.
- [ ] Consolidate final hue-188 tokens into `_tokens.scss` and import them first from `styles.scss`. Remove the duplicate final `:root` override from the Handoff Ledger block.
- [ ] Move the final app-header, header-inner, desktop navigation, header tools, footer, mobile navigation, and their responsive rules into `_shell.scss` without changing selectors used by `Shell`.
- [ ] Change the expanded navigation boundary to `@media (min-width: 70rem)` and keep the bottom navigation visible below it.
- [ ] Add `scroll-padding-bottom`/page bottom space sufficient for the safe-area-aware bottom navigation and preserve `:focus-visible` visibility.
- [ ] Run the targeted tests and `pnpm typecheck`; expect pass.
- [ ] Browser-check 900x800 and confirm no overlapping header controls and no horizontal overflow.

### Task 2: URL contract for Records

**Files:**

- Create: `src/app/features/lists/record-list-state.ts`
- Create: `src/app/features/lists/record-list-state.spec.ts`
- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/app/features/lists/list-page.spec.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`
- Modify: `src/app/i18n/i18n.spec.ts`

- [ ] Write pure failing tests for parsing `scope`, `filter`, and `q`; invalid values must fall back to route defaults.
- [ ] Write failing serialization tests: omit `scope` when it equals the route default, omit `filter=all`, trim/collapse empty search, and preserve unrelated query parameters.
- [ ] Implement literal allow-lists and pure `parseRecordListState()` / `recordListQueryParams()` helpers with no Router dependency.
- [ ] Run the helper spec; expect pass.
- [ ] Update the ListPage component test with a real RouterTesting setup. Assert that choosing Borrowed creates `?scope=borrowed`, choosing Overdue adds `filter=overdue`, entering a query adds `q`, and Back restores the prior pressed controls.
- [ ] Run the component spec; expect failure before component integration.
- [ ] Inject `ActivatedRoute` and `Router`; convert query-param state to a signal with `toSignal(route.queryParamMap)`.
- [ ] Replace writable scope/filter/query signals with computed URL-derived state plus `setScope`, `setFilter`, and `setQuery` handlers that call `router.navigate([], { relativeTo, queryParams, queryParamsHandling: 'merge' })`.
- [ ] Keep `/lent` and `/borrowed` route defaults stable while allowing explicit scope changes.
- [ ] Give the result-count container `role="status"` and `aria-live="polite"`; ensure it exists before its text changes.
- [ ] Run helper, list, route, and i18n tests; expect pass.

### Task 3: Indexed reads and bounded record rendering

**Files:**

- Modify: `src/app/data/store.ts`
- Modify: `src/app/data/dexie-store.ts`
- Modify: `src/app/data/dexie-store.spec.ts`
- Modify: `src/app/data/borrowed-app.ts`
- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/styles.scss`
- Create: `src/styles/_ledger.scss`

- [ ] Add failing store integration tests proving `listActiveLoans()` excludes completed/deleted rows, accepts an optional direction, and `listCompletedLoans()` excludes active/deleted rows.
- [ ] Add abstract methods to `BorrowedStore` and implement them using the existing `status` or `direction` Dexie indexes followed by only the necessary in-collection predicate. Do not bump `LOCAL_SCHEMA_VERSION`.
- [ ] Change `BorrowedApp.activeLoans()` and `history()` to use the indexed store methods.
- [ ] Add a failing test that `remainingMap()` asks only for repayments belonging to visible money-loan IDs.
- [ ] Replace the all-repayment read in `remainingMap()` with `listRepaymentsForLoanIds()` for visible money loans.
- [ ] Move final ledger/list/overview row rules into `_ledger.scss` and import it after shell styles.
- [ ] Add `content-visibility: auto` and a conservative `contain-intrinsic-size` to record-list items, while preserving complete accessibility-tree content and print behavior.
- [ ] Convert the phone filter chips to a one-line horizontal rail with keyboard/touch scrolling, visible focus, and no clipped first/last control.
- [ ] Run the data, application, list, design-system, and CSS-related tests; expect pass.

### Task 4: Race-free page resources

**Files:**

- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/app/features/lists/list-page.spec.ts`
- Modify: `src/app/features/home/home-page.ts`
- Modify: `src/app/features/home/home-page.spec.ts`
- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/features/detail/detail-page.spec.ts`

- [ ] Add a deferred-Promise ListPage test: start All, switch to Borrowed, resolve Borrowed first and All last, then assert the visible list remains Borrowed.
- [ ] Replace the ListPage Promise-writing effect with one `resource()` returning `{ loans, remaining }` for revision/scope/locale params.
- [ ] Read resource values through computed signals; expose a useful localized error state if the loader fails.
- [ ] Run the list test; expect pass.
- [ ] Add a Home resource regression test that locale/revision changes cannot allow an older payload to replace a newer one.
- [ ] Replace the Home Promise-writing effect with a resource keyed by revision/current-day/locale.
- [ ] Add a Detail test using a reactive `paramMap`: navigate from Loan A to Loan B without destroying the component and assert Loan B renders.
- [ ] Convert route params with `toSignal`; replace the snapshot Promise effect with a resource keyed by ID and revision.
- [ ] Derive missing/loading/record states from resource status/value and reset the due-date form model when the loaded record changes.
- [ ] Run all three component specs; expect pass without unhandled rejections.

### Task 5: Non-duplicated Home hierarchy

**Files:**

- Modify: `src/app/domain/types.ts`
- Modify: `src/app/domain/home-summary.ts`
- Modify: `src/app/domain/home-summary.spec.ts`
- Modify: `src/app/features/home/home-page.ts`
- Modify: `src/app/features/home/home-page.spec.ts`
- Modify: `src/styles.scss`

- [ ] Add failing domain assertions that primary `actions` contains at most five urgency-ranked active records and `dueNext` contains at most four non-overdue dated records ordered by due date.
- [ ] Extend `HomeSummary` with `dueNext: HomeAction[]`; derive it in the existing summary pass without a Store query.
- [ ] Ensure an ID never appears in both `actions` and `dueNext` when it would duplicate a visible overdue record.
- [ ] Change Home to render `data.dueNext` rather than filtering `data.actions`.
- [ ] Preserve the existing people rail and summary ribbon; keep the empty Home path unchanged.
- [ ] Refine row emphasis so rust appears on explicit overdue status/marker only and future deadlines remain neutral/teal.
- [ ] Run domain and Home component tests; expect pass.
- [ ] Browser-check the first viewport at 390x844 and 1440x1000; confirm the context rail no longer repeats the same overdue records.

### Task 6: Add form on Angular Signal Forms

**Files:**

- Modify: `src/app/features/add/add-page.ts`
- Modify: `src/app/features/add/add-page.spec.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`

- [ ] Add failing tests for required person/item/amount fields, conditional item-vs-money validation, touched errors after submit, and successful create payload.
- [ ] Introduce one non-nullable `AddRecordFormModel` signal containing direction, kind, personName, personId, itemName, amount, currency, dueOn, and note.
- [ ] Build `form(model, schema)` with required/max-length/custom rules. Keep currency precision and business validation in domain commands.
- [ ] Replace `FormsModule` with `FormField`; bind text/date/select controls through `[formField]` and update direction/kind/person selection by immutable model updates.
- [ ] Derive recents, prompts, preview, and draft payload from the one model signal.
- [ ] Keep debounced IndexedDB draft persistence as the sole imperative effect; loading a draft updates the model once before enabling persistence.
- [ ] Submit with Angular `submit()` and keep the submit button enabled until an operation begins. Render field-linked translated guidance after touch.
- [ ] Preserve form contents on domain/storage failure and clear the draft only after a successful committed Loan.
- [ ] Run Add, seed, draft, i18n, and accessibility-related tests; expect pass.

### Task 7: Detail forms and route-safe operation state

**Files:**

- Modify: `src/app/features/detail/detail-page.ts`
- Modify: `src/app/features/detail/detail-page.spec.ts`
- Modify: `src/app/i18n/en.ts`
- Modify: `src/app/i18n/ru.ts`
- Modify: `src/app/i18n/lt.ts`

- [ ] Add failing tests for invalid/unchanged due date, empty repayment, busy-submit prevention, domain error preservation, and successful resource reload.
- [ ] Create one-field non-nullable Signal Form models for due date and repayment amount.
- [ ] Bind the controls with `FormField`, add required/date/minimum/custom rules where presentation-safe, and keep financial limits in `BorrowedApp.repay()`.
- [ ] Submit with `submit()`; use explicit saving signals only for transactional operation state.
- [ ] Disable duplicate mutation while a save is running but do not disable untouched forms merely because they are invalid.
- [ ] On success rely on application revision/resource reload, reset only the successfully committed form, and keep translated error alerts actionable.
- [ ] Run Detail, command, and Dexie transaction tests; expect pass.

### Task 8: SCSS consolidation and static quality gate

**Files:**

- Modify: `src/styles.scss`
- Modify: `src/app/design-system.spec.ts`
- Modify: `docs/DESIGN.md`
- Modify: `docs/testing.md`
- Create or modify: `src/styles/_tokens.scss`
- Create or modify: `src/styles/_shell.scss`
- Create or modify: `src/styles/_ledger.scss`
- Create: `src/styles/_records.scss`

- [ ] Move Add/Detail workspace rules into `_records.scss`; keep `styles.scss` as ordered imports plus still-shared foundation/feature rules.
- [ ] Use `rg` against templates and components to identify selectors from the superseded pre-ledger shell/Home implementation.
- [ ] Remove only selectors with no source consumer and no deliberate browser-only state. Do not use broad regex deletion.
- [ ] Consolidate duplicate token and shell declarations so final values have one owner.
- [ ] Ensure input focus has both border change and a visible `:focus-visible` outline; never leave `outline: none` without replacement.
- [ ] Keep hover rules inside `@media (hover: hover)`, reduced-motion override, safe-area insets, 44px targets, tabular figures, text wrapping, and hue-188/rust contracts.
- [ ] Update design/testing docs with the 70rem responsive boundary, URL-state contract, resources, Signal Forms, content visibility, and Android acceptance.
- [ ] Run `pnpm format`, design-system tests, `pnpm lint`, and `pnpm typecheck`; expect pass.

### Task 9: Full browser acceptance

**Files:**

- Verify only; do not retain screenshots, traces, browser profiles, generated bundles, or temporary audit files in the repository.

- [ ] Run `pnpm test`; expect 0 failed files/tests.
- [ ] Run `pnpm lint`; expect ESLint and Prettier checks to pass.
- [ ] Run `pnpm typecheck`; expect Angular development build success.
- [ ] Run production `pnpm build`; expect budgets and PWA build success.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Start/update the Angular MCP dev server and open only the known loopback project URL in an isolated browser context.
- [ ] At 390x844 verify Home, Records, Add, Detail, filters, bottom navigation, keyboard focus, safe-area spacing, and no horizontal overflow.
- [ ] At 900x800 verify compact header/bottom navigation and zero measured element overlap.
- [ ] At 1440x1000 verify expanded header, ledger columns, non-duplicated Home rail, Add preview, and Detail action rail.
- [ ] Exercise Records scope/filter/search, browser Back/Forward, language change, Add validation, physical return, repayment, due-date change, and reload persistence.
- [ ] Confirm 100 Loans remain present in the isolated demo database, relationships remain valid, the console has zero errors/warnings, and Lighthouse accessibility/best-practices remain 100 or every regression is explained and fixed.

### Task 10: Android package and in-place physical update

**Files:**

- Build artifact: `android/app/build/outputs/apk/debug/app-debug.apk`
- Generated Capacitor web assets: ignored build output only; inspect tracked status after sync.

- [ ] Re-run `adb devices -l`; require exactly one authorized non-emulator device and confirm Samsung `SM_A920F`, serial `2a5beba940017ece`.
- [ ] Confirm `app.borrowed.local` is currently installed and record its version/install metadata before update.
- [ ] Build development web assets with `pnpm exec ng build --configuration development`; this retains empty-install demo seeding while never reseeding an installation that already contains Loans.
- [ ] Run `pnpm exec cap sync android`; inspect `git status --short` for unexpected tracked Android changes.
- [ ] Run `env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew assembleDebug` from `android/`.
- [ ] Calculate SHA-256 and inspect package/version/minSdk/targetSdk with Android build tools.
- [ ] Verify the APK with `apksigner verify --verbose --print-certs`; require v2 verification and the expected debug signer.
- [ ] Install with `adb -s 2a5beba940017ece install -r <absolute-apk-path>`; do not uninstall, clear data, or touch unrelated packages.
- [ ] Cold-launch `app.borrowed.local/.MainActivity` with `am start -S -W` and require `Status: ok`.
- [ ] Confirm the Activity is resumed, the package process exists, and no FATAL/AndroidRuntime/Capacitor errors appear in the post-launch log.
- [ ] Capture and inspect temporary Home and Records screenshots showing the updated layout and preserved record counts/details.
- [ ] Delete only the exact temporary QA screenshots from the device and local temporary directory; leave the app and IndexedDB intact.
- [ ] Report APK path, SHA-256, device, install result, launch time, visible data evidence, test/browser evidence, and any remaining caveat.

## Plan self-review

- **Spec coverage:** every approved audit item maps to Tasks 1–8; browser and physical-device acceptance map to Tasks 9–10.
- **Placeholders:** no TBD, TODO, generic error-handling instruction, or unspecified test remains.
- **Type consistency:** URL state values reuse existing `ListFilter` and direction unions; Store methods return existing `Loan[]`; Home reuses `HomeAction`; forms submit existing `CreateRecordInput`/mutation methods.
- **Data safety:** no schema bump, uninstall, database clear, reseed, or destructive Git operation.
- **Dependency discipline:** no new runtime or development dependency.
- **Execution:** inline only, no subagents, commits, or push without a new explicit request.
