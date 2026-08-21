# Testing

## Automated layers

| Layer                   | Coverage                                                                                                                                                                                                                                                                    | Tool                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Domain                  | UUIDv7, money parsing/format/bounds, calendar-day distance, create, return, repay, due-date change, person relationship summaries, completion, urgency and query rules                                                                                                      | Vitest pure tests                 |
| Persistence/application | offline create/reload, indexed active/completed reads, bounded visible-loan repayment reads, return/history, repayment, deadline change/event/queue, overpay prevention, stable person reuse, indexed person overview, settings, drafts and v1→v3 migration                 | Dexie + fake-indexeddb            |
| Component               | shell/navigation, URL-restored record filters, stale async response rejection, local-midnight/focus refresh, Signal Form validation, Add draft/person matching, shared due status, lists, Home, People/person details, deadline form, settings, icons and accessible labels | Angular TestBed/Vitest            |
| Localization            | catalog parity, interpolation parameters, EN/RU/LT plural rules, fallback, persistence and HTML language                                                                                                                                                                    | Vitest + Angular TestBed          |
| Static quality          | TypeScript strict build, Angular template compiler, ESLint, angular-eslint a11y rules, Prettier, SCSS ownership, cascade uniqueness, live tokens, hover capability, logical inline geometry, no-op media and source/bundle budgets                                          | CLI/CI + Vitest                   |
| Delivery                | Production PWA artifact and Android debug APK                                                                                                                                                                                                                               | Angular builder, Capacitor/Gradle |
| Browser acceptance      | critical flows, responsive widths, offline reload, clean console, accessibility tree                                                                                                                                                                                        | isolated Chrome DevTools profile  |

Deterministic clocks and named fixtures cover one person with simultaneous lent/borrowed relationships, active lent drill, borrowed ladder, partial money repayment, completed item, due-tomorrow, due-in-three-days and exact overdue duration. Tests do not depend on network or production data.

## Required local commands

```sh
pnpm audit --audit-level high
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm exec cap sync
```

`pnpm typecheck` runs the Angular development build with `strictTemplates` and
`strictStandalone` inherited from `tsconfig.json`. It therefore checks application template
bindings and rejects non-standalone declarations as part of the normal local and CI gate.

Android (JDK 21 and API 36):

```sh
cd android
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./gradlew assembleDebug
```

CI performs all web gates and a separate Java 21 Android build. Full iOS compilation additionally requires Xcode 26+.

## Browser acceptance matrix

- 320×568, 375×812, 390×844: no ordinary horizontal scroll; bottom navigation respects safe area; form controls and submit remain reachable.
- Tablet at 900×800: compact header and bottom navigation, zero overlap and no mobile-only hover dependency.
- Desktop from 70rem, including 1440×1000: horizontal header, ledger/context columns, landmarks and readable line length.
- Keyboard: skip link, logical focus order, visible focus, form labels and actionable buttons.
- Production PWA: load online once, verify active service worker, create a record, switch offline, reload, find the same record, perform another local action.
- Console: zero application errors/warnings. Network failures expected only after explicit offline simulation and must not break core behavior.
- Icon system: every top-level utility page has a semantic heading icon; filters, selectors, empty states, statuses and recovery actions retain visible text and use the shared SVG component.
- Android: build with command-scoped JDK 21, verify package/signature/SHA-256, install with `adb install -r`, cold-launch, inspect crash logs, and confirm the existing IndexedDB record count remains intact.

## Stylesheet acceptance

- Run `src/app/styles-architecture.spec.ts` through the Angular test builder; it verifies the ordered import-only entrypoint, live tokens, unique selector/property ownership, capability-gated hover, logical symmetric geometry, no-op media removal, same-module body coalescing, and source/bundle budgets.
- Compile production CSS before and after a styling change and compare raw and gzip bytes. A source-line reduction alone is not a runtime performance claim.
- Require authored SCSS at or below 47,900 bytes and the production `styles` bundle below its 38.5 kB warning / 39 kB error budget.
- Cover Home, Records, Add, Detail, People, Person, History, Search, More, and Settings at 390×844 and 1440×1000 in the same isolated browser context.
- Compare like-for-like full-page screenshots. Investigate every non-zero difference; subpixel-only differences still require an SSIM measurement and visual diff inspection.
- Recheck 900×800 and both sides of the 70rem shell boundary after responsive or navigation work.
- Keep browser screenshots, expanded CSS, compressed CSS, traces, and coverage output in a temporary directory outside the repository.

## Deferred automation

A checked-in cross-browser Playwright suite is the next delivery slice once stable CI browser images are selected. Until then, browser acceptance is recorded as run evidence, not misrepresented as automated coverage. Native emulator/device interaction tests, notification permission tests and sync contract tests start with those features.
