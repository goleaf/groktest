# ADR 0001 — Angular as the only frontend

## Context

Borrowed needs web, installable PWA, iOS, Android, and (from the product owner) a desktop window. The repo was empty aside from an unfinished Next.js stub.

## Decision

One Angular 22 app. Capacitor wraps it for stores later. Electron loads it on the desktop. PWA installs in the browser.

## Alternatives

- Next.js + Expo: two UIs, rejected by the Part 1 spec for an empty repo
- Flutter: weak web, second language
- Livewire/Laravel: ruled out by the owner

## Consequences

One set of domain rules and screens. Native look is WebView-quality, not SwiftUI. Electron is a shell, not a third UI.
