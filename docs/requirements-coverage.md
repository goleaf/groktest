# Part 1 requirements coverage

Status: **Implemented** means present and verified in this Part; **Designed/deferred** means intentionally absent from Part 1 with a concrete boundary in architecture/roadmap; **Policy** means the prohibition/principle is enforced by current design. Nothing below is silently omitted.

|   # | Status                           | Evidence / disposition                                                                                                                                |
| --: | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Implemented                      | Product/package/UI name is Borrowed.                                                                                                                  |
|   2 | Policy                           | Product/UX docs and minimal capture flow reject accounting/CRM concepts.                                                                              |
|   3 | Implemented                      | Item/money in both directions, return and partial repayment flows/tests.                                                                              |
|   4 | Implemented                      | Person, Asset kind, Loan and LoanEvent terminology in product/domain docs.                                                                            |
|   5 | Implemented                      | Home, Records (Lent/Borrowed scopes), Add, Detail, People, History, Search, Settings; reminders deferred.                                             |
|   6 | Implemented                      | Action sentences, counts, currency-grouped totals, overdue/due-soon; no analytics dashboard.                                                          |
|   7 | Implemented                      | Fast direction→kind→person→item/amount form; optional fields disclosed.                                                                               |
|   8 | Implemented                      | Angular 22 PWA plus tracked Capacitor 8 Android/iOS projects; iOS compile needs external Xcode 26.                                                    |
|   9 | Policy                           | No organisation/workspace/seat/tenant model.                                                                                                          |
|  10 | Implemented                      | Core read/create/search/return/repay are IndexedDB-only and offline; PWA shell cached.                                                                |
|  11 | Policy                           | No public profiles/feed/directory or cross-user API.                                                                                                  |
|  12 | Implemented + deferred           | Local-only installation works; account identity/sync mode is separately designed.                                                                     |
|  13 | Implemented + designed           | Local privacy controls documented; future transport/auth/deletion/export boundaries specified.                                                        |
|  14 | Implemented                      | Client-generated UUIDv7 for domain/mutation IDs.                                                                                                      |
|  15 | Implemented                      | UTC instants and separate calendar occurred/due/returned dates; timezone-derived today.                                                               |
|  16 | Implemented                      | BigInt minor units, currency codes, repayment history, per-currency totals, no FX.                                                                    |
|  17 | Implemented                      | Item name/description/quantity domain, quantity default 1; no SKU/inventory burden.                                                                   |
|  18 | Implemented                      | Name-only Person is sufficient; optional contact fields exist but are not required/collected.                                                         |
|  19 | Designed/deferred                | No contacts permission; future contextual adapter in roadmap.                                                                                         |
|  20 | Implemented                      | Stored active/completed/cancelled/archived vocabulary; overdue/due-soon derived.                                                                      |
|  21 | Implemented                      | Complete physical return and first-class append-oriented money repayments.                                                                            |
|  22 | Implemented                      | Semantic LoanEvent activity for create/return/repayment; no technical event noise.                                                                    |
|  23 | Implemented                      | Local search over person/item/note/currency/amount with active/history results.                                                                       |
|  24 | Implemented                      | Direction, item, money, overdue and due-soon mobile filters.                                                                                          |
|  25 | Implemented + deferred           | Urgency/newness defaults exist; optional user sort selector is later UX.                                                                              |
|  26 | Designed/deferred                | Reminder is a separate future entity/schedule from due date.                                                                                          |
|  27 | Designed/deferred                | No permission prompt; contextual opt-in policy documented.                                                                                            |
|  28 | Designed/deferred                | Independent attachment metadata/blob/upload lifecycle defined; not implemented.                                                                       |
|  29 | Implemented                      | Settings downloads JSON export with stringified money values.                                                                                         |
|  30 | Designed/deferred                | Loan/Person/account/device deletion distinctions and snapshots/tombstones documented; no destructive UI yet.                                          |
|  31 | Implemented                      | Central English translation catalog/interpolation foundation; dates/currency use locale; more catalogs deferred.                                      |
|  32 | Implemented                      | Semantic landmarks/labels, keyboard focus, 44px targets, word+icon state, a11y lint.                                                                  |
|  33 | Implemented                      | Mobile bottom nav, safe areas, no hover dependency/modal stack/fixed-height form.                                                                     |
|  34 | Implemented                      | Desktop rail and wider composition reuse identical routes/flows.                                                                                      |
|  35 | Implemented                      | Local-first reads, lazy routes, optimized production bundle; no premature database tuning claim.                                                      |
|  36 | Implemented + deferred           | IndexedDB/Dexie structured store with migrations/transactions/indexes; native SQLite adapter is evidence-driven future work.                          |
|  37 | Designed/deferred                | Durable v0 queue plus documented idempotency, versions, tombstones, retries, cursors and conflicts; no transport.                                     |
|  38 | Designed/deferred                | Future `/api/v1` DTO/error/auth/rate/idempotency contract; no ORM leak because no API exists.                                                         |
|  39 | Policy                           | Current backend is absent; future responsibilities are limited to sync/backup/devices/files/notifications.                                            |
|  40 | Implemented                      | Pure focused domain modules own money/lifecycle/urgency; UI has no balance rules.                                                                     |
|  41 | Implemented                      | Feature-oriented frontend folders plus narrowly shared UI/i18n/data/domain.                                                                           |
|  42 | Implemented                      | Angular signals; no unjustified NgRx.                                                                                                                 |
|  43 | Implemented                      | Strict TS/templates, no `any` in application types, explicit unions and typed boundaries.                                                             |
|  44 | Implemented                      | Normalized core rows, indexes/constraints in domain, no core JSON blob/derived balance column.                                                        |
|  45 | Implemented                      | User/Device/Person/Loan/Asset/Repayment/Reminder/Attachment/Activity/Mutation analyzed in data model.                                                 |
|  46 | Implemented                      | Same-name people stay separate; explicit existing ID reuse; merge deferred.                                                                           |
|  47 | Implemented                      | Positive/bounded money, supported currency, item/quantity/text/date and over-repayment validation.                                                    |
|  48 | Implemented + designed           | Typed validation and generic local errors; future auth/network/sync/file categories documented.                                                       |
|  49 | Implemented                      | Local button/form busy states; no global blocking spinner or remote wait.                                                                             |
|  50 | Implemented                      | Home/Records/Lent/Borrowed/History/People/Search empty states with one useful action.                                                                 |
|  51 | Implemented                      | First launch is a concise Home empty state and Add action; no wizard.                                                                                 |
|  52 | Implemented + designed           | Secure local baseline and detailed future server checklist/threat model.                                                                              |
|  53 | Policy                           | No private-content application logs; future sanitized logging contract.                                                                               |
|  54 | Policy                           | No analytics dependency; content-free optional future policy.                                                                                         |
|  55 | Policy                           | No feature-flag platform before a real experiment.                                                                                                    |
|  56 | Implemented                      | Unit, integration, component and real-browser acceptance layers defined and run.                                                                      |
|  57 | Implemented                      | Deterministic clocks and meaningful drill/ladder/money/history fixtures.                                                                              |
|  58 | Implemented                      | Dexie v1→v2 reversible-forward strategy/test; native projects versioned.                                                                              |
|  59 | Implemented                      | App, schema, sync protocol, API and native version concepts separated.                                                                                |
|  60 | Designed/deferred                | Future API/protocol compatibility window and version negotiation documented.                                                                          |
|  61 | Implemented                      | Focused functions/components, lint/types/format, no duplicate financial rule.                                                                         |
|  62 | Implemented                      | README and product/architecture/data/sync/security/UX/testing/mobile docs updated to current code.                                                    |
|  63 | Implemented                      | ADRs 0001–0010 include context, decision, alternatives and consequences.                                                                              |
|  64 | Implemented                      | Present repository/dependency/entry/persistence/security/test/CI/native audit completed first.                                                        |
|  65 | Implemented                      | `docs/audit.md` records current state, problems, retained strengths, corrections and migration path.                                                  |
|  66 | Implemented                      | `docs/product.md` is engineering product source of truth.                                                                                             |
|  67 | Implemented                      | `docs/architecture.md` covers all requested layers and Mermaid flow.                                                                                  |
|  68 | Implemented                      | `docs/data-model.md` explains entity responsibility, fields, constraints, indexes, deletion and sync behavior.                                        |
|  69 | Implemented                      | `docs/sync.md` defines IDs, queue, ack, conflicts, deletion, retries, devices and recovery.                                                           |
|  70 | Implemented                      | `docs/security.md` includes threat model, storage, auth, authorization, files, logs, secrets, loss/recovery.                                          |
|  71 | Implemented                      | `docs/ux-principles.md` codifies simplicity, permissions, mobile, a11y, status and drafts.                                                            |
|  72 | Implemented                      | Final responsive navigation choice/reasoning in `docs/navigation.md`.                                                                                 |
|  73 | Implemented                      | Screen/inlining/full-screen inventory in `docs/screens.md`.                                                                                           |
|  74 | Implemented                      | Exact item/money/draft/derived workflow transitions in `docs/workflows.md`.                                                                           |
|  75 | Implemented                      | Outstanding is original minus valid repayments; tested and never editable.                                                                            |
|  76 | Implemented                      | Full money repayment/physical return completion rules; archive distinct.                                                                              |
|  77 | Implemented                      | Active + past local calendar due date rule and boundary tests.                                                                                        |
|  78 | Implemented                      | Central three-day due-soon constant, not duplicated.                                                                                                  |
|  79 | Implemented                      | Shared Loan row presents person, item/amount, words/icons for direction/status/due/remaining.                                                         |
|  80 | Implemented                      | Lent/Borrowed differentiate with label/icon in addition to color.                                                                                     |
|  81 | Implemented                      | Person view shows active/history and currency-separated owed-to-me/I-owe summaries.                                                                   |
|  82 | Implemented                      | Completed records remain local, searchable and visible in History/details.                                                                            |
|  83 | Designed/deferred                | Stored archive vocabulary; archive UI later, never used as completion.                                                                                |
|  84 | Designed/deferred                | No delete UI exists; future irreversible delete requires confirm/undo design.                                                                         |
|  85 | Implemented                      | Local write-first interactions update revision immediately and queue future sync.                                                                     |
|  86 | Designed/deferred                | Capacitor projects exist; future native capabilities must use platform interfaces/fallbacks.                                                          |
|  87 | Designed/deferred                | Biometric app lock explicitly separate from auth/encryption.                                                                                          |
|  88 | Implemented + deferred           | JSON export exists; remote backup/restore remains distinct future work.                                                                               |
|  89 | Designed/deferred                | Future Device identity/list/revoke/last-sync model documented.                                                                                        |
|  90 | Implemented + deferred           | Current copy is “On this device”; future simple sync states documented.                                                                               |
|  91 | Designed/deferred                | Automatic/manual conflict rules and user language defined; no sync UI without transport.                                                              |
|  92 | Designed/deferred                | Attachment failure independence/retry is an explicit future invariant.                                                                                |
|  93 | Implemented                      | IndexedDB plaintext and secure-token limitations are accurately documented.                                                                           |
|  94 | Implemented                      | Schema v2 migration and future adapter migration cost/rules documented/tested.                                                                        |
|  95 | Designed/deferred                | Exportable normalized model; import awaits validation/preview/rollback.                                                                               |
|  96 | Designed/deferred                | Person and registered User remain distinct, preserving future sharing.                                                                                |
|  97 | Designed/deferred                | Invitation/confirmation deliberately outside core.                                                                                                    |
|  98 | Designed/deferred                | No premature QR abstraction.                                                                                                                          |
|  99 | Designed/deferred                | No predictive behavior; possible later only with evidence/privacy review.                                                                             |
| 100 | Policy                           | No AI dependency, assistant or generated summary.                                                                                                     |
| 101 | Policy                           | No blockchain/crypto identity/smart contract.                                                                                                         |
| 102 | Policy                           | Local modular monolith/one frontend; no microservices.                                                                                                |
| 103 | Policy                           | No WebSocket/realtime infrastructure.                                                                                                                 |
| 104 | Policy                           | No backend worker system; local mutation table is durable state, not fashionable infrastructure.                                                      |
| 105 | Implemented                      | Dependency need/maintenance/security assessed; high/critical lockfile audit gate is clean; one moderate Capacitor CLI transitive advisory documented. |
| 106 | Implemented                      | Electron and Capacitor updated in isolated groups with tests/audit; TS kept compatible with Angular.                                                  |
| 107 | Implemented                      | ESLint/Angular template lint, Prettier and import/type checks configured.                                                                             |
| 108 | Implemented                      | CI install/audit/lint/test/type/build plus Android build, no secrets.                                                                                 |
| 109 | Implemented                      | No secrets/runtime env requirement; config is code-safe and no `env` leak.                                                                            |
| 110 | Implemented                      | README documents install, web, checks, PWA/native/mobile/persistence architecture.                                                                    |
| 111 | Policy                           | No empty placeholder services/directories; each abstraction has current responsibility.                                                               |
| 112 | Policy                           | Deferrals are in roadmap/docs, not broad code TODOs.                                                                                                  |
| 113 | Policy                           | Superseded eager routes/unsafe paths removed; version control holds history.                                                                          |
| 114 | Implemented                      | Core create slices include UI, validation, domain, persistence, errors, offline, tests, i18n and docs.                                                |
| 115 | Implemented                      | Template a11y lint, component assertions and real-browser keyboard/accessibility acceptance.                                                          |
| 116 | Implemented                      | Browser acceptance targets 320/375/390/tablet/desktop widths and no ordinary horizontal scroll.                                                       |
| 117 | Implemented                      | CSS uses safe-area insets for bottom navigation/content.                                                                                              |
| 118 | Implemented                      | Scrollable document form, reachable submit, no fixed viewport-height dependency.                                                                      |
| 119 | Implemented                      | Debounced device-local Add draft survives reload/process interruption.                                                                                |
| 120 | Implemented                      | Draft and committed Loan are separate; draft never becomes active automatically.                                                                      |
| 121 | Implemented                      | Today, quantity 1, preferred currency and empty due date defaults.                                                                                    |
| 122 | Implemented                      | Preferred currency stored separately; existing Loan currency immutable.                                                                               |
| 123 | Implemented                      | Recent people shown/selectable before typing.                                                                                                         |
| 124 | Designed/deferred                | Item suggestions await usage evidence; no inventory introduced.                                                                                       |
| 125 | Designed/deferred                | Similar records are not blocked; optional warning may be added later.                                                                                 |
| 126 | Implemented                      | Audit→docs/model→tests→foundation→verification sequence followed and recorded.                                                                        |
| 127 | Implemented                      | Strict structure/domain/ID/store/schema/repositories/services/tests/i18n/shell/nav/empty-state foundation present.                                    |
| 128 | Implemented                      | Required physical/money/validation/repayment/outstanding/overpay/completion/overdue/date/ID/store/migration tests.                                    |
| 129 | Implemented                      | Offline create/reload, completion, repayment, queue, draft and migration integration tests.                                                           |
| 130 | Implemented with external caveat | Audit/docs/foundation/tests/lint/types/PWA/web/Android pass; iOS build requires unavailable full Xcode 26 and is explicitly recorded.                 |
| 131 | Implemented                      | Final review checks simplicity, account independence, money/history, privacy, abstraction and doc truth.                                              |
| 132 | Implemented                      | Work was performed without approval pauses; deferrals are explicit and scoped to later Parts.                                                         |
