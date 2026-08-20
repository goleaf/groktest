# Design

## Product posture

Borrowed is a compact custody board. It helps a person see what is still away, act on the next handoff, and capture a new record in seconds.

Physical scene: the user is standing in a hallway or garage doorway in daylight, using one hand while an object changes hands. The interface should feel like a durable equipment label: immediate, high-contrast, and calm.

## Visual identity

The dark forest frame identifies the tool; the cool near-white work surface keeps records readable. Desaturated mint groups related controls. Mineral blue marks the primary action and focus. Coral appears only with explicit overdue text.

| Token             | Value                    | Role                                |
| ----------------- | ------------------------ | ----------------------------------- |
| `--canvas`        | `oklch(0.975 0.004 164)` | Cool-neutral workspace              |
| `--paper`         | `oklch(1 0 0)`           | Inputs and record surfaces          |
| `--chrome`        | `oklch(0.19 0.045 164)`  | Mobile frame and desktop navigation |
| `--chrome-raised` | `oklch(0.27 0.052 164)`  | Selected navigation                 |
| `--mint`          | `oklch(0.94 0.025 164)`  | Grouping rails and icon wells       |
| `--ink`           | `oklch(0.19 0.025 164)`  | Primary text                        |
| `--muted`         | `oklch(0.43 0.022 164)`  | Secondary text                      |
| `--action`        | `oklch(0.55 0.19 255)`   | Primary actions and focus           |
| `--overdue`       | `oklch(0.57 0.19 29)`    | Overdue only                        |

Lent and borrowed are always distinguished by words and directional icons, never color alone.

## Type and geometry

One system humanist sans carries the complete product. Page titles are 32px, detail titles 24–32px, section headings 16–18px, body and controls 16px, and metadata 12–14px. Tracking never exceeds `-0.03em`.

The spacing system uses 4px micro steps and an 8px base. Controls use a 10px radius, real panels may use 14px, and circular/pill geometry is reserved for avatars, status, and Add. Open rows with separators are preferred to cards.

## Shell and information architecture

Mobile uses a dark compact brand bar and dark bottom navigation: Home, Records, Add, Search, More. Desktop switches at 880px to a 248px dark rail with Home, Records, Search, People, History, Add record, Settings, and the truthful local-device state.

Records is the unified active-record destination. Lent and Borrowed remain routes and direction scopes, not competing primary navigation systems.

## Signature patterns

- Home begins with one action-ready handoff tag, then a single open-record count rail and open rows.
- Add reads as a sentence: `I lent an item`, followed by who and what moved.
- Detail begins with an asset marker, direction sentence, person, state, and action before metadata.
- Lists, people, history, and navigation share one open-row vocabulary.

## Motion and accessibility

State transitions last 160–200ms and only clarify selection, focus, hover, or completion. Reduced motion removes non-essential transitions. Every target is at least 44px, focus is visible against dark and light surfaces, and body/placeholder text meets WCAG AA contrast.

## Prohibited patterns

No gradients, glass, warm cream, wide shadows, nested cards, metric dashboards, display serif, decorative badges, direction-by-color, or invented illustration data.
