# People Hub Design

## Goal

Make each person the stable home for every lending relationship with them. A person is a private local record, not an account, contact permission, invitation, or public identity.

## Product contract

- Every loan references one stable client-generated `personId` and keeps a name snapshot for readable history.
- Choosing an existing person creates another loan under the same person. Typing the same name without choosing an existing result may create a separate person because Borrowed must not merge ambiguous identities automatically.
- A person can have several active lent and borrowed records at the same time.
- A person page immediately answers:
  - how many of my physical items they currently have;
  - how many of their physical items I currently have;
  - how much they still owe me, grouped by currency;
  - how much I still owe them, grouped by currency.
- Active records remain separated by direction. Completed records remain in history.
- Partial repayments change derived balances without changing the original loan amount.

## Information architecture

### People list

The People route remains a first-class desktop destination and a More destination on mobile. It shows a local search field and one open row per person, ordered by recent loan activity. Each row communicates the name, active total, active direction counts, and completed-history count without becoming a CRM profile.

### Person page

The page uses one hierarchy:

1. Back navigation, avatar, display name, and a short private-local explanation.
2. A visible `Add record with {person}` action.
3. A four-row relationship summary with semantic icons and text, never color alone.
4. `With {person}` active records for things I lent and money owed to me.
5. `From {person}` active records for things I borrowed and money I owe.
6. Completed history.

Empty active groups are represented in the four-row summary and do not create decorative empty cards. If the person has no active records, the page says so and keeps history visible.

### Add flow

The existing person field remains the main input. It searches the complete local people collection and presents at most eight matching or recent choices. Clicking a choice stores its ID. Opening Add from a person page supplies `personId` in the URL and preselects that person while preserving the standard form.

## Domain and data flow

`summarizePersonRelationships()` is a pure domain function. It receives only that person's loans, repayments grouped by loan, and today's calendar date. It derives direction groups, physical-item counts, currency-safe outstanding totals, urgency ordering, completed history, and per-loan remaining values.

The local store adds indexed person-specific reads:

- `listLoansForPerson(personId)` uses the existing `loans.personId` index.
- `listRepaymentsForLoanIds(ids)` performs one bounded multi-key read through the existing `repayments.loanId` index.

No new schema version is required because the necessary indexes already exist. The person overview performs one person lookup, one indexed loan query, and at most one batched repayment query.

## Privacy and identity

- No registration is required for the other person.
- No address-book permission is requested.
- No automatic contact lookup, invitation, message, or debt demand occurs.
- Duplicate people remain separate unless a future explicit merge flow is implemented.
- Deleting or renaming a person in the future must not make historical loans unreadable because loans retain `personNameSnapshot`.

## Accessibility and responsive behavior

- Semantic headings preserve a logical outline.
- Every link and form control has visible translated text and a minimum 44px target.
- Summary meanings use icon plus wording, not color alone.
- At narrow widths the summary and actions stack without horizontal scrolling.
- At wider widths the summary uses two columns while active/history records retain the shared open-row vocabulary.
- English, Russian, and Lithuanian strings live in their existing file-per-language catalogs and support plural forms and longer labels.

## Testing acceptance

- One person can own simultaneous lent-item, lent-money, and borrowed-item records.
- Partial repayments produce correct per-person outstanding totals.
- Completed records leave active groups and appear in person history.
- Different currencies remain separate.
- Selecting an existing person reuses its ID and survives reload.
- Deep-linking from a person page preselects that person in Add.
- People search and the four relationship answers render accessibly.
- 320px, 390px, tablet, and desktop layouts do not overflow.
