# Borrowed semantic icon system

## Goal

Give every important navigation, action, status, filter, page heading, empty state and settings group a consistent icon while keeping Borrowed calm, legible and fast.

## Design direction

Borrowed keeps its existing 24-by-24 outline vocabulary: `currentColor`, 1.8px strokes, rounded joins and no external icon package. New symbols are added to the shared `Icon` component so every screen uses the same geometry and rendering path.

Icons support recognition; they never replace necessary text. Repeated content rows use one leading asset/direction icon and one trailing navigation cue. Dense chips and segmented controls use compact 16px icons. Page titles and empty states use larger icon wells to establish hierarchy without adding cards or illustration.

## Coverage contract

| Surface                       | Icon treatment                                                     |
| ----------------------------- | ------------------------------------------------------------------ |
| Application navigation        | Existing destination icons remain consistent on mobile and desktop |
| Page headings                 | Shared heading pattern with one semantic leading icon              |
| Primary and secondary actions | Leading action icon plus visible translated label                  |
| Direction and asset selectors | `lent`, `borrowed`, `item`, and `money` icons                      |
| Scope and filters             | Registry-driven icon mapping for all/items/money/overdue/due soon  |
| Empty and missing states      | Context-specific icon well and optional icon-bearing action        |
| Loan state                    | Calendar, overdue, money remaining, and completed icons            |
| Settings                      | Settings, money, language, device, download, and information icons |
| Errors and guidance           | Warning or information icon with translated text                   |

## Component boundaries

- `Icon` owns SVG geometry and the closed `IconName` union.
- `icon-for.ts` maps domain/UI states to icons. Feature components do not repeat mapping conditions.
- `PageHeading` owns the repeated page-title icon, title and introduction layout.
- `EmptyState` accepts a context icon and action icon so every empty route communicates its purpose.
- Existing buttons, links, filters and status rows compose `Icon`; no icon-specific business logic enters templates.

## Accessibility

All SVGs remain `aria-hidden` and `focusable="false"`. Interactive controls retain translated visible labels and accessible names. State continues to be communicated by text as well as icons. Touch targets remain at least 44px, focus rings remain visible, and motion respects `prefers-reduced-motion`.

## Responsive behavior

Page-heading icon wells are 40px on phones and 44px on wider screens. Compact filter icons do not force horizontal overflow. At 320px, label text may wrap but icons never shrink. Empty-state icons remain centered and do not increase the vertical footprint enough to push the main action below the first viewport unnecessarily.

## Verification

- Unit tests verify the complete icon vocabulary and state-to-icon mappings.
- Component tests verify page headings, empty states and representative icon coverage.
- The complete Angular test, lint, typecheck and production-build gates run after implementation.
- Chrome checks cover 320, 390, 768 and 1440px, keyboard-visible controls, accessibility names, overflow and console output.

## Out of scope

No external icon dependency, icon font, raster artwork, animation library, theme rewrite or domain behavior change is introduced.
