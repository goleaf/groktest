# Borrowed

A personal app that remembers what you lent, what you borrowed, and what is still outstanding.

Data lives **on this device**. There is no account or hosted backend in this version. The production web build is an installable offline PWA; Android and iOS use the same Angular application through Capacitor.

## Requirements

- Node.js 22+
- pnpm 10 (`corepack enable`)
- JDK 21 and Android SDK 36 for Android builds
- Xcode 26+ for iOS builds

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
pnpm audit --audit-level high
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

Native projects are committed under `ios/` and `android/`:

```sh
pnpm build
pnpm exec cap sync
pnpm exec cap open ios
pnpm exec cap open android
```

Android CLI build on macOS:

```sh
cd android
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./gradlew assembleDebug
```

See `docs/architecture.md` and `capacitor.config.ts`.

## Persistence

IndexedDB schema v2 via Dexie, including an in-place v1 migration and one local Add draft. Clearing browser/app data deletes local-only loans. See `docs/data-model.md` and `docs/security.md`.

## Documentation

| Doc                             | What it is                      |
| ------------------------------- | ------------------------------- |
| `docs/product.md`               | Product definition              |
| `docs/architecture.md`          | System shape                    |
| `docs/data-model.md`            | Entities and rules              |
| `docs/sync.md`                  | Future sync protocol            |
| `docs/security.md`              | Threat model                    |
| `docs/ux-principles.md`         | Interaction rules               |
| `docs/roadmap.md`               | Intentionally deferred work     |
| `docs/requirements-coverage.md` | Part 1 requirements disposition |
| `docs/adr/`                     | Architecture decisions          |
