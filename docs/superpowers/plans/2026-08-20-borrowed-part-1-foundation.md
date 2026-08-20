# Borrowed Part 1 foundation implementation plan

1. Capture present branch/status, repository tree, framework/dependencies, entry points, docs, CI, PWA/native setup and baseline test/lint/type/build/audit evidence.
2. Reconcile the 132 product requirements into implemented/deferred/not-applicable coverage and define the approved architecture/UX/data/security boundaries.
3. Add failing domain tests for bounded money/text/quantity, BigInt-safe formatting and chronological dates; implement the smallest rules that pass.
4. Add failing persistence tests for same-name people, concurrent repayments, queued settings, drafts and v1→v2 migration; implement transactional store and schema v2.
5. Add failing Add-screen test for draft restore/clear; implement debounced draft persistence and localized/bounded form inputs.
6. Add failing route/PWA configuration tests; lazy-load feature screens, add recovery route, Angular service worker and install assets.
7. Remediate dependency audit, align Capacitor 8, track/sync native projects and compile Android with the required JDK/API.
8. Configure angular-eslint/template accessibility and Prettier as one lint gate; expand CI with audit/lint and Android build.
9. Update all source-of-truth docs and add ADRs for transactions/drafts, PWA/native delivery and sync concurrency.
10. Run full audit, lint, tests, typecheck, production build, Capacitor sync, Android build, diff checks and isolated real-browser responsive/offline/accessibility acceptance.
11. Perform adversarial self-review against simplicity, privacy, money/history correctness, local-only use, account independence and documentation truthfulness; correct findings before reporting.
