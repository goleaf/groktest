# UX principles

Borrowed should feel like a quiet instrument, not a notebook app, a bank, or a back office.

## Speed of capture

A basic record is: direction → item or money → person → save. Optional fields stay closed. Loan date defaults to today. Quantity defaults to 1. Currency defaults to the user’s preference. Due date stays empty unless the user sets it.

## Language

- “I lent” / “I borrowed”
- “Returned”, not “Mark as completed”
- “Still owes you €40”, not “Outstanding principal”
- No tenant, workspace, ledger, counterparty, SKU

## Account and permissions

- No account wall
- No notification, camera, or contacts prompt on first launch
- Ask only when the user turns on that feature

## Status

Lent and borrowed are distinguished by **words and icons**, not color alone. Overdue always includes the word and exact day count, not only red.

## Empty states

One sentence plus one action. No illustrations that hide the Add button.

## Destructive actions

Confirm only when data is gone for good. Completing a loan is not destruction (undo via history / reopen later). Deleting a person later must warn that the name stays on old loans.

## Mobile first

- Thumb-reach primary nav
- Controls at least 44px
- No hover-only actions
- Safe-area padding on the bottom nav and Add button
- One main column on a phone; list + context on wide screens, same flows

## Accessibility

- Semantic landmarks and labels
- Visible focus
- Keyboard on web
- Do not encode direction only as a colour swatch
- Errors say what to do next

## Offline

Local actions feel instant. There is no spinner waiting for a server. In Part 1 the truthful status is “On this device”.

The Add screen persists one local form draft after a short debounce. It is not an active Loan, never appears in totals/history and clears only after successful commit (or when the form is empty). A network failure cannot erase the form because core save has no network dependency.

## Responsive continuity

Phone navigation prioritizes Home, Records, Add, Search and More. Desktop unwraps People/History/Settings into a rail but keeps the same routes and wording. Wider space improves composition; it does not create an incompatible workflow. Layouts do not depend on fixed viewport height, so the mobile keyboard can scroll important controls into reach.

People are relationship hubs, not CRM contacts. One open page answers both item directions, both money directions and completed history. Selecting an existing person is explicit and fast; equal names are never merged automatically, and the other person never needs an account or invitation.

## Motion and loading

Motion is restrained, honors reduced-motion preferences and never conveys state alone. Local actions use focused busy states on the affected button/form; there is no global blocking spinner for small operations.
