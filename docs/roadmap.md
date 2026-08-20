# Roadmap and intentional deferrals

Part 1 is the complete local-first foundation and core item/money create/return/repay slice. Deferred means “designed and bounded, not implemented.”

| Capability | Current state | Next vertical slice / reason |
| --- | --- | --- |
| Remote account and sync drain | v0 queue + protocol documented | Versioned modular-monolith API, device registration, idempotent batch sync, conflict UI |
| Backup/restore | JSON export exists | Validated import/archive and then account backup; never equate sync with backup |
| Reminders/notifications | Separate from due date in design | Reminder entity, local scheduler adapter, contextual permission, conservative defaults |
| Photos/attachments | Not in schema/UI | Local metadata/blob, compression/thumbnails, independent retry and authorized remote storage |
| Contact import | Person works without permission | Explicit picker action, minimal imported fields, no first-launch prompt |
| Person edit/merge/delete | Stable IDs/snapshots; duplicate names allowed | Explicit, reversible merge and tombstone UX |
| Cancel/archive/reopen | Status/event vocabulary reserved | Policy, activity and undo-focused UI; completion remains distinct |
| Partial physical quantity return | Quantity exists; v1 return is complete | Return events per quantity if user evidence justifies complexity |
| App lock | Not implemented | Optional biometric adapter; honest that it is not storage encryption |
| Device list/revoke | Needs account | Last-sync visibility, revoke tokens, no false remote-wipe promise |
| Native SQLite | `BorrowedStore` seam; IndexedDB currently used | Only after durability/performance evidence; requires in-place data migration |
| Desktop packaging | Electron 43 dev shell | Production file loading, signed packages, update/rollback strategy |
| iOS build evidence | Project generated/synced | Install full Xcode 26+, build/test simulator and device |
| Browser E2E automation | Real-browser acceptance + component tests | Checked-in Playwright critical-flow suite |
| Import CSV/JSON | Export only | Runtime schema validation, preview, duplicate policy, rollback |
| Shared confirmed loans | Person remains separate from User | Later invitation/confirmation model; no premature shared ownership |
| QR | No abstraction | Add only with a proven creation/identification flow |
| Smart/AI behavior | Deliberately absent | No AI dependency without a specific, privacy-safe user benefit |
| Feature flag platform | Deliberately absent | Small local config only when first experiment exists |

Search, local filtering, JSON export, local draft persistence, PWA offline shell, linting, CI, Capacitor Android/iOS projects and Android debug compilation are no longer deferred.
