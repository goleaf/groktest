# Borrowed global UX redesign

## Objective

Rebuild every current Borrowed surface around one fast mental model: **a custody board for things and money that are still away from home**. The interface must answer what needs action, let the user capture a handoff in seconds, and make direction and remaining obligation obvious without behaving like a bank, CRM, analytics dashboard, or notebook.

This redesign changes information architecture, navigation, templates, shared presentation models, and styling. It preserves Angular, IndexedDB, the local-only product promise, domain commands, stored records, and all current business rules.

## Direction and alternatives

Three directions were evaluated:

1. Continue the current pale-teal list system. Lowest implementation risk, but too close to the existing redesign and still visually anonymous.
2. Build a tactile household ledger. Distinctive, but slower to scan and too close to a notes application.
3. Build a compact custody board. Stronger structure, faster actions, and a specific visual identity drawn from durable equipment labels and handoff tags.

Direction 3 is selected. The user explicitly requested autonomous completion without questions, so the instruction to proceed is treated as approval of the selected complete concept.

## Concept references

- Mobile Home: `/Users/andrejprus/.codex/generated_images/01a01e35-8207-7213-9625-4affb12d0c15/exec-efc0584b-4684-47fc-a38e-861fe9ed27ef.png`
- Desktop Home: `/Users/andrejprus/.codex/generated_images/01a01e35-8207-7213-9625-4affb12d0c15/exec-8198551b-ec06-4ffa-869f-63d059958a8a.png`
- Mobile Add: `/Users/andrejprus/.codex/generated_images/01a01e35-8207-7213-9625-4affb12d0c15/exec-10ea88f9-69b7-4200-a1d5-eed171da585f.png`
- Mobile Detail: `/Users/andrejprus/.codex/generated_images/01a01e35-8207-7213-9625-4affb12d0c15/exec-039171a8-0dfc-43c8-9b0a-18c220b57b44.png`

The concepts define hierarchy, density, navigation, palette, control anatomy, and responsive behavior. Their accidental button gradients are explicitly rejected; production actions use flat fills. Generated object illustrations are replaced by the existing code-native icon family because the data model has no image source and UI controls must remain native.

## Information architecture

### Primary destinations

- **Home**: one current priority, compact state overview, and the rest of the open records.
- **Records**: all active records with direction, kind, urgency, and text filters.
- **Add**: the single capture path for item or money in either direction.
- **Search**: local search across active and completed data.
- **More** on mobile: People, History, Settings, and the local-data promise.

Desktop exposes People, History, and Settings directly in the persistent navigation rail. Existing `/lent` and `/borrowed` routes remain available and render the same Records surface pre-filtered by direction. Existing bookmarks and tests therefore remain valid.

### Route map

- `/` Home
- `/records` all active records
- `/lent` active records filtered to lent
- `/borrowed` active records filtered to borrowed
- `/add` capture
- `/loans/:id` record detail
- `/search`, `/people`, `/people/:id`, `/history`, `/settings`, `/more`

## Visual system

### Physical scene

The user is standing in a garage doorway or hallway in daylight, holding the phone in one hand while an object changes hands. The interface must be readable immediately, durable rather than decorative, and operable with a thumb.

### Color strategy

Restrained product color with a committed frame:

- `--canvas`: cool chroma-zero near-white work surface.
- `--paper`: true white content surface.
- `--chrome`: deep forest-black for desktop rail and mobile frame.
- `--chrome-raised`: lighter forest selected state.
- `--mint`: desaturated mint grouping surface.
- `--ink`: near-black green-neutral text.
- `--muted`: readable green-gray secondary text.
- `--action`: flat mineral blue for the primary action and focus.
- `--overdue`: coral-red, used only with explicit overdue text/icon.

No gradients, glass, cream, wide shadows, decorative color, or direction-by-color.

### Typography

Use the existing system humanist sans stack. Product typography is fixed, not fluid:

- 32px mobile/desktop page title where space permits.
- 24px item/detail titles.
- 18px section headings.
- 16px body and input text.
- 13–14px metadata and navigation labels.

Headings use at most `-0.03em` tracking and balanced wrapping. Body copy remains under 70 characters per line.

### Geometry and motion

- 4px micro-grid, 8px spacing unit.
- 10px controls, 14px genuine panels, circles/pills only when semantically appropriate.
- Open rows with separators are the default container.
- One flat border or one small shadow, never both decoratively.
- 160–200ms state transitions using ease-out; no page choreography.
- Reduced motion disables all non-essential transitions.

### Icons

Extend the existing 24px code-native SVG vocabulary with `records`, `filter`, `close`, and `info`. Preserve 1.8–2px strokes, rounded joins/caps, optical centering, and `currentColor`.

## App shell

### Mobile

A 64px dark brand bar frames the work area. A dark five-item bottom navigation contains Home, Records, Add, Search, More. Add is circular and mineral blue. The frame accounts for safe areas and never covers form actions or content.

### Desktop

At 880px, switch to a 248px dark rail. It contains brand, Home, Records, Search, People, History, a full-width Add record action, Settings, and the local-device promise. Main content has a readable maximum width and may add a narrow context rail on Home only.

## Screen contracts

### Home

- Heading is `Today`, not a dashboard label.
- The highest-priority record is a wide handoff tag with its real sentence, due state, and a context-safe action.
- Physical active records expose `Mark returned` inline; money and borrowed records expose `Open record`.
- A compact strip states the number of open records.
- Remaining records render as open rows with person, asset/amount, direction language, status, and chevron.
- Desktop context rail shows open/overdue counts and links to Lent/Borrowed without metric cards.
- Empty Home explains the value in one sentence and offers Add record.

### Records, Lent, Borrowed

- One shared surface owns list search and filters.
- Scope control: All, Lent, Borrowed.
- Kind/urgency control: All, Items, Money, Overdue, Due soon.
- `/lent` and `/borrowed` initialize and lock the relevant direction through route wrapper input while retaining the common component anatomy.
- Result count is announced; empty search and empty dataset have different guidance.

### Add

- Heading is `New record`.
- Direction and asset kind visually form the sentence `I lent an item` or its alternatives.
- Required fields use stable descriptive labels: `Who is it with?`, then `What moved?` or `How much?`.
- Recent people are quick-fill controls.
- Return date and note stay behind one progressive disclosure.
- The mobile save action remains reachable above navigation and safe area.
- Busy, disabled, invalid, and storage-error states do not shift layout.

### Detail

- Back control, record context, asset/title, direction sentence, and person form one open hero.
- Overdue/remaining state precedes the primary action.
- Item return is one tap; money repayment remains inline.
- Due date and note use one structural details rail.
- Events render as a semantic timeline with actual stored events only. No invented reminders.
- Missing records show a recovery action to Records.

### Search

- Search input is the first visual control.
- Empty query teaches searchable fields.
- Results distinguish active/completed through explicit text, not color.

### People, Person, History, More, Settings

- People rows use initials, active counts, and open-row anatomy.
- Person detail starts with identity and obligations, then active/history records.
- History uses the same record row with completed state.
- More groups navigation and the local-device promise without promotional cards.
- Settings separates preference, data export, storage warning, and version into clear sections.

## Component and data boundaries

- `Shell` owns navigation and responsive framing only.
- `RecordsPage` provides the all-record route.
- `ListPage` owns record scope, filters, local search, and list composition.
- `LoanRow` owns row anatomy and metadata.
- `HomeAction` gains presentation-safe direction and asset-kind metadata derived from an already loaded loan; it does not add persistence queries.
- `BorrowedApp.activeLoans()` accepts an optional direction and remains the only active-record data boundary.
- Feature pages keep domain actions in `BorrowedApp`; templates contain no persistence logic.
- Global SCSS owns tokens and shared component states; screen-specific selectors are organized by surface.

## Accessibility and edge states

- One `h1` and one `main` per route.
- Every target is at least 44px.
- All icon-only controls have accessible names.
- Scope and filter controls use group names and `aria-pressed`.
- Focus is visible against dark and light surfaces.
- Long names, amounts, translated labels, and 200% zoom wrap without horizontal overflow.
- Color never carries direction or status alone.
- Mobile keyboard and sticky actions do not hide required inputs.
- Empty, missing, error, busy, and reduced-motion states are deliberate.

## Verification

- Test new routing, active-record scope, Home inline return, shell destinations, Add semantics, detail recovery, and shared row output.
- Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` sequentially.
- Verify every route in an isolated Chrome context at 320x700, 390x844, 768x1024, and 1440x1000.
- Exercise Add item, Add money, return, repayment, filters, search, export, navigation, keyboard focus, reduced motion, and reload persistence.
- Check console, network failures, horizontal overflow, landmarks, focus, and Lighthouse accessibility/best-practices/SEO.
- Compare the latest Home, Add, and Detail screenshots directly with their concept sources using `view_image` before handoff.

## Scope protection

Do not change the stored schema, introduce accounts/sync/reminders/photos/contacts, add a remote dependency, or seed production data. Existing unrelated search/export/analytics work in the dirty tree is preserved and may only receive visual integration required by this redesign.
