# Borrowed — agent instructions

Personal local-first app: what I lent, what I borrowed, who has it, what is still owed.

This is **not** Laravel, Next.js, or a SaaS. Do not apply Laravel/Filament skills here.

## Stack

- Angular 22 standalone, zoneless, TypeScript strict, pnpm
- Dexie / IndexedDB (`borrowed-app`) behind `BorrowedStore`
- PWA + Capacitor (android/ios in tree) + Electron on `http://127.0.0.1:4200`
- Vitest + jsdom; Prettier; angular-eslint
- i18n catalogs in `src/app/i18n/` (`en`, `lt`, `ru`)

## Domain rules

- People are names, not user accounts
- Money is integer minor units + ISO 4217
- Calendar dates are `YYYY-MM-DD`; instants are separate
- IDs are UUIDv7
- Status is stored, not event-sourced
- Do not re-seed demo data if loans already exist (`seedDemoIfEmpty`)

Product and design: `docs/product.md`, `docs/DESIGN.md`. White + teal OKLCH hue 188; rust only for overdue; no cream/serif.

## Commands

```bash
pnpm start          # http://127.0.0.1:4200
pnpm test           # ng test --watch=false
pnpm lint
pnpm typecheck
pnpm format
```

## Skills (repo `.agents/skills`)

Use these when they apply. Grok and Codex both auto-discover this folder.

| Skill                   | When                                                 |
| ----------------------- | ---------------------------------------------------- |
| `angular-developer`     | Any Angular component, signal, route, form, DI, test |
| `angular-new-app`       | Scaffolding only (app already exists)                |
| `frontend-design`       | Visual direction / UI that must not look generic     |
| `web-design-guidelines` | UI/UX audit against Vercel Web Interface Guidelines  |
| `better-accessibility`  | Keyboard, ARIA, focus, hit areas, screen readers     |
| `vitest`                | Unit tests, mocks, coverage                          |

Follow `docs/DESIGN.md` over skill defaults when they conflict (no Tailwind-by-default, no shadcn, no cream/serif).

## MCP (same set for Grok and Codex)

Configured in `.grok/config.toml`, `.codex/config.toml`, and `.mcp.json`.

| Server            | Use for                                                         |
| ----------------- | --------------------------------------------------------------- |
| `angular-cli`     | Angular best practices, docs search, project list, `ng` targets |
| `context7`        | Current library docs (Angular, Dexie, Capacitor, Vitest)        |
| `playwright`      | Click-through UI verification of `http://127.0.0.1:4200`        |
| `chrome-devtools` | Runtime DOM, console, network, layout                           |

Verify UI in a real browser after visual or routing changes. Prefer Playwright on the running dev server.

## UI verification

Dev server: `http://127.0.0.1:4200`. IndexedDB name: `borrowed-app`.
