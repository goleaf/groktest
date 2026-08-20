# Navigation

Navigation follows the questions users ask, not the underlying Loan table.

## Phone

Five thumb-reachable destinations:

| Destination | Route      | Responsibility                                                     |
| ----------- | ---------- | ------------------------------------------------------------------ |
| Home        | `/`        | Urgent/open summary and next actions                               |
| Records     | `/records` | One searchable/filterable active list with All/Lent/Borrowed scope |
| Add         | `/add`     | Primary create action, visually central                            |
| Search      | `/search`  | Find active or historic content on device                          |
| More        | `/more`    | People, History and Settings                                       |

Why: separate Lent and Borrowed tabs duplicated one list and consumed navigation capacity. Direction remains visible by words and icons, and is one tap away in Records. Search is first-class because finding “Peter/drill/€50” is a core retrieval task. Add remains a labeled destination, not an unlabeled floating button.

## Desktop/tablet

The persistent workspace rail exposes Home, Records, Search, People, History and Settings plus a labeled Add button. It does not invent a different workflow; it unwraps the More grouping when space permits. Content uses wider/two-column composition where useful.

## Secondary screens

- `/loans/:id`: details, activity, return/repayment.
- `/people/:id`: that person’s open balances and history.
- `/lent` and `/borrowed`: retained lazy routes for direct links/shortcuts; primary navigation uses scoped Records.
- Unknown paths redirect to Home.

Person selection and creation remain inline in Add. Optional due date/note use one disclosure. There are no modal chains. Browser/OS back works; pushed screens include an understandable route back where needed.
