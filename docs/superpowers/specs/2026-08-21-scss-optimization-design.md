# Borrowed SCSS optimization design

## Objective

Turn the accumulated Borrowed stylesheet into a small, deterministic, auditable Sass system without changing the approved white/teal Handoff Ledger interface, routes, interaction behavior, translations, IndexedDB data, Capacitor package, or Android installation.

This is a behavior-preserving refactor. A visual change is a regression unless it is required to retain an existing accessibility guarantee and is explicitly documented.

## Measured baseline

The pre-change source and production measurements are:

- `src/styles.scss`: 3,151 lines and 52,190 bytes;
- all SCSS sources: 3,246 lines and 54,642 bytes;
- production CSS: 43,736 bytes raw and 8,509 bytes gzip;
- 470 compiled rule blocks and 1,642 declarations;
- 438 unique individual selectors;
- 110 selectors declared more than once, creating 143 extra selector occurrences;
- 120 repeated selector/property pairs: 9 exact duplicates and 111 conflicting overrides;
- 17 media-query blocks with overlapping breakpoint vocabularies;
- 11 `!important` declarations, of which four reduced-motion declarations are intentional;
- approximately 24 legacy class candidates with no runtime source consumer.

Specificity is not the primary problem: no ID selectors exist and only three selector-list entries reach four class/pseudo-class units. The dominant costs are the appended old/new design layers, dead selectors, repeated responsive rules, and unclear ownership.

## Considered approaches

### 1. Minify the existing global file

Keep the source architecture intact and rely on production compression. This has the lowest implementation cost, but it does not address cascade conflicts, dead rules, breakpoint drift, or future maintenance risk. It is rejected.

### 2. Move every rule into Angular component styles

Use `styleUrl` and emulated encapsulation for every page and UI component. This maximizes local isolation, but the measured global CSS is already only 8.5 KB gzip. Angular selector rewriting would increase selector bytes, shared rules would be duplicated, and parent styles could no longer safely reach markup inside `app-loan-row`, `app-page-heading`, `app-handoff-line`, and other child components. It also introduces `anyComponentStyle` budget pressure. This is rejected for the current application.

### 3. One emitted cascade with focused Sass modules

Keep one Angular stylesheet entrypoint and one emitted cascade, but assign every selector to exactly one Sass module. Remove the superseded layer, consolidate selectors and responsive rules, expose one token/breakpoint vocabulary, and enforce static budgets in Vitest. This keeps runtime CSS minimal while making ownership explicit. It is selected.

## Module architecture

`src/styles.scss` becomes an import manifest only, in this order:

1. `styles/tokens` — custom properties and non-emitting Sass configuration;
2. `styles/base` — box sizing, document defaults, typography, native elements, icons, screen-reader utility, global focus;
3. `styles/shell` — skip link, app frame, header, desktop navigation, footer, mobile navigation, safe areas;
4. `styles/primitives` — page headings, sections, buttons, fields, segmented controls, chips, status, empty states, shared rows;
5. `styles/ledger` — handoff line, loan rows, results header, record-list containment and print fallback;
6. `styles/home` — overview ribbon, attention ledger, due rail, people rail;
7. `styles/records` — add workspace, record preview, detail workspace, forms, balance and timeline;
8. `styles/supporting` — people, person detail, search, history, settings, and More surfaces.

Each emitting module owns its responsive adjustments. Shared breakpoint constants and media-query mixins may live in a non-emitting `styles/_media.scss` module only if at least three call sites benefit. No module may `@use` another emitting module, preventing duplicated output.

## Cascade rules

- A runtime selector has one canonical owner.
- A selector may repeat only when the second occurrence is inside a different media/feature context or represents a documented state.
- Base selectors remain low-specificity; component classes carry the UI styling.
- No ID selector, `::ng-deep`, `ViewEncapsulation.None`, or selector nesting deeper than necessary is introduced.
- Exact duplicate selector/property/value declarations are forbidden.
- Accidental `!important` declarations are removed. Reduced-motion overrides may retain `!important` because they must defeat transitions and animations globally.
- Source order is semantic, not a mechanism for keeping an obsolete design layer alive.

## Tokens and media queries

The approved CSS custom properties in `_tokens.scss` remain the public visual contract. Old aliases are removed only after their consumers have migrated to the canonical semantic token:

- `--canvas`, `--surface`, `--surface-muted` for surfaces;
- `--teal`, `--teal-deep`, `--ink`, `--muted`, `--overdue` for meaning;
- shared line, focus, radius, spacing, motion, safe-area, and z-index values.

Responsive contracts are consolidated around product boundaries rather than arbitrary one-off numbers:

- narrow phone corrections near 26rem/32.5rem only when content proves they are needed;
- 38.75rem for compact ledger reflow when retained by measured layout;
- 47.5rem/60rem/66.25rem for content layout transitions only where an intermediate layout is real;
- 70rem for the compact-to-desktop shell boundary;
- wide layout adjustments only when the 1,320px content cap requires them.

Equivalent `px` and `rem` breakpoints are not allowed to coexist. Hover-only presentation is grouped under `@media (hover: hover)`. Reduced-motion and print remain explicit global capability contexts.

## Dead-code proof

A selector is deleted only when all of the following agree:

1. static search finds no class, host element, attribute, or state consumer in production TypeScript templates;
2. it is not an Angular-generated active state or a browser pseudo-class;
3. route coverage at phone and desktop widths does not report it as used;
4. its Git history shows it belongs to the superseded pre-Handoff Ledger layer or has no current contract;
5. targeted and full tests remain green after removal.

Candidate legacy groups include the old `topbar`, rail navigation, attention band, glance list, direction links, and old status pill vocabulary. Candidate status does not authorize broad regex deletion.

## Quality budgets

The design-system test becomes an architectural guard with these initial ceilings, tightened after the first safe consolidation:

- `src/styles.scss` contains imports only;
- no forbidden visual pattern from `docs/DESIGN.md`;
- zero legacy selector names that were proven dead;
- zero ID selectors and zero `::ng-deep`;
- no accidental `!important` outside the reduced-motion context;
- no exact duplicate declaration in the same at-rule context;
- repeated selector count substantially below the 110-selector baseline;
- source bytes and production raw/gzip CSS must not exceed the baseline;
- all canonical tokens and accessibility contracts remain present.

The final numbers are recorded in the implementation report so future changes compare against a real baseline rather than an aspirational percentage.

## Accessibility preservation

The refactor preserves:

- visible `:focus-visible` treatment on every interactive control;
- minimum 44px targets where the current interface provides them;
- native control semantics and keyboard paths;
- hover rules gated away from touch-only behavior;
- reduced-motion overrides;
- 320px reflow, safe-area padding, and fixed-navigation scroll clearance;
- print visibility for content using `content-visibility`;
- forced-color-compatible native outlines where custom styling does not replace them.

No color value is changed in this refactor, so the approved contrast contract remains stable.

## Verification strategy

Before source changes, capture:

- full test/lint/typecheck/build results;
- production raw and gzip CSS sizes;
- selector/declaration/duplicate/specificity metrics;
- real-browser screenshots for Home, Records, Add, Detail, People, History, Search, More, and Settings at representative mobile and desktop widths;
- clean-console and horizontal-overflow checks.

After each module extraction, run the targeted design-system test, compile the app, and compare the affected route in the same isolated browser profile. After dead-code removal, repeat every route. Final acceptance requires full automated checks, browser QA, and production bundle comparison.

## Android delivery

After web verification, generate the Capacitor Android debug APK from the verified source. Update installation is allowed only when exactly one authorized physical Android device is detected. Use `adb install -r`; never uninstall the package, clear app data, reset IndexedDB, or alter unrelated applications. Verify package identity, APK signature, hash, launch status, resumed activity, visible preserved data, and filtered crash logs.

## Boundaries

- No HTML hierarchy, TypeScript behavior, i18n catalog, data schema, seed graph, dependency, palette, typography, route, or product-content change.
- No Tailwind, CSS-in-JS, third-party component system, PostCSS plugin, or runtime styling dependency.
- No broad deletion based only on a coverage snapshot.
- No destructive Git command, force push, database reset, app uninstall, or device cleanup.
- Existing generated browser/build artifacts remain outside version control.

## Self-review

The selected design addresses the measured cause rather than optimizing an already-small transfer size in isolation. It preserves cross-component styling where Borrowed deliberately shares primitives, avoids Angular encapsulation duplication, gives every selector one owner, and adds regression budgets so the old appended-layer pattern cannot silently return.
