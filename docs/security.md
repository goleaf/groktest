# Security

## Threat model (Part 1)

Borrowed holds names, notes, and money amounts on one person’s device. There is no server, no public URL for records, and no other-user access path.

| Threat | Part 1 reality |
|---|---|
| Another Borrowed user reading my loans | Not possible; no API |
| Guessable IDs | UUIDv7, not sequential |
| XSS | Angular default sanitization; no `innerHTML` of user notes |
| SQL injection | No SQL; Dexie/IndexedDB |
| CSRF | No cookies/session against a server |
| Stolen laptop | Data is in IndexedDB in plaintext. Anyone with OS user access can read it |
| XSS in a malicious extension | Can read IndexedDB on this origin |
| Analytics leaking item names | No analytics |

## Honest boundary

**IndexedDB is not encrypted.** We do not claim device encryption. OS disk encryption (FileVault, device PIN) is the realistic control. A future optional app lock (biometrics) only hides the UI; it is not cryptographic protection of the database.

## Authentication

Local-only: no passwords, no tokens. Do not store secrets in `localStorage`. When accounts exist:

- Tokens go in Capacitor Preferences / Electron `safeStorage` / cookie+`Secure` on web
- Never in `localStorage`
- Passwords hashed only on a future server, with a mature library, never a custom KDF

## Authorization

When a server exists: every read/write is scoped to the authenticated account. Client-supplied IDs are not an access check. No sequential public IDs.

## Privacy

- Private by default
- No public profiles or feeds
- Logs must not include notes, amounts, names, or tokens
- Console errors should stay generic in production

## Attachments (future)

Treat photos as sensitive. Compress before store. Do not upload on a public bucket without auth. Failed upload must not delete the loan.

## Transport (future)

HTTPS only. No mixed content.

## Account deletion / export (future)

Deletion must define local wipe vs server wipe. Export is a user right; the schema is JSON-serializable.

## Device loss (future)

Recovery requires a synced account or a user-held export. Local-only mode cannot restore a smashed phone. Settings should say that clearly.

## Rate limiting / BOLA

Not applicable until an API exists. Design then: authenticated routes, no IDOR, standard rate limits.

## Dependencies

Prefer platform crypto (`crypto.getRandomValues`). No custom cryptography. No blockchain.
