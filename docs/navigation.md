# Navigation

## Choice

Five primary destinations, same on phone and desktop:

| Tab      | Route       | Job                            |
| -------- | ----------- | ------------------------------ |
| Home     | `/`         | What needs attention           |
| Lent     | `/lent`     | Active things/money I lent     |
| Add      | `/add`      | The main action                |
| Borrowed | `/borrowed` | Active things/money I borrowed |
| More     | `/more`     | History, People, Settings      |

Add is a first-class tab, not a hidden FAB-only control. A FAB may mirror it on Home, but the tab remains.

## Why not other layouts

- Four tabs without Add buries the only action that matters
- A hamburger on mobile hides Lent/Borrowed
- Separate desktop IA would split muscle memory

Wide screens keep the same five items (left rail) and may show list + detail for Lent/Borrowed. They do not gain extra modules.

## Secondary screens (push, not tabs)

- `/loans/:id` — details, return, repay
- `/history` — completed (and not archived)
- `/people` — person list
- `/people/:id` — that person’s loans
- `/settings` — preferred currency, local-only explanation

Person picker and “new person” live **inline on Add**, not as a stacked modal chain. Optional due date and note are a disclosure on the same screen.

## Back

Android/web back and an in-app back control on pushed screens. Tabs reset to their root.
