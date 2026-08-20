# Return Reminder Design

## Product contract

Borrowed remembers an optional return date and turns it into an in-app reminder. It never contacts the other person, sends a demand, or changes a record automatically.

An active record with a due date has one of these derived states:

- due today;
- due tomorrow;
- due within the next three calendar days;
- due later, shown as an ordinary localized date;
- overdue by an exact number of calendar days.

The record remains active after the deadline. The user can mark an item returned, record a partial or full money repayment, move the due date, or leave the record unchanged.

## Selected approach

The existing date-only `dueOn` field remains the source of truth. A shared domain helper calculates signed calendar-day distance from the user's current local date. A shared UI component converts that value into localized copy and iconography on Home, record lists, and Details.

This avoids fake midnight timestamps, persisted `overdue` flags, and duplicated date logic in individual screens. A lightweight platform tracker advances one reactive current-day signal at local midnight and refreshes it when the app regains visibility or focus. The existing three-day `DUE_SOON_DAYS` constant remains the single early-warning threshold.

## Approaches considered

### Persist reminder status

Storing `overdue`, `days overdue`, or `due soon` would make reads simple, but the values become stale as the calendar changes and create avoidable synchronization conflicts. Rejected.

### Add a Reminder entity and operating-system notifications

This is appropriate for later user-configured push scheduling, but it would require permission UX, platform schedulers, rescheduling, and timezone recovery. The current requirement is satisfied by in-app reminders and explicitly forbids unsolicited messages to another person. Deferred.

### Derive the state from `dueOn` — selected

Derivation is deterministic, local-first, works offline, and remains correct whenever the app opens or the local day changes.

## Due-date changes

Moving a deadline is an explicit domain command, not direct UI mutation. It:

- requires an active, non-deleted record;
- requires a valid calendar date on or after the original handoff date;
- rejects an unchanged date so activity history stays meaningful;
- updates the loan version and timestamp;
- appends a `due_date_changed` activity event with the new date;
- queues the loan and event for later synchronization in the existing IndexedDB transaction.

The event preserves history; it does not rewrite the original creation event. Completion and repayments remain independent of the due date.

## UX and localization

The reminder appears with a clock/calendar icon and text, never through color alone:

- `Due today`;
- `Due tomorrow`;
- `Due in 2 days`;
- `Overdue by 4 days`.

English, Russian, and Lithuanian use each locale's plural rules from the existing file-per-language catalog. The Details screen adds a compact, inline “Change return date” disclosure so the action is available without competing with return or repayment actions.

## Offline and notification boundary

All reminder calculations and deadline changes work without a network connection. No browser notification permission is requested and no system notification is scheduled in this slice. User-configured OS notifications, custom lead time, repetition, and a separate Reminder entity remain future work.

## Test strategy

- Unit tests prove signed calendar-day distance across month/year boundaries, timezone-independent date-only semantics, and live midnight/focus refresh without editing a loan.
- Domain tests prove valid deadline changes, event creation, versioning, and invalid/inactive rejection.
- IndexedDB tests prove the changed deadline and event survive reload and remain queued for synchronization.
- Component tests prove relative copy, pluralization, icons, and the Details deadline-change action.
- A real browser verifies create with a near deadline, move the deadline, localized copy, responsive layout, and a clean console.
