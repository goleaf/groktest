# ADR 0003 — IndexedDB via Dexie for Part 1

## Context

The spec wants structured local data with indexes, transactions, and migrations. Native SQLite is preferred on iOS/Android; IndexedDB is specified for web/PWA. The owner also asked for SQLite in an earlier conversation.

## Decision

Part 1 uses **Dexie on IndexedDB** behind `BorrowedStore`. Schema is relational-shaped (tables, not one JSON blob). Native SQLite is a future adapter on the same interface.

## Alternatives

- sql.js / wa-sqlite: real SQLite in WASM; heavier, harder with Angular bundling, weaker indexed query DX
- localStorage: forbidden as primary store
- Native SQLite only: does not work as-is in the browser PWA

## Consequences

One persistence path for web, PWA, Capacitor WebView, and Electron. IndexedDB is unencrypted. Swapping to SQLite later is a store rewrite, not a domain rewrite. We do not pretend the files are `.sqlite` on disk in the browser.
