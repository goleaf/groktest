# Core Borrowed Flow Design

## Product contract

Borrowed has one job: record a handoff, remember what is still outstanding, close it after return, and retain the history.

The create flow asks for four things in one short form:

1. I lent or I borrowed.
2. To whom or from whom.
3. What moved: an item or money.
4. When it should be returned, if there is a due date.

A saved record is active immediately and remains active until the item or the full amount is returned. Completing a record never deletes it.

For money, repayments are append-only. The original amount never changes. The detail screen explicitly shows original amount, total returned, and remaining amount.

## Approaches considered

### Keep generic copy

The current form can keep “Who is it with?” and a generic “Mark as returned”. This is technically correct but forces the user to mentally translate the direction on every action.

### Direction-aware single form — selected

Keep one fast form, but change its labels and completion actions with the selected direction. “I lent” asks “Who did you lend to?” and later says “Returned to me”; “I borrowed” asks “Who did you borrow from?” and later says “I returned it”. The due date remains visible because it is one of the four core facts. Only the note stays progressively disclosed.

This preserves the current local-first architecture and removes ambiguity without adding steps.

### Multi-step wizard

A wizard could present one question at a time, but it adds navigation, hides context, and makes repeat entry slower. It is rejected for the core flow.

## Data and behavior

- Physical item: create active loan, mark returned, store `completed` plus a return event, retain the same record ID in History.
- Money: create active loan with immutable original minor units, append each repayment, derive total repaid and remaining, complete only at zero remaining.
- All actions write to IndexedDB first and do not depend on a network connection.
- The existing domain commands remain the source of truth; UI components only select copy and format derived values.

## UI and localization

- Remove duplicate sentence fragments around the direction/type selectors.
- Use direction-aware person, due-date, return, and repayment labels.
- Show the due date as a core visible field; keep the optional note inside disclosure.
- Show a three-part money summary: original, returned, remaining.
- Format each repayment amount in the activity timeline.
- Add every new string to the independent English, Russian, and Lithuanian locale files.
- Keep meaningful icons and accessible labels on every changed control.

## Error handling and testing

Existing domain validation remains authoritative: positive amount, valid currency, active-only returns, and no over-repayment. Errors remain inline and entered data is retained.

Component tests cover direction-aware copy, the visible due date, completion labels, and the three-part balance. Domain and IndexedDB tests continue to cover immutable original amounts, partial repayments, full completion, offline persistence, and History retention. A real-browser scenario verifies item return and a 100 EUR loan with a 30 EUR partial repayment.
