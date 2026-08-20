# Domain workflows

## Physical item

```
(device-local form draft, not a loan and not synced)
    → create → Active
    → mark returned → Completed (returnedOn = today, history event)
    → cancel (later) → Cancelled
    → archive completed (later) → Archived
```

Reopen is reserved on the event type, not implemented.

Partial quantity return is not in v1; return means the whole loan.

The return action is worded relative to the user: a lent item uses “returned to me”, while a borrowed item uses “I returned it”. Completion moves the record out of active lists and into History without changing its ID or deleting any event.

## Money

```
(device-local form draft)
    → create → Active (outstanding = original)
    → repayment → Active + derived partially_repaid if outstanding > 0
    → repayment that zeroes outstanding → Completed
```

`partially_repaid` is never stored.

The UI presents the source data and derived balance together:

```
original amount → sum of active repayments → remaining amount
€100            → €30                      → €70
```

Repayment controls are also relative to direction: money lent records capture what was returned to the user; money borrowed records capture what the user returned.

Loan update commands run inside one storage transaction with the current repayment set. Concurrent repayments cannot both validate against a stale balance.

## Overdue / due soon

Computed at read time from `status === active`, `dueOn`, and today in the user’s timezone. The signed date-only difference drives one shared status:

```
0 days       → due today
1 day        → due tomorrow
2–3 days     → due in N days
more than 3  → localized calendar date
past date    → overdue by N days
```

The three-day early-warning threshold is the centralized `DUE_SOON_DAYS` domain configuration. It is not spread across screens.

Passing the deadline never changes stored status and never contacts the other person. The record stays Active until the item is returned or money is fully repaid.

An active record can move its deadline:

```
Active + valid new due date
    → update dueOn and version
    → append due_date_changed activity
    → enqueue Loan + LoanEvent in the same local transaction
    → remain Active
```

The new date must be on or after the original handoff date. In-app deadline tracking works offline. Operating-system notifications and custom schedules remain a separate future Reminder capability. See `docs/data-model.md`.

## People

Choosing an existing person creates another Loan with the same stable `personId`:

```
choose Andrei → create lent drill
choose Andrei → create lent €100
choose Andrei → create borrowed ladder
              → one Andrei overview
```

The overview derives four answers from active records: my physical items with the person, their physical items with me, money they owe me, and money I owe them. Money is grouped by currency and uses original amount minus active repayments. Active records are split by direction and urgency; completed records are sorted into the same person's history without changing IDs.

The Add form shows recent people before typing and searches the complete local people list as the user types. A person-page Add action passes `personId` and preselects that exact private record. Equal display names are not merged automatically because they may represent different people. No account, contact permission, invitation, or message is involved.
