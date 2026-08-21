# Borrowed usability and code hardening

## Objective

Turn the approved Handoff Ledger redesign into a durable implementation that remains clear at phone, tablet, and desktop widths, stays responsive with a growing local database, and uses Angular 22 reactive primitives without stale asynchronous state.

This pass preserves the product model, the existing 100-loan demo graph, EN/RU/LT localization, Dexie schema v3 data, current routes, Capacitor package ID, white/teal/rust identity, and all installed user data.

## Accepted direction

The user approved the audit recommendations on 2026-08-21 and requested implementation followed by an APK update on the connected Android phone. The selected approach is an incremental hardening pass rather than another visual reinvention.

Three implementation approaches were considered:

1. **Cosmetic patch only.** Move the desktop breakpoint and adjust a few spacings. Fast, but it leaves stale async state, non-restorable filters, unbounded record rendering, and the duplicated Home hierarchy.
2. **Full rewrite.** Replace the shell, forms, store, and styling at once. It could produce a clean tree, but it creates excessive regression and data-migration risk for an already functional local-first app.
3. **Incremental hardening.** Fix the measured tablet defect, establish URL and query boundaries, replace vulnerable async effects, simplify Home, migrate forms, then consolidate styles while preserving the existing visual identity.

Incremental hardening is selected. It offers the best risk-to-value ratio and leaves every intermediate state testable.

## Responsive shell

The existing desktop header is valid at wide widths but begins at 880px, where measured controls overlap. The shell will use three responsive states:

- **Phone and tablet below 70rem / 1120px:** compact brand header plus the five-item bottom navigation. Language and Add remain in the header. This is already a coherent workflow and avoids inventing a tablet-only navigation model.
- **Desktop from 70rem / 1120px:** horizontal Home, Records, People, History navigation; Search, Settings, languages, and labeled Add action.
- **Wide desktop:** the same desktop navigation with the existing 1320px content cap.

At 320, 390, 900, 1120, and 1440px there must be no overlap or horizontal page scrolling. The focused element must remain visible above the fixed bottom navigation.

## Record-list state and scale

`/records`, `/lent`, and `/borrowed` use URL query parameters as the source of truth:

- `scope=all|lent|borrowed`, omitted when it matches the route default;
- `filter=items|money|overdue|due_soon`, omitted for `all`;
- `q=<normalized text>`, omitted when empty.

Invalid parameters fall back safely and are removed on the next user change. Browser Back/Forward restores the exact visible list. Direct links remain useful after a reload.

The list still uses the current local full-text predicate because IndexedDB has no built-in full-text index, but active/history reads use existing `status` and `direction` indexes instead of loading every Loan first. Repayments for visible money rows use the existing batched `loanId` query. Long rows use `content-visibility: auto` with an intrinsic fallback size so off-screen rendering is skipped without adding a dependency.

Filter controls remain native pressed buttons. On phones they become a horizontally scrollable, single-line rail with reachable 44px targets. The result count is a stable polite status region.

## Async data flow

Page data currently loaded by Promise chains inside `effect()` is replaced with Angular `resource()` where request parameters are reactive:

- List resource parameters: revision, scope, and locale.
- Home resource parameters: revision, current day, and locale.
- Detail resource parameters: reactive route ID and revision.

Each loader returns one complete page payload. A stale load cannot write a second signal after a newer load has won. Route transitions between two `/loans/:id` values update the existing component correctly.

Domain mutations remain imperative and transactional through `BorrowedApp`. Successful mutations update the application revision and therefore reload the affected resource. Expected storage errors become translated, actionable page errors; they do not erase form state.

## Home information hierarchy

Home retains the connected four-part summary ribbon and the signature handoff rows. Its two content columns no longer repeat the same overdue records:

- **Needs attention:** at most five active records, ordered overdue, due soon, then other open records.
- **Due next:** at most four non-overdue records with a future/today deadline, ordered by date.
- **People:** at most five people with open handoffs.

Rust remains exclusive to explicit overdue text and the restrained overdue row marker. Upcoming records use teal/neutral treatment. On mobile the shorter primary list and non-duplicated context make the first useful actions arrive sooner.

## Signal Forms

The Add, due-date-change, and repayment forms move from `FormsModule`/`ngModel` to Angular 22 Signal Forms.

The Add form owns one typed model with non-nullable values for direction, kind, person, item, amount, currency, due date, and note. Field visibility and required rules depend on asset kind. The live preview and draft persistence derive from the same model signal, removing eleven independently synchronized fields.

Submission uses `submit()` so invalid fields are marked touched and the first invalid bound control can receive focus. Domain validation remains authoritative for currency precision, date rules, repayment limits, and transactional state changes. Signal Forms provide early field guidance; they do not duplicate financial domain logic.

Detail uses separate small typed models for due date and repayment amount. Mutation busy state and domain errors remain page signals because they are operation state, not form values.

## Styling architecture

The visual language remains the approved cool hue-188 ledger. No new palette, typography dependency, gradient, glass, cream, serif, or decorative animation is introduced.

The current second redesign layer is separated into focused partials for tokens, shell/responsiveness, ledger surfaces, and record workspaces. Superseded selectors are removed only when source search and browser coverage show no consumer. `src/styles.scss` remains the single Angular entrypoint and imports the partials in deterministic cascade order.

The handoff line remains the single signature element. Density, typography, and status hierarchy are refined around it rather than adding more cards or badges.

## Accessibility

- Native links, buttons, labels, inputs, lists, landmarks, and disclosures remain primary.
- Every target is at least 44px; filter rails remain keyboard reachable.
- One visible `h1` and one `main` per route.
- Focus uses `:focus-visible`; text inputs receive an equivalent focus ring after removing native outline.
- Result counts use a stable `role="status"` region.
- Field errors are associated with controls and errors explain the next action.
- Reduced motion remains enforced.
- 200% zoom and 320px reflow remain valid.

## Persistence and APK update

No table or entity migration is required. Existing schema v3 indexes are reused. The Android update is installed with `adb install -r`, preserving the historical `borrowed` IndexedDB name and the current 100 demo loans.

The APK is produced from development web assets because demo seeding is deliberately development-only; `seedDemoIfEmpty` still returns immediately when loans exist. Gradle uses command-scoped JDK 21. The global Java configuration is not changed.

Installation proceeds only when exactly one authorized physical Android device is present and it matches the selected Samsung serial. The APK package, minSdk, signature, SHA-256, launch result, resumed Activity, visible record counts, and crash log are verified.

## Verification contract

- Targeted red/green tests for every behavior change.
- Full `pnpm test`, `pnpm lint`, `pnpm typecheck`, production `pnpm build`, and `git diff --check`.
- Real-browser Home, Records, Add, and Detail checks at 390x844, 900x800, and 1440x1000.
- Browser Back/Forward restoration for Records filters.
- Rapid scope and same-route detail navigation regression tests.
- Lighthouse accessibility/best-practices audit and clean console.
- Android build, signature/package inspection, update install, cold launch, resumed Activity, visible preserved data, and filtered crash log.

## Boundaries

- No backend, account, sync transport, contacts, photos, notifications, new dependency, or schema migration.
- No destructive database reset or demo reseed on an installation containing Loans.
- No commit, push, or unrelated worktree cleanup without an explicit user request.
- Existing dirty redesign work remains in place and is extended rather than reverted.

## Self-review

The design contains no placeholder or ambiguous breakpoint. URL defaults, async parameters, form responsibilities, query boundaries, data preservation, accessibility checks, and physical-device acceptance criteria are explicit. Every change directly addresses a measured defect or an approved audit recommendation.
