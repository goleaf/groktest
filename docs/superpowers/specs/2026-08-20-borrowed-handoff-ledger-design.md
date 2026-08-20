# Borrowed Handoff Ledger redesign

## Objective

Replace the rejected custody-board presentation with an information-rich personal handoff ledger. The app must feel complete with realistic local data, make 100 records easy to scan, and keep the answer to “who has what?” visible at every width.

The redesign preserves Angular 22, Dexie/IndexedDB, all current routes, EN/RU/LT localization, the local-only promise, domain commands, schema v3, and existing user data.

## Direction and alternatives

Three directions were considered:

1. **Personal accounting desk.** Dense and efficient, but it over-emphasizes money and makes physical items feel secondary.
2. **Object gallery.** Visually expressive, but image-led cards do not scale to 100 records and the model has no image relation.
3. **Handoff Ledger.** A clean, high-density register built around people, direction, due state, and next action.

Handoff Ledger is selected. The user explicitly rejected the current visual result, requested a complete redesign, and asked for a fully populated local dataset.

## Visual identity

Borrowed remains white and teal with rust reserved for overdue states. The new identity removes the heavy forest sidebar and replaces it with a quiet layered workspace.

### Tokens

- `--canvas`: `oklch(0.975 0.012 188)` — cool teal-tinted workspace.
- `--surface`: `oklch(1 0 0)` — primary reading surface.
- `--surface-muted`: `oklch(0.955 0.02 188)` — grouped controls and secondary regions.
- `--teal`: `oklch(0.48 0.11 188)` — primary brand and actions.
- `--teal-deep`: `oklch(0.29 0.07 188)` — strong text and selected navigation.
- `--ink`: `oklch(0.2 0.02 188)` — primary text.
- `--muted`: `oklch(0.46 0.025 188)` — secondary text.
- `--line`: `oklch(0.88 0.018 188)` — separators and control borders.
- `--overdue`: `oklch(0.52 0.16 38)` — overdue only, always paired with text and icon.

No gradients, cream, serif typography, glass, decorative badges, or direction-by-color.

### Typography and geometry

Use the existing local humanist system stack with clearer roles: 34px page titles, 22–24px section leads, 16px controls/body, and 12–14px metadata. Numbers use tabular figures.

The geometry is precise rather than bubbly: 8px controls, 12px sections, 16px major workspace panels. Rows and panels use one border and restrained shadow only where spatial elevation is real. All targets are at least 44px.

### Signature

Every record exposes a compact handoff line:

- `You → Peter` for lent records.
- `Anna → You` for borrowed records.

The line is built from text and a semantic directional icon, so it remains useful without color. It is the repeated visual signature across Home, Records, Search, History, and person pages.

## Responsive shell

### Desktop

Use a full-width sticky white header with brand, primary navigation, global search affordance, language control, and Add record action. A narrow teal rule identifies the product without dominating the viewport.

Main pages use a 12-column workspace up to 1320px. Home divides into a wide record stream and a narrow relationship/deadline rail. Records use a table-like ledger with stable columns. Add and Detail use two-column compositions with a sticky summary/action rail.

### Mobile

Use a compact white brand bar and the existing five-destination bottom navigation. The center Add action stays visually prominent. Dense desktop columns collapse into open rows; handoff, asset, remaining amount, and due state remain visible without horizontal scrolling.

## Home

Home begins with a greeting-free `Overview` heading and one flat summary ribbon for open, lent, borrowed, and overdue counts. It is one structural element, not four metric cards.

Below it:

- Left: urgent and recent open records in ledger rows.
- Right: due-soon schedule and people with the largest number of open relationships.
- Primary actions: Add record, open a record, mark a physical item returned.

The first viewport should contain meaningful data at 1440x1000 and 390x844. Empty Home remains supported but is not the demo default.

## Records and supporting lists

Desktop Records presents columns for handoff, asset or amount, state, due date, and next action. Filters stay in one compact toolbar. Mobile uses the same information hierarchy as stacked rows.

Search, History, and person pages reuse the handoff row. People displays relationship counts and direction-separated balances without implying accounts or social profiles.

## Add and Detail

Add uses a focused form column plus a live plain-language preview: direction, person, asset or money, due date, and note. The preview is derived from form state only and performs no persistence query.

Detail uses the handoff line as its heading context. The main column contains asset/money details and event history; the side rail contains status, due date, person, remaining balance, and the context-safe action.

## Demo dataset

`seedDemoIfEmpty` remains the only entry point and still returns immediately when any loan exists. Existing installations are never overwritten or topped up.

An empty database receives exactly 100 Loans connected to a stable set of 24 People. The dataset covers:

- both directions for every person;
- physical items and money;
- active and completed records;
- no deadline, due soon, future, and overdue deadlines;
- EUR, USD, and GBP money records kept currency-separated;
- partial and full repayments;
- multiple repayments on selected money loans;
- return events for completed items;
- due-date-change events on selected active records;
- creation events and mutation-queue entries created through the real application commands.

Every Loan has a valid Person relation and historical name snapshot. Every Repayment references a money Loan. Every LoanEvent references a Loan. Drafts are not seeded because they represent interrupted user input rather than product data. Unsupported cancelled/archived workflows are not fabricated.

The seed is deterministic relative to the current calendar day so screenshots and tests remain stable while overdue wording stays truthful.

## Boundaries

- UI components call `BorrowedApp`, never Dexie directly.
- The seed uses public application commands rather than inserting rows.
- No schema migration or new entity is required.
- No remote dependency, account, contact import, photo, or notification permission is introduced.
- EN/RU/LT remain complete for any new visible copy.

## Accessibility

- One visible `main` and one `h1` per route.
- Native links, buttons, tables/lists, labels, and disclosures first.
- Visible `:focus-visible` treatment on light and teal surfaces.
- Handed-off direction and overdue state are never color-only.
- Result counts and post-action updates use polite live regions where needed.
- Reduced motion removes non-essential transitions.
- 200% zoom and 320px reflow do not introduce horizontal page scrolling.

## Verification

- Seed tests assert exactly 100 Loans and validate Person, Repayment, Event, and mutation relationships.
- Component tests cover the new shell, overview ribbon, handoff line, responsive record anatomy, Add preview, and Detail side rail.
- Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` sequentially.
- Verify Home, Records, Add, Detail, Search, People, Person, History, More, and Settings in an isolated browser context at 390x844 and 1440x1000.
- Exercise filters, search, return, repayment, language switching, reload persistence, keyboard focus, and console health.

## Self-review

The specification contains no placeholder or schema ambiguity. It explicitly distinguishes Loan count from related row counts, preserves existing installations, and excludes relationships that the current product does not implement. The visual direction is materially different from the rejected dark-sidebar design while respecting the project palette and product model.
