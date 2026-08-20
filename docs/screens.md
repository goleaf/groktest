# Screen inventory

| Screen | Kind | Part 1 | Responsibility |
|---|---|---|---|
| First launch | Home empty state | Yes | One-line explanation + Add. No wizard |
| Home | Screen | Yes | Action sentences, counts, overdue/due soon. Not analytics |
| Lent | Screen | Yes | Active lent list, empty state |
| Borrowed | Screen | Yes | Active borrowed list |
| Add | Screen | Yes | Direction, kind, person, item/amount, save |
| Person field | Inline | Yes | Type a name; recents if any |
| New person | Inline | Yes | Creating a loan with a new name creates the person |
| Loan details | Screen | Yes | Facts, history, return or repay |
| Repayment | Inline on details | Yes | Amount, date default today |
| Mark returned | Direct action | Yes | Completes physical loan; confirm only if we later find accidents; v1 is one tap with undo via not deleting |
| History | Screen | Yes | Completed records |
| People | Screen | Yes | Names with active counts |
| Person details | Screen | Yes | Their active/history loans |
| Search | Screen | Deferred | Local filter; lists have a simple text filter in Part 1 if cheap |
| Settings | Screen | Yes | Preferred currency, “On this device”, app version |
| Reminders | — | Deferred | |
| Notifications | — | Deferred | |

## List row

Must show direction word, person, item or formatted money, state (including remaining / overdue / due). Not every column.
