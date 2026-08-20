# Borrowed production redesign

## Objective

Redesign every current Borrowed surface as one trustworthy personal utility. A user must be able to answer “where are my things?” and add a record in seconds on mobile, desktop, and the future Electron/Capacitor shells.

The redesign changes presentation and interaction structure only. It preserves the Angular application, route map, IndexedDB data model, domain commands, local-only promise, and existing English product language.

## Accepted direction

Use a bright, list-first product system: a pure white work surface, pale oxidized-teal navigation and grouping surfaces, deep ink typography, dark teal for selection and primary actions, and burnt coral exclusively for overdue state.

This direction was selected over a decorative tactile ledger and a dense command-center dashboard. The ledger would reintroduce paper/serif decoration; the command center would make a small personal tool feel like a CRM.

Concept references:

- Mobile home: `/Users/andrejprus/.codex/generated_images/01a01e35-8207-7213-9625-4affb12d0c15/exec-b4575a6b-5eb8-4609-b014-897f7b19f857.png`
- Desktop home: `/Users/andrejprus/.codex/generated_images/01a01e35-8207-7213-9625-4affb12d0c15/exec-938435cf-57d5-45a4-b445-01a62c247239.png`
- Mobile add: `/Users/andrejprus/.codex/generated_images/01a01e35-8207-7213-9625-4affb12d0c15/exec-c7074980-f2f1-4055-b42c-8fe0184f5bca.png`
- Mobile detail: `/Users/andrejprus/.codex/generated_images/01a01e35-8207-7213-9625-4affb12d0c15/exec-ae7b4018-417a-47f0-bd1a-6055098f3817.png`

The concept images define visual intent, hierarchy, palette, density, navigation model, and component anatomy. Exact generated pixels are not a reason to introduce fake data, new product features, or raster UI.

## Design system

### Color

- Canvas: true white.
- Navigation/group surface: a very pale neutral tinted toward hue 188.
- Ink: near-black teal with body contrast above 7:1 on white.
- Muted: readable teal-gray with at least 4.5:1 contrast.
- Primary: dark oxidized teal; used for primary action, current navigation, links, and focus.
- Overdue: burnt coral; never used to distinguish lent from borrowed.
- Success and warning states receive dedicated semantic tokens only when an existing workflow needs them.

### Typography

Use one system sans stack. Product chrome is 12–16px, body is 15–17px, page titles are 28–34px, and the urgent mobile title may reach 32px. Headings use balanced wrapping; prose uses pretty wrapping. No display serif, fluid marketing scale, or tracked uppercase scaffolding.

### Geometry and elevation

- 8px spacing base with 4px micro steps.
- 12px default radius; 16px maximum for true panels; full pill only for status and circular controls.
- Lists remain open rows with hairline separators.
- A component uses either a border or restrained small shadow, never a decorative border-plus-wide-shadow stack.

### Icons

Use one code-native SVG family with 24px view boxes, round joins/caps, and consistent 1.8–2px optical stroke. Icons clarify navigation, asset kind, date, note, person, and row affordance. Text labels remain present in primary navigation.

### Motion

State transitions use 160–200ms ease-out. Hover, selected, disclosure, and route feedback may animate opacity, color, or transform by a few pixels. Content is visible without animation. `prefers-reduced-motion` disables non-essential transition.

## App shell

### Mobile

Use a compact sticky brand bar and a five-item sticky bottom navigation. Add is the only elevated primary action. The main content scrolls between them and includes safe-area padding. Every target is at least 44px.

### Desktop

At 800px and above, switch structurally to a 232px left rail and a fluid content column. The rail contains brand, navigation, Add, and the local-device promise. The main column must never collapse into the rail. Home may use a narrow supporting rail only for existing product explanation; functional content retains a readable 760–900px measure.

## Screens

### Home

Home answers the core question before showing navigation. Show the most urgent record as a compact attention band, followed by one structured summary rail and grouped lists for “Needs attention” and “Open loans.” Do not render a metric-card grid. Rows expose person/item or money, direction, due context, status, and open affordance.

Empty Home explains what the app remembers and provides one Add action.

### Lent, Borrowed, History, and People

Use the same page header and row family. Each list has an explicit empty state. Rows show a stable leading avatar or asset marker, primary label, compact secondary context, due/status metadata, and chevron. Data already loaded by the feature service remains the only source.

### Add

Keep the current single-page form. Present direction and asset kind as two accessible segmented controls, then the required person and asset fields. Recent people remain quick-fill buttons. Due date and note stay in progressive disclosure. The submit action spans the mobile content width and has visible saving, disabled, error, and focus states.

### Detail

Show route context, direction, asset/title, person, status/due date, remaining amount where applicable, primary completion or repayment action, note/details, and history in that order. Item completion uses “Mark as returned.” Money repayment remains an inline form. History is a semantic timeline, not a decorative card.

### More and Settings

More is a navigation list using the shared row primitive. Settings uses a compact settings group, readable local-storage warning, and consistent form controls.

## Component boundaries

- `Icon` owns the shared SVG vocabulary.
- `Shell` owns desktop/mobile navigation and layout only.
- `LoanRow` owns reusable loan-row presentation and derives display metadata from existing application services.
- Feature pages own headings, grouping, and feature-specific empty/action state.
- Global SCSS owns tokens, shell, shared primitives, responsive rules, and state variants. Feature templates do not contain business logic.
- Existing `BorrowedApp` methods remain the only data/command boundary. No new persistence queries or duplicated domain decisions are introduced for visual needs.

## Error and edge states

- Long names, item titles, currency values, and translated copy wrap without horizontal overflow.
- Missing detail records retain a clear recovery path.
- Save/repayment failures remain inline alerts associated with their action.
- Empty lists teach the relevant action.
- Disabled and saving controls remain legible and do not shift layout.
- Mobile keyboard, safe areas, reduced motion, and 200% text zoom must not hide required controls.

## Verification

- Run unit tests, Angular type/build validation, formatting check, and production build.
- In an isolated Chrome context verify Home, Lent, Borrowed, Add, Detail, More, History, People, and Settings.
- Verify at 390x844, a narrow 320px width, 768px tablet, and 1440x1000 desktop.
- Check console and failed network requests, keyboard focus, accessible names/landmarks, 44px primary targets, contrast, horizontal overflow, sticky shell behavior, form submission, record completion/repayment, and reduced motion.
- Compare the latest 390x844 and 1440x1000 screenshots directly with the concept references using `view_image` before handoff.

## Scope exclusions

No accounts, sync, reminders, notifications, contact import, photos, charts, backend, data-model change, or new product behavior belongs to this redesign. Search, filtering, and export code already present in the shared worktree may receive the same visual treatment, but its feature provenance remains outside the attributable redesign slice. Demo records are allowed only in isolated tests or explicit development fixtures; production initialization must preserve an empty first run and existing IndexedDB data.
