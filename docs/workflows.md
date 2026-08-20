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

## Money

```
(device-local form draft)
    → create → Active (outstanding = original)
    → repayment → Active + derived partially_repaid if outstanding > 0
    → repayment that zeroes outstanding → Completed
```

`partially_repaid` is never stored.

Loan update commands run inside one storage transaction with the current repayment set. Concurrent repayments cannot both validate against a stale balance.

## Overdue / due soon

Computed at read time from `status === active`, `dueOn`, and today in the user’s timezone. See `docs/data-model.md`.
