# Design

## Product posture

Borrowed is a compact handoff ledger. It helps a person see what is still away, who is on the other side of every transfer, act on the next deadline, and capture a new record in seconds.

Physical scene: the user is standing in a hallway or garage doorway in daylight, using one hand while an object changes hands. The interface should feel like a durable equipment label: immediate, high-contrast, and calm.

## Visual identity

White record surfaces and a cool hue-188 canvas make the ledger calm and readable. Deep teal identifies navigation, direction lines, primary actions, and focus. Rust appears only with explicit overdue text.

| Token             | Value                    | Role                                 |
| ----------------- | ------------------------ | ------------------------------------ |
| `--canvas`        | `oklch(0.975 0.012 188)` | Cool-teal workspace                  |
| `--surface`       | `oklch(1 0 0)`           | Ledger, form, and navigation surface |
| `--surface-muted` | `oklch(0.955 0.02 188)`  | Grouping rails and icon wells        |
| `--teal`          | `oklch(0.48 0.11 188)`   | Primary actions and direction lines  |
| `--teal-deep`     | `oklch(0.29 0.07 188)`   | Active navigation and strong labels  |
| `--ink`           | `oklch(0.2 0.02 188)`    | Primary text                         |
| `--muted`         | `oklch(0.46 0.025 188)`  | Secondary text                       |
| `--overdue`       | `oklch(0.52 0.16 38)`    | Overdue only                         |

Lent and borrowed are always distinguished by words and directional icons, never color alone.

## Icon language

Borrowed uses one typed inline-SVG vocabulary with a 24×24 view box, 1.8px rounded strokes and `currentColor`. Page headings, navigation, actions, selectors, filters, empty states, recovery paths and loan statuses all use semantic icons from this vocabulary. No icon font or third-party icon dependency is used.

Icons support recognition and never replace required wording. Interactive controls keep visible translated labels; their SVGs are hidden from assistive technology. Feature code uses shared state-to-icon mappings for scope, filters, loan type and direction instead of repeating conditions in templates.

## Type and geometry

One system humanist sans carries the complete product. Page titles are 32px, detail titles 24–32px, section headings 16–18px, body and controls 16px, and metadata 12–14px. Tracking never exceeds `-0.03em`.

The spacing system uses 4px micro steps and an 8px base. Controls use a 10px radius, real panels may use 14px, and circular/pill geometry is reserved for avatars, status, and Add. Open rows with separators are preferred to cards.

## Shell and information architecture

Mobile and tablet below 70rem (1120px) use a compact white brand bar and white bottom navigation: Home, Records, Add, Search, More. Desktop switches at 70rem to one horizontal white header with Home, Records, People, History, search, settings, language, and Add record. The truthful local-device state sits in the footer.

Records is the unified active-record destination. Lent and Borrowed remain routes and direction scopes, not competing primary navigation systems.

Record scope, filter, and normalized search live in `scope`, `filter`, and `q` URL query parameters. Defaults are omitted, unrelated parameters survive changes, and browser history restores the visible state.

## Signature patterns

- Home begins with one connected four-part summary ribbon, then a dense handoff ledger and contextual due/people rail.
- Every open record displays the shared handoff line `You → Peter` or `Anna → You`; words and accessible copy carry direction as well as the arrow.
- Add reads as a sentence and renders a live record preview beside the form.
- Detail begins with the same handoff line, separates history/details from a contextual action rail, and keeps the next action visible.
- Lists, people, history, and navigation share one separated ledger-row vocabulary.
- Long record lists use `content-visibility` with a print-safe fallback; Home keeps attention and due-next IDs separate.
- Async page payloads use Angular resources, while Add, due-date, and repayment input use typed Signal Forms.
- Page titles use a compact mint icon well; section titles use a smaller unboxed symbol.
- Empty states use a context icon and keep one clear next action where appropriate.

## Motion and accessibility

State transitions last 160–200ms and only clarify selection, focus, hover, or completion. Reduced motion removes non-essential transitions. Every target is at least 44px, focus is visible against dark and light surfaces, and body/placeholder text meets WCAG AA contrast.

## Prohibited patterns

No gradients, glass, warm cream, wide shadows, nested cards, display serif, decorative badges, direction-by-color, invented sync/social features, or illustration data. Summary metrics are allowed only when they navigate to real records and remain part of one connected ledger ribbon.
