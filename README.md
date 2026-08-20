# Borrowed

A personal app that remembers what you lent, what you borrowed, and what is still outstanding.

Data lives **on this device**. There is no account and no hosted backend in this version.

## Requirements

- Node.js 22
- pnpm 10 (`corepack enable`)

## Local web

```sh
pnpm install
pnpm start
```

Open `http://127.0.0.1:4200`.

## Tests, types, lint, production build

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Desktop (Electron)

In one terminal:

```sh
pnpm start
```

In another:

```sh
pnpm electron
```

Electron loads the local Angular URL. It does not talk to the internet.

## Mobile (Capacitor)

The same Angular build is the iOS/Android app. Native project files are not committed yet (they need Xcode / Android Studio on your machine):

```sh
pnpm build
pnpm exec cap add ios     # once
pnpm exec cap add android # once
pnpm exec cap sync
pnpm exec cap open ios
```

See `docs/architecture.md` and `capacitor.config.ts`.

## Persistence

IndexedDB via Dexie. Clearing site data in the browser deletes loans. See `docs/data-model.md` and `docs/security.md`.

## Documentation

| Doc                     | What it is                  |
| ----------------------- | --------------------------- |
| `docs/product.md`       | Product definition          |
| `docs/architecture.md`  | System shape                |
| `docs/data-model.md`    | Entities and rules          |
| `docs/sync.md`          | Future sync protocol        |
| `docs/security.md`      | Threat model                |
| `docs/ux-principles.md` | Interaction rules           |
| `docs/roadmap.md`       | Intentionally deferred work |
| `docs/adr/`             | Architecture decisions      |
