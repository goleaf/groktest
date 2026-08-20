# Repository audit

Audited on 20 August 2026.

## Current state

This repository started empty except for an aborted localhost scaffold (Next.js workspace stubs, an unimplemented `packages/db` test, pnpm workspace files). Those files were not a running application: no install, no app entry, no tests that could pass, no domain model.

They were removed. The repository is now an Angular 22 standalone application created with the official CLI.

| Area | Finding |
|---|---|
| Framework | Angular 22.1, TypeScript ~6, Vitest, zoneless (no `zone.js`) |
| Routing | Present, previously empty |
| State | None beyond CLI starter |
| Persistence | None |
| API / backend | None |
| Authentication | None |
| Tests | CLI `App` smoke test only |
| Lint / format | Prettier from CLI; no ESLint schematic in this CLI version |
| CI | None |
| PWA | Not configured by CLI |
| Capacitor | None |
| Electron | None |
| Domain | None |

## Problems

- The previous scaffold targeted a different stack than Part 1 of the Borrowed spec (Angular, PWA, Capacitor, local-first).
- It was incomplete, so there was no working architecture to preserve.
- Starter `app.html` is the CLI marketing template and is not the product.

## Technical debt

None inherited. After this Part, remaining debt is intentional deferral (see `docs/roadmap.md`), not leftover stubs.

## Good existing architecture

Nothing product-related existed. The CLI baseline is kept: standalone components, Vitest, Prettier, `pnpm`, the application builder.

## Migration path

No data to migrate. Replace the starter shell with the Borrowed application. Do not introduce a second frontend.

## Decision

Treat the repository as new. Follow the Part 1 architecture (Angular + PWA + Capacitor + Electron desktop wrapper + local-first IndexedDB).
