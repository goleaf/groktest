# Borrowed SCSS Optimization Pass 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `executing-plans` for inline task-by-task execution. Do not dispatch subagents in this repository unless the user explicitly requests delegation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exhaust the remaining evidence-backed SCSS optimizations after pass 1 while preserving the approved UI pixel-for-pixel and updating the connected Android application without deleting local data.

**Architecture:** Retain the eight-module global Sass cascade and its ownership order. Add static contracts for pointer capability, dead tokens, redundant cascade work, logical inline geometry, same-module body duplication, and the Angular styles bundle budget; then satisfy each contract in small RED/GREEN slices.

**Tech Stack:** Angular 22 standalone/zoneless, Dart Sass, strict TypeScript, Vitest, Chrome DevTools MCP with disposable isolated contexts, pnpm, Capacitor 8, Gradle/JDK 21, ADB.

**Pass-2 baseline:** 47,987 authored bytes; 47,603 expanded bytes; 405 rules; 1,439 declarations; 38,028 production bytes; 7,512 gzip bytes; 13 ungated hover selectors; one unused token; one no-op responsive rule; zero dead runtime classes; zero same-context selector/property conflicts; LCP 712 ms; CLS 0.00.

---

### Task 1: Freeze the second-pass evidence

**Files:**

- Verify: `src/styles.scss`
- Verify: `src/styles/*.scss`
- Verify: `src/app/**/*.ts`
- Artifact: temporary expanded CSS and screenshots outside the repository

- [ ] **Step 1: Confirm clean scope and exact revision**

Run:

```bash
git status --short
git log --oneline --decorate -6
```

Expected: no unrelated worktree entries; `main` and `origin/main` identify the same starting commit.

- [ ] **Step 2: Record authored size**

Run:

```bash
wc -l -c src/styles.scss src/styles/*.scss
```

Expected baseline total: 2,826 lines and 47,987 bytes.

- [ ] **Step 3: Build and record production size**

Run:

```bash
pnpm build
wc -c dist/borrowed/browser/styles-*.css
gzip -9 -c dist/borrowed/browser/styles-*.css | wc -c
```

Expected baseline: 38,028 raw bytes and 7,512 gzip bytes.

- [ ] **Step 4: Compile expanded CSS and run the read-only analyzer**

Run Sass into a validated `mktemp -d` directory and use the installed PostCSS package to count rules, declarations, selectors, repeated selector/property pairs, identical bodies, token usage, hover contexts, and symmetric physical pairs.

Expected: 405 rules, 1,439 declarations, 483 selector entries, zero same-context repeated selector/property pairs, and 13 hover entries outside `(hover: hover)`.

- [ ] **Step 5: Capture browser evidence**

Use an isolated Chrome DevTools context on the verified current server. Capture Home, Records, Add, and Settings at 390x844 and 1440x1000. Record overflow, main landmark count, console/network state, LCP, and CLS.

Expected: LCP around the recorded 712 ms synthetic baseline, CLS 0.00, zero horizontal overflow, and no console error/warning.

### Task 2: Extend the source parser without changing production SCSS

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`

- [ ] **Step 1: Add a shared rule/context reader**

Extend the existing character parser so it returns records shaped as:

```ts
type StyleRule = {
  moduleName: (typeof styleModules)[number];
  context: string;
  selectors: string[];
  declarations: { property: string; value: string }[];
};
```

The parser must strip block comments, preserve nested at-rule context, split selector lists, and never execute Sass.

- [ ] **Step 2: Keep existing tests on the shared parser**

Refactor `selectorKeys()` to consume `StyleRule[]` without weakening its current assertions.

- [ ] **Step 3: Run the current architecture suite**

Run:

```bash
pnpm exec ng test --watch=false --include=src/app/styles-architecture.spec.ts
```

Expected: all existing architecture tests pass before adding new failing contracts.

- [ ] **Step 4: Inspect the diff**

Run `git diff -- src/app/styles-architecture.spec.ts` and confirm this slice changes test infrastructure only.

### Task 3: Gate every hover selector by pointer capability

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`
- Modify: `src/styles/_base.scss`
- Modify: `src/styles/_shell.scss`
- Modify: `src/styles/_primitives.scss`
- Modify: `src/styles/_ledger.scss`

- [ ] **Step 1: Write the failing contract**

Add:

```ts
it('keeps hover presentation inside a hover-capable media context', () => {
  const ungatedHoverSelectors = rules.flatMap((rule) =>
    rule.context.includes('@media (hover: hover)')
      ? []
      : rule.selectors
          .filter((selector) => selector.includes(':hover'))
          .map((selector) => `${rule.moduleName}:${selector}`),
  );

  expect(ungatedHoverSelectors).toEqual([]);
});
```

- [ ] **Step 2: Verify RED**

Run the targeted Angular test.

Expected: FAIL listing 13 selectors, including native fields, mobile navigation, language option, button, back link, segmented controls, chips, list navigation, and loan rows.

- [ ] **Step 3: Split persistent states from hover states**

Preserve these outside media queries:

```scss
.mobile-nav a.active {
  color: var(--teal);
  background: var(--surface-muted);
}

.chips button.on {
  color: var(--on-teal);
  background: var(--teal);
  border-color: var(--teal);
}
```

Move only selectors containing `:hover` into each owner module's single `@media (hover: hover)` block. Move the button transform together with its background and border so the base duplicate disappears.

- [ ] **Step 4: Verify GREEN**

Run the targeted architecture test and compile development CSS.

- [ ] **Step 5: Browser-check capability behavior**

At desktop hover capability, verify the same computed hover colors/transforms. Under `390x844x1,mobile,touch`, confirm persistent active/on states remain but hover-only presentation is not applied.

### Task 4: Remove dead tokens and redundant selector qualification

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`
- Modify: `src/styles/_tokens.scss`
- Modify: `src/styles/_primitives.scss`

- [ ] **Step 1: Write the unused-token RED test**

Collect declarations with `/\b(--[\w-]+)\s*:/g` and consumers with `/var\((--[\w-]+)/g`. Assert that every declaration occurs in the consumer set.

Expected RED: `--z-base`.

- [ ] **Step 2: Remove only `--z-base`**

Delete its declaration; retain `--z-sticky` and `--z-skip`.

- [ ] **Step 3: Write the redundant selector RED test**

For each selector list, normalize simple selectors and reject a list containing both `.button` and `button.button`.

Expected RED: `_primitives.scss:button.button`.

- [ ] **Step 4: Keep only `.button`**

Change:

```scss
.button,
button.button {
```

to:

```scss
.button {
```

- [ ] **Step 5: Verify both contracts GREEN**

Run the targeted architecture suite and the button component/page tests that exercise link and button instances.

### Task 5: Remove overwritten and inert declarations

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`
- Modify: `src/styles/_primitives.scss`
- Modify: `src/styles/_shell.scss`

- [ ] **Step 1: Add shorthand-overwrite detection**

Expand `margin`, `padding`, and `border` shorthands into comparable logical maps inside the test helper. For every declaration, recompute the final map without it; report a declaration when removing it leaves the same final map.

Expected RED includes the early button `border-color`.

- [ ] **Step 2: Delete the overwritten button declaration**

Keep only `border: 1px solid var(--teal)` as the canonical source of button border color.

- [ ] **Step 3: Add a rendered-effect regression for `.header-add`**

The browser baseline must record `border-top-style: none` and `border-top-width: 0px` for the anchor. Remove its inert base and hover `border-color` declarations, then require computed border style/width and screenshots to remain equal.

- [ ] **Step 4: Verify GREEN and pixel equality**

Run the targeted test, compile, and compare the desktop header screenshot.

### Task 6: Eliminate no-op responsive rules

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`
- Modify: `src/styles/_primitives.scss`

- [ ] **Step 1: Write the RED test**

Expand margin/padding shorthands and compare every media-rule declaration map with the final base declaration map for the same selector. Report a media rule when all of its final declarations equal base values.

Expected RED: `.page` in `@media (min-width: 70rem)`.

- [ ] **Step 2: Remove the full no-op media rule**

Delete only:

```scss
@media (min-width: 70rem) {
  .page {
    margin: 0;
    margin-right: auto;
    margin-left: auto;
  }
}
```

- [ ] **Step 3: Remove duplicate side declarations from the base `.page` rule**

Keep `margin: 0 auto`; delete the equivalent `margin-right` and `margin-left` declarations.

- [ ] **Step 4: Verify GREEN at 1119 and 1120 pixels**

Require the same `.page` bounding box and computed four margin sides across the shell boundary.

### Task 7: Replace symmetric physical pairs with logical inline geometry

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`
- Modify: `src/styles/_shell.scss`
- Modify: `src/styles/_ledger.scss`
- Modify: `src/styles/_records.scss`
- Modify: `src/styles/_home.scss`
- Modify: `src/styles/_primitives.scss`

- [ ] **Step 1: Write the RED test**

Report a rule containing equal `*-left` and `*-right` values for `padding` or `margin`. Exclude single-direction geometry such as the handoff arrow's negative left margin.

Expected RED: wide `.main`, `.header-inner`, ledger hover/base rows, records chips, Home page, and Add/Detail page containers.

- [ ] **Step 2: Apply the exact replacements**

Use:

```scss
padding-inline: 72px;
padding-inline: 24px;
padding-inline: 10px;
padding-inline: 14px;
margin-inline: calc(var(--content-pad) * -1);
```

Use `margin: 0 auto` for block containers that have no independent block margin.

- [ ] **Step 3: Verify RED-to-GREEN**

Run the targeted test, then compare computed left/right values in Chrome at 390, 1119, 1120, and 1440 pixels.

- [ ] **Step 4: Verify physical Android support**

After APK installation, confirm shell padding and centered page geometry on the Samsung screenshot. Do not introduce a logical-property fallback unless the physical WebView proves it necessary.

### Task 8: Coalesce identical same-module declaration bodies

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`
- Modify: `src/styles/_home.scss`
- Modify: `src/styles/_records.scss`
- Modify: `src/styles/_shell.scss`
- Modify: `src/styles/_supporting.scss`

- [ ] **Step 1: Write the RED test for meaningful duplicates**

Normalize declaration order and assert there are no two rule blocks in the same module/context with an identical body of at least two declarations.

Expected RED: Home truncation and metadata pairs plus Add preview/detail action rail.

- [ ] **Step 2: Merge Home rail rules**

Combine due/people truncation selectors in one rule and due/people metadata typography selectors in one rule without changing declarations.

- [ ] **Step 3: Merge Add/Detail side-panel geometry**

Use:

```scss
.add-preview,
.detail-action-rail {
  align-self: start;
  padding: 22px;
}
```

- [ ] **Step 4: Consider single-declaration groups separately**

Merge only readable same-concern groups such as shell hidden labels and supporting margin resets. Leave cross-concern one-property matches separate and document them as intentional; do not optimize line count at the expense of ownership.

- [ ] **Step 5: Verify GREEN and rule-count reduction**

Run the architecture suite and expanded-CSS analyzer. Require the final rule count to be lower than 405.

### Task 9: Add a production styles bundle budget

**Files:**

- Modify: `angular.json`
- Modify: `src/app/styles-architecture.spec.ts`

- [ ] **Step 1: Write the RED config test**

Read `angular.json`, locate `projects.borrowed.architect.build.configurations.production.budgets`, and require:

```json
{
  "type": "bundle",
  "name": "styles",
  "maximumWarning": "38.5kB",
  "maximumError": "39kB"
}
```

- [ ] **Step 2: Verify RED**

Expected: the named styles budget is absent.

- [ ] **Step 3: Add the exact budget**

Place it after the initial budget and before `anyComponentStyle`.

- [ ] **Step 4: Verify GREEN with production build**

Run `pnpm build`. Require no style-budget warning and output below the 38.5 kB warning threshold.

### Task 10: Tighten final static ceilings

**Files:**

- Modify: `src/app/styles-architecture.spec.ts`
- Modify: `docs/DESIGN.md`
- Modify: `docs/testing.md`

- [ ] **Step 1: Measure final authored and compiled values**

Record lines, bytes, expanded rules/declarations/selectors, production raw bytes, and gzip bytes.

- [ ] **Step 2: Tighten the source ceiling**

Replace 48,500 with a rounded ceiling no more than 1% above the final authored byte count.

- [ ] **Step 3: Document the new invariants**

Add hover capability, logical inline geometry, no-op media, same-module duplicate-body, unused-token, and named bundle-budget requirements to the design/testing docs.

- [ ] **Step 4: Run the architecture and design-system suites**

Expected: every static contract passes with actionable failure names.

### Task 11: Full automated verification

**Files:** verify the complete attributable diff

- [ ] Run `pnpm test`; require zero failures and record exact file/test counts.
- [ ] Run `pnpm lint`; require ESLint and Prettier success.
- [ ] Run `pnpm typecheck`; require Angular development compilation success.
- [ ] Run `pnpm build`; require production budgets and service-worker generation success.
- [ ] Run `git diff --check`.
- [ ] Inspect `git status --short`, `git diff --stat`, `git diff`, and any staged diff without resetting or discarding unrelated changes.
- [ ] Re-run raw/gzip measurement only after the final production build.

### Task 12: Browser regression and performance acceptance

**Files:** temporary screenshots and traces only

- [ ] Start or verify the current checkout on a dedicated localhost port.
- [ ] Use a new disposable isolated browser context.
- [ ] Capture final Home, Records, Add, and Settings screenshots with the baseline viewports/data/scroll position.
- [ ] Require byte-identical PNGs; if PNG metadata differs, require pixel SSIM 1.000000 and inspect the difference image.
- [ ] Verify all ten routes at 390 and 1440 pixels with one main landmark and zero overflow.
- [ ] Verify navigation at 900, 1119, 1120, and 1440 pixels.
- [ ] Verify desktop hover styles and touch non-hover behavior.
- [ ] Tab to the skip link and language control; require visible focus.
- [ ] Require zero console errors/warnings/issues and zero failed local requests.
- [ ] Run Lighthouse navigation audit; require Accessibility and Best Practices 100 unless a concrete external baseline issue is documented.
- [ ] Record an after performance trace and compare LCP/CLS with the 712 ms/0.00 synthetic baseline without claiming causality from normal run-to-run noise.
- [ ] Close only the pass-2 isolated pages; do not touch personal or other-agent browser contexts.

### Task 13: Android update

**Files:**

- Artifact: `android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] Run `adb devices -l`; proceed only with exactly one authorized physical non-emulator device.
- [ ] Confirm package `app.borrowed.local` and compatible device API without reading unrelated data.
- [ ] Build development web assets and run `pnpm exec cap sync android`.
- [ ] Inspect Git status for tracked generated changes.
- [ ] Run `env JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew assembleDebug` from `android/`.
- [ ] Verify package/version/minSdk/targetSdk with `aapt`, signature with `apksigner`, and calculate SHA-256.
- [ ] Reconfirm that serial `2a5beba940017ece` is still the only authorized physical device, then install with `adb -s 2a5beba940017ece install -r /Users/andrejprus/Herd/groktest/android/app/build/outputs/apk/debug/app-debug.apk`; abort the device mutation if the serial or device count changed, and never uninstall or clear data.
- [ ] Cold-launch `app.borrowed.local/.MainActivity` and require Activity Manager `Status: ok`.
- [ ] Confirm a live PID, `mResumed=true`, visible preserved records, correct logical geometry, and no fatal crash signature.

## Completion gate

- [ ] Authored, expanded, production raw, and gzip CSS are all measured before and after.
- [ ] Every hover selector is capability-gated and persistent active/on states still work.
- [ ] No unused token, redundant type qualification, overwritten declaration, or no-op media override remains.
- [ ] Symmetric inline geometry uses logical properties where semantics are unchanged.
- [ ] Identical multi-declaration bodies do not repeat within a module/context.
- [ ] Source and production style budgets are enforced.
- [ ] Rule count and raw/gzip bytes are lower than pass-2 baseline.
- [ ] Approved screenshots remain pixel-equivalent.
- [ ] Full tests, lint, typecheck, build, diff check, browser QA, Lighthouse, and Android update have fresh evidence.

## Plan self-review

The plan maps every design-addendum requirement to a concrete task and command. It contains no unbounded purge, component-style migration, post-processing dependency, placeholder, or speculative browser claim. Persistent states are explicitly separated from hover-only states, logical-property replacements are enumerated, every production edit starts with a failing contract, and Android delivery preserves data. Git checkpoints inspect shared state without authorizing destructive operations or commits not requested by the user.
