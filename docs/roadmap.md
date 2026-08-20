# Intentionally deferred

Part 1 implements foundation + core create/return/repay. Everything below is **out of Part 1** on purpose, not forgotten.

| Item | Why later | Design already |
|---|---|---|
| Sync drain / account | No server, localhost-only | `docs/sync.md` |
| Reminders & notifications | Easy to spam; needs OS permission | Separate from `dueOn` |
| Photos / attachments | Compression, quota, independent retry | Loan create must not depend on upload |
| Contact import | Permission only when used | Person is just a name |
| Search screen | Lists are short at first | Local indexes exist |
| Partial item quantity return | Rare | Quantity is a field; return is complete |
| Person merge | Dangerous | Stable IDs, no auto-merge |
| Archive UI | Completion ≠ archive | Stored status supports it |
| Reopen completed | Edge | Event type reserved |
| Biometric app lock | Native wrapper | Not encryption |
| Device list / revoke | Needs account | |
| Export JSON/CSV | Schema is serializable | |
| Account deletion | Needs account | |
| Shared loan with another user | Person ≠ user | |
| Request/confirm flow | | |
| QR | | |
| Smart / AI reminders | No AI in core | |
| Native SQLite adapter | IndexedDB is specified for web | `BorrowedStore` seam |
| Capacitor iOS/Android project files | Machine/SDK specific | `capacitor.config.ts` |
| E2E browser suite | After UI settles | `docs/testing.md` |
| Draft persistence across process death | In-memory draft in Add | |
| Duplicate-record warning | Users lend the same item twice | Never block |
| Feature-flag platform | Unnecessary | |
| CI secrets, hosting | Localhost only | GitHub Actions lint/test/build only |
| ESLint | This Angular CLI ships Prettier + compiler checks | `ng lint` not configured |

When a later Part starts one of these, update this table and the matching design doc.
