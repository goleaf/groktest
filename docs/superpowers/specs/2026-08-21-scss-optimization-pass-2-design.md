# Borrowed SCSS optimization pass 2 design

## Status and inherited approval

This is a refinement of the approved `2026-08-21-scss-optimization-design.md`, not a new visual direction. The white/teal Handoff Ledger interface, routes, translations, data, responsive behavior, and Android package remain the contract. The user explicitly requested the maximum further SCSS optimization after the first implementation, so this addendum narrows that request to measured, behavior-preserving work.

## Objective

Remove the remaining provable cascade waste, make pointer capability rules truthful on touch devices, adopt concise logical geometry where browser support is already available, and harden production CSS budgets without introducing a styling dependency or splitting the approved global cascade.

A smaller file is useful only when the source becomes at least as understandable. An optimization is rejected when it saves bytes by hiding ownership, weakening compatibility, increasing specificity, changing pixels, or adding a build-time dependency whose cost exceeds the measured gain.

## Pass-2 measured baseline

The first pass is the new baseline:

- authored SCSS: 2,826 lines and 47,987 bytes;
- expanded CSS: 47,603 bytes, 405 rule blocks, 1,439 declarations, and 483 individual selector entries;
- production CSS: 38,028 bytes raw, 7,512 bytes at gzip level 9, and 6.59 kB Angular estimated transfer;
- 149 stylesheet classes and zero classes without a production TypeScript consumer;
- zero repeated selector/property pairs in the same cascade context;
- zero repeated selector lists in the same cascade context;
- zero compatibility-token consumers;
- one unused declared token: `--z-base`;
- 27 individual hover selector entries, of which 13 are not inside `(hover: hover)`;
- one redundant type-qualified selector: `button.button` alongside `.button`;
- one overwritten declaration: `border-color` before the equivalent `border` shorthand;
- one no-op desktop `.page` override that resolves to the same margins as the base rule;
- symmetric physical inline declarations in shell, ledger, records, and page containers;
- five multi-declaration bodies duplicated within their own module and cascade context;
- baseline Lighthouse trace on the local development server: LCP 712 ms and CLS 0.00; render-blocking CSS estimated savings 0 ms.

The CSS payload is not a user-visible bottleneck. Pass 2 therefore optimizes correctness, determinism, authored clarity, and guarded transfer size rather than pretending that a sub-kilobyte reduction will improve LCP.

## Considered approaches

### A. Add a stronger post-processor

Running the current production artifact through the already-installed Lightning CSS library reduces raw CSS from 38,028 to 37,806 bytes but changes gzip from 7,512 to 7,511 bytes: one byte. Adding or configuring another production transform for one gzip byte is rejected.

### B. Split global CSS into route/component chunks

Angular component styles could defer supporting-route CSS, but would rewrite selectors for emulated encapsulation and duplicate shared primitives. The global payload is only 7.5 kB gzip, the UI deliberately styles child-component markup through shared contracts, and browser evidence shows no CSS loading bottleneck. The risk and ownership cost exceed the possible gain, so this remains rejected.

### C. Centralize every responsive rule by breakpoint

One responsive file could merge repeated media headers, but would split selector ownership between base modules and a remote override layer. It would reintroduce the cascade-order problem removed in pass 1. This is rejected.

### D. Targeted semantic consolidation

Keep the eight-module architecture. Add analyzable constraints for hover capability, unused tokens, redundant selectors/declarations, no-op responsive overrides, logical inline geometry, and identical multi-declaration bodies inside one module. Apply each cleanup in small RED/GREEN slices and retain only changes that pass pixel and production-size comparison. This is selected.

## Selected changes

### Capability-gated hover behavior

Every selector containing `:hover` must live inside a `(hover: hover)` media context. Rules that currently combine `:hover` with a persistent state are split:

- `.mobile-nav a.active` stays outside the capability query;
- `.chips button.on` stays outside the capability query;
- active/pressed transforms stay outside hover-only contexts;
- only presentation reachable through a hover-capable pointer moves into the media block.

This avoids sticky hover presentation on touch while preserving mouse behavior. Modules may each own one `(hover: hover)` block; they do not import an emitting shared hover layer.

### Token and declaration hygiene

- Remove `--z-base` after the architecture test proves it has no `var()` consumer.
- Remove `button.button` because `.button` selects the same nodes with sufficient specificity.
- Remove the `border-color` declaration overwritten by `border: 1px solid var(--teal)` in the same rule.
- Remove `border-color` from `.header-add` and its hover state because the anchor has no border width/style and the declaration has no rendered effect.
- Remove the desktop `.page` override because the later base rule produces the same four margin sides.
- Remove explicit left/right margins that repeat `margin: 0 auto` in the same rule.

### Logical inline geometry

Symmetric left/right pairs become logical properties when they express inline geometry:

- `padding-right` plus `padding-left` becomes `padding-inline`;
- `margin-right` plus `margin-left` becomes `margin-inline`;
- simple centered block containers use `margin: 0 auto` where no independent block margin exists.

Directional arrow geometry such as `margin-left: -4px` remains physical because it encodes the current LTR arrow composition. No automatic global replacement is allowed.

### Same-module declaration coalescing

Rules with two or more identical declarations in the same module and at-rule context are merged only when the existing selector/property audit proves there is no conflicting declaration whose cascade order could change.

Expected candidates are:

- Home truncation rules shared by due and people rails;
- Home metadata typography shared by due and people rails;
- Add preview and detail action rail alignment/padding;
- supporting-screen margin resets when their one-property grouping remains readable.

Cross-module grouping is rejected even when bodies match because it would make ownership less clear for negligible bytes.

### Production budget

Angular receives a named `styles` bundle budget. The warning/error thresholds are set just above the verified pass-2 output so ordinary metadata variation does not fail builds while meaningful CSS regression does. The static test verifies the budget exists and cannot silently drift upward.

The source budget is tightened only after final verified metrics are known. It must remain a ceiling, not a target that encourages unreadable compression.

## Test architecture

`styles-architecture.spec.ts` gains source-level parsers that report actionable selector/file names. New tests cover:

1. every hover selector is capability-gated;
2. every declared custom property has a `var()` consumer, except an explicit documented public-token allowlist (initially empty);
3. no selector list contains both `.class` and a redundant `element.class` form;
4. no declaration is overwritten by a later equivalent shorthand in the same rule;
5. no media rule is a complete no-op against the final base declarations for the same selector;
6. no symmetric physical inline pair remains where a logical property is equivalent;
7. no identical body with at least two declarations appears twice in one module/context;
8. the production `styles` bundle budget remains configured.

Each new contract is introduced RED, observed failing for the measured reason, then made GREEN by the smallest source change.

## Verification

Automated acceptance requires:

- targeted architecture tests after each slice;
- full `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` after the final source change;
- fresh authored, expanded, production raw, and gzip measurements;
- no increase in rule/declaration counts unless a capability wrapper requires it and the raw/gzip result still improves;
- exact screenshot comparison for Home, Records, Add, and Settings at mobile and desktop baselines;
- explicit checks at 390, 900, 1119, 1120, and 1440 CSS pixels;
- hover comparison on a hover-capable viewport and confirmation that touch emulation does not apply hover-only styles;
- clean console/network, one main landmark, visible focus, and Lighthouse accessibility/best-practices results;
- an after trace compared with LCP 712 ms and CLS 0.00, reported honestly as synthetic development evidence.

## Android delivery

After web verification, rebuild development web assets for the existing local-data demo, synchronize Capacitor, build with the installed JDK 21, inspect APK metadata/signature/hash, and update only when ADB reports exactly one authorized physical non-emulator device. Installation uses `install -r`; uninstall and data clearing remain prohibited.

## Stop conditions

The pass stops when every remaining candidate is one of:

- required for a rendered or accessibility state;
- intentionally repeated across different modules for ownership clarity;
- smaller only after gzip by less than measurement noise while adding complexity;
- dependent on unsupported or insufficiently verified browser behavior;
- a component-splitting or post-processing change with no measured runtime benefit.

“Maximum” means exhausting evidence-backed opportunities, not making the stylesheet cryptic.

## Self-review

This addendum has no product, content, data, route, color, or typography change. It preserves the approved module boundary, identifies every measured pass-2 target, states rejected alternatives with numbers, defines RED/GREEN guards before source edits, and keeps browser plus physical-device proof as completion requirements. It contains no placeholders or unresolved design choice.
