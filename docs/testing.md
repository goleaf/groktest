# Testing

Runner: **Vitest** via `ng test` (Angular 22 unit-test builder).

## Layers

| Layer       | What                                             | How                         |
| ----------- | ------------------------------------------------ | --------------------------- |
| Domain      | IDs, money, dates, create/repay/complete/overdue | Pure unit tests, no Angular |
| Persistence | Dexie store, reload, migrations                  | `fake-indexeddb`            |
| Application | Use cases through `BorrowedApp`                  | Store + domain              |
| Component   | Shell renders nav landmarks                      | Angular TestBed, sparse     |
| E2E         | Critical flows                                   | Deferred to a later part    |

## Domain tests required (Part 1)

- Physical lent/borrowed creation
- Money lent/borrowed creation
- Positive amount and currency validation
- Repayment, outstanding, over-repayment rejected
- Completion (item return and full repay)
- Overdue and due-soon with calendar-date semantics
- Stable UUIDv7 identifiers
- Repository persist and reload

## Local-first tests

- Record still there after a new store instance (reload)
- Local edit and completion
- Repayment without any network
- Mutation remains queued (`ackedAt` is null)

## Commands

```sh
pnpm test
pnpm test -- --watch=false
```

Do not log fixture names, notes, or amounts in CI beyond assertions.
