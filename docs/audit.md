# Repository audit

Present-checkout audit performed on 20 August 2026 before and during Borrowed Part 1.

## Current state

| Area | Verified state |
| --- | --- |
| Framework | Angular 22.1 standalone application, TypeScript 6.0 strict mode, zoneless change detection |
| UI | Responsive mobile-first shell, feature screens, shared UI primitives, English catalog |
| Routing | Angular Router; feature screens are lazy loaded; unknown paths return Home |
| State | Angular signals for view state; no NgRx |
| Persistence | Dexie 4 over IndexedDB, schema v2, migration from v1, local draft table |
| Domain | Person, Loan, Repayment, LoanEvent, settings, mutation queue; UUIDv7; integer money |
| API / backend | None; no network dependency for core behavior |
| Authentication | Local installation identity only; no account or token |
| Tests | Vitest domain, application, fake-IndexedDB persistence, migration and component tests |
| Quality | ESLint 10 + angular-eslint 22 + template accessibility rules + Prettier |
| CI | install, high-severity dependency audit, lint, tests, typecheck, production build, Android debug build |
| PWA | Angular service worker, manifest, 192/512 icons, cached production shell |
| Native | Capacitor 8 Android and iOS projects tracked in the repository |
| Desktop | Electron 43 development wrapper; no packaged release yet |
| Documentation | Product, architecture, model, sync, security, UX, screens, workflows, testing, roadmap and ADRs |

Versions were checked with `pnpm list`, `ng version`, `cap doctor`, and the lockfile. Angular 22 and TypeScript 6.0 are compatible. Capacitor packages are aligned at 8.5.0.

## Problems found

- The manifest existed without a service worker, so “PWA/offline” was not true.
- All feature components were eager imports; the production initial bundle was about 447 kB raw.
- `repay()` loaded the balance before starting the write transaction. Two tabs could validate against the same outstanding balance and both overpay.
- A typed name reused the first case-insensitive match. Two real people named Peter could not remain distinct.
- Settings updates were not queued for future synchronization.
- Add-form data was lost on reload/background termination.
- IndexedDB had no demonstrated migration beyond schema v1.
- Big amounts were formatted through JavaScript `number`, losing precision.
- There were no maximum input lengths and dates could violate `dueOn >= occurredOn` or `repayment.occurredOn >= loan.occurredOn`.
- “Lint” ran only Prettier; Angular/TypeScript/template rules were absent.
- Electron 37 brought 33 dependency advisories (8 high).
- Capacitor was on v7 and no native platform projects existed.
- Existing architecture/navigation/roadmap documents no longer matched the implemented redesign.

## Corrections in this Part

- Added schema v2 with local record drafts and a tested v1→v2 migration.
- Moved return/repayment read-validation-write into one IndexedDB transaction.
- Kept same-name people separate unless the user explicitly chooses an existing person ID.
- Added queued, versioned settings changes and stopped re-enqueuing an unchanged person on loan updates.
- Added portable signed-64-bit money bounds, BigInt-safe formatting, text limits and chronological validation.
- Added lazy routes; current production initial bundle is about 403 kB raw.
- Added the Angular service worker and installable assets.
- Added ESLint/template accessibility linting and CI gates.
- Upgraded Electron to 43.4.1; `pnpm audit --audit-level high` reports no known vulnerabilities.
- Upgraded Capacitor to 8.5.0, added Android/iOS projects, and produced an Android debug APK with JDK 21.

## Good architecture retained

- Pure framework-independent domain functions.
- `BorrowedStore` boundary between use cases and Dexie.
- Integer minor-unit money and append-only repayments.
- Calendar dates distinct from instants.
- Stable client-generated IDs and person-name snapshots.
- Standalone Angular components, signals and a restrained dependency set.
- Existing global UX redesign and reusable icon/list/empty-state primitives.

## Remaining technical debt and risks

- No remote API, account, sync drain, attachment store or reminder scheduler exists. Their contracts are documented, not faked.
- Native data still uses WebView IndexedDB. The repository seam permits a SQLite adapter later; no encryption claim is made.
- The mutation queue is durable but has no compaction, acknowledgement client or conflict UI yet.
- Automated browser E2E is deferred; Part 1 uses component/integration tests plus a real-browser production/offline acceptance pass.
- iOS project generation/sync succeeds, but this machine cannot run an iOS build because full Xcode 26 is not installed.
- Electron is a development wrapper and not a signed/distributable desktop package.

## Migration path

Keep the modular monolith and one Angular codebase. Add later capabilities as vertical slices behind existing boundaries: a sync transport behind the mutation queue, platform services behind small interfaces, and new Dexie migrations rather than destructive database resets. Do not introduce organisations, microservices, a generic asset hierarchy, or a global state library without a demonstrated requirement.
