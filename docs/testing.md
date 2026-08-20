# Testing

## Automated layers

| Layer                   | Coverage                                                                                                                                                                               | Tool                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Domain                  | UUIDv7, money parsing/format/bounds, calendar-day distance, create, return, repay, due-date change, person relationship summaries, completion, urgency and query rules                 | Vitest pure tests                 |
| Persistence/application | offline create/reload, return/history, repayment, deadline change/event/queue, overpay prevention, stable person reuse, indexed person overview, settings, drafts and v1→v3 migration  | Dexie + fake-indexeddb            |
| Component               | shell/navigation, local-midnight/focus refresh, Add draft/person matching, shared due status, lists, Home, People/person details, deadline form, settings, icons and accessible labels | Angular TestBed/Vitest            |
| Localization            | catalog parity, interpolation parameters, EN/RU/LT plural rules, fallback, persistence and HTML language                                                                               | Vitest + Angular TestBed          |
| Static quality          | TypeScript strict build, Angular template compiler, ESLint, angular-eslint a11y rules, Prettier                                                                                        | CLI/CI                            |
| Delivery                | Production PWA artifact and Android debug APK                                                                                                                                          | Angular builder, Capacitor/Gradle |
| Browser acceptance      | critical flows, responsive widths, offline reload, clean console, accessibility tree                                                                                                   | isolated Chrome DevTools profile  |

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

Android (JDK 21 and API 36):

```sh
cd android
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./gradlew assembleDebug
```

CI performs all web gates and a separate Java 21 Android build. Full iOS compilation additionally requires Xcode 26+.

## Browser acceptance matrix

- 320×568, 375×812, 390×844: no ordinary horizontal scroll; bottom navigation respects safe area; form controls and submit remain reachable.
- Tablet around 768×1024: usable layout with no mobile-only hover dependency.
- Desktop around 1440×900: rail, landmarks, readable line length and wider layout.
- Keyboard: skip link, logical focus order, visible focus, form labels and actionable buttons.
- Production PWA: load online once, verify active service worker, create a record, switch offline, reload, find the same record, perform another local action.
- Console: zero application errors/warnings. Network failures expected only after explicit offline simulation and must not break core behavior.
- Icon system: every top-level utility page has a semantic heading icon; filters, selectors, empty states, statuses and recovery actions retain visible text and use the shared SVG component.

## Deferred automation

A checked-in cross-browser Playwright suite is the next delivery slice once stable CI browser images are selected. Until then, browser acceptance is recorded as run evidence, not misrepresented as automated coverage. Native emulator/device interaction tests, notification permission tests and sync contract tests start with those features.
