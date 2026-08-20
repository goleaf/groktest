# ADR 0009: PWA shell plus tracked Capacitor native projects

## Context

A web manifest alone did not make Borrowed offline. Capacitor configuration existed without Android/iOS projects, so mobile compatibility was aspirational. Maintaining separate UIs would multiply UX and domain drift.

## Decision

- Keep one lazy-loaded Angular application for web, PWA, Android and iOS.
- Angular service worker prefetches the production web shell and install assets.
- Disable that service worker inside Capacitor; packaged assets provide the native shell lifecycle.
- Track Capacitor 8 Android and iOS projects in the repository and verify `cap sync` in normal development.
- CI compiles Android with JDK 21/API 36. iOS compilation requires Xcode 26+.

## Alternatives considered

- Manifest-only PWA: cannot reload the shell offline.
- Separate native UI: unjustified duplicate product implementation.
- Generate ignored native projects on every machine: native changes would be unreviewed and non-reproducible.
- Add native plugins now: no current capability needs permissions.

## Consequences

The same features and accessibility semantics ship everywhere. Native project changes are reviewable. Web service-worker updates and native release updates remain distinct. IndexedDB remains the current data adapter; native SQLite is a later evidence-driven migration behind `BorrowedStore`.
