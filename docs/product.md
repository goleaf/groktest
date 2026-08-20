# Borrowed — product

Borrowed is a personal utility that remembers what you lent, what you borrowed, who has it, and what is still owed.

Core question:

> Where are my things, and what do I still owe other people?

## Target user

A person who lends a drill, borrows a ladder, or spots a friend €50 and does not want a spreadsheet, a bank, or a CRM.

They should understand the product in seconds and create a record in seconds.

## Problem

Informal lending is easy to forget. Accounting tools are too heavy. Notes apps have no due dates, remaining balances, or history.

## What Borrowed is

- A private list of loans (objects and money)
- Direction is always relative to **me**: I lent, or I borrowed
- History is kept when something is returned
- Money can be repaid in parts without rewriting the original amount

## What Borrowed is not

- ERP, bookkeeping, debt collection, banking, CRM, inventory, or project management
- A social network, public directory, or ranking
- Multi-tenant SaaS (no organisations, seats, or workspaces)
- A product that requires the other person to have an account

## Terminology

| Term               | Meaning                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **User**           | The person using this copy of the app. Local-only until they later choose a synced account. |
| **Person**         | A name on a loan (Peter, Mom, Neighbor). Not a registered user.                             |
| **Asset**          | What moved. v1 kinds: physical item, money. Other kinds may be added later.                 |
| **Loan**           | One temporary transfer between the user and a person. Not money-only.                       |
| **Direction**      | `lent` (they have mine / they owe me) or `borrowed` (I have theirs / I owe them).           |
| **Repayment**      | An append-only money event against a money loan. Never edits the original amount.           |
| **Loan event**     | A user-visible history entry (created, repaid, returned, …). Not a technical audit log.     |
| **Stored status**  | `active`, `completed`, `cancelled`, `archived`.                                             |
| **Derived status** | `overdue`, `due_soon`, `partially_repaid` — computed, never stored.                         |

## Core flows (Part 1)

1. Lend or borrow a physical item
2. Lend or borrow money
3. Mark an item returned (record stays, moves to history)
4. Record a partial or full money repayment
5. See what needs attention on Home
6. Find active or completed records locally
7. Review a person’s active/history records
8. Export a private JSON snapshot

## Initial scope (Part 1)

Foundation plus the four create paths, return, repayment, search/filters, people/history, JSON export, offline persistence, reload-safe add draft, installable PWA, Android/iOS shells, navigation, empty states and preferred currency.

## Out of scope (still designed for)

Reminders, notifications, photos, contact import, account/sync server, shared/confirmed loans, QR, AI, import and native SQLite. See `docs/roadmap.md`.
