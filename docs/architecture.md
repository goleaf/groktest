# Architecture

Borrowed is a local-first personal application with one Angular frontend. Web/PWA, Android, iOS and desktop reuse the same domain and UI. There is no application server in Part 1.

```mermaid
flowchart LR
  subgraph clients[One Angular application]
    Web[Browser / PWA]
    Native[Capacitor Android / iOS]
    Desktop[Electron development shell]
  end

  Web --> App
  Native --> App
  Desktop --> App
  App[BorrowedApp use cases] --> Domain[Pure domain rules]
  App --> Store[BorrowedStore]
  Store --> IDB[(Dexie / IndexedDB v2)]
  Store --> Queue[(Mutation queue)]
  Queue -. future HTTPS sync .-> API[Versioned modular-monolith API]
```

## Runtime layers

1. `src/app/features`, `layout`, `ui`, `i18n`: routes, components, accessible interaction and localizable copy. They do not calculate balances or write Dexie directly.
2. `src/app/data/borrowed-app.ts`: application use cases and presentation-shaped reads.
3. `src/app/domain`: pure TypeScript types, commands, money/date/status/query rules and IDs.
4. `src/app/data`: `BorrowedStore`, Dexie adapter, rows/mappers and schema migrations.
5. `capacitor.config.ts`, `android/`, `ios/`, `electron/`: delivery shells. Native APIs must be wrapped at this boundary before features use them.

Dependencies point inward. Domain code has no Angular, Dexie, Capacitor or Electron import.

## Frontend

- Angular 22 standalone components, strict templates, signals and zoneless change detection.
- No NgRx: local persisted state is authoritative; signals hold screen state and the application revision marker.
- Feature routes are lazy loaded. The shell is eager so navigation and the first landmark appear quickly.
- One flow is used at all widths. Mobile uses a five-item bottom navigation; desktop uses a rail and wider content area.
- User text comes from `src/app/i18n/en.ts`. Additional catalogs can implement the same keys; visible copy is not assembled from translated fragments.
- The add form keeps one device-local draft and clears it only after a successful committed record.

## Local persistence

Dexie/IndexedDB schema v2 is the only implemented store on all shells. It supports indexed queries, transactions, persistence and migrations; `localStorage` is not a database.

The critical loan update boundary is `BorrowedStore.updateLoan()`. It reads the loan and repayments, validates the domain command, writes the new loan/event/repayment and enqueues mutations in one read-write transaction. This prevents two tabs from accepting conflicting repayments against one stale balance.

Native SQLite is not claimed. If WebView persistence proves insufficient, a SQLite implementation can replace the adapter without changing domain/UI contracts. That migration must include data transfer and rollback, not require reinstalling the app.

## PWA and offline behavior

The production web build registers Angular’s service worker and prefetches the application shell and hashed JS/CSS. IndexedDB holds user data. The service worker is disabled inside Capacitor because the native package already ships its web assets and does not need a second cache lifecycle.

Core create, view, search, return, repay, history and settings operations perform no HTTP request. The PWA can reload its cached shell offline after one successful online production load.

## Backend and remote database

None exists in Part 1. The future backend is a versioned API in a modular monolith responsible only for authentication, backup/sync, device management, files and notification delivery. It must expose DTOs/resources, not ORM rows. See `docs/sync.md`.

## Authentication and identity

First run creates `LocalSettings.localIdentityId`. This installation identity is not an authenticated account. Records work with no account. A future account links installations at the sync layer and must not make Person equal to registered User.

## Attachments and notifications

Not implemented. A future attachment service has independent local metadata/blob/upload state so photo failure never rolls back a loan. A future reminder has its own schedule separate from `dueOn`; permissions are requested only when the user enables a reminder.

## Platform integrations

Capacitor calls are confined to delivery/bootstrap boundaries. A future camera, notification, contacts, secure-storage or biometrics feature first defines a small application interface and then web/Android/iOS adapters. Feature components never branch on an operating system.

## Error boundaries

| Boundary               | Behavior                                                                         |
| ---------------------- | -------------------------------------------------------------------------------- |
| Domain validation      | Typed `DomainError` code, translated to actionable UI copy                       |
| Missing local row      | Generic non-private “not found” state                                            |
| Draft persistence      | Best-effort and non-blocking; committed save still reports local storage failure |
| Local database failure | Form remains populated; generic retry message, no raw exception                  |
| Network/sync           | Not present; future states are Synced, Syncing, Offline, Needs attention         |
| Global runtime         | Angular global browser error listeners; no private payload logging               |

## Testing architecture

- Pure Vitest tests for domain rules.
- fake-indexeddb integration tests for transactions, persistence, migration, drafts and reload.
- Angular TestBed component tests for navigation, accessibility contracts and core views.
- Production build inspection and real-browser PWA/offline/responsive acceptance.
- CI also compiles a Capacitor Android debug APK with Java 21/API 36.

## Version boundaries

| Version          | Current source                                           |
| ---------------- | -------------------------------------------------------- |
| Application      | `package.json` (`0.1.0`)                                 |
| IndexedDB schema | `LOCAL_SCHEMA_VERSION` (`2`)                             |
| Sync protocol    | v0 queue-only design in `docs/sync.md`                   |
| API              | Not implemented; first remote contract will be `/api/v1` |
| Native shells    | Capacitor packages and native project files (`8.5`)      |

Older clients and a future newer backend must coexist. Remote breaking changes require a new API/protocol version and a documented compatibility window.
