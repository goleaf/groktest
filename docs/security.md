# Security

## Data and trust model

Borrowed stores names, relationships, notes and money values. All are private. In Part 1 there is no server, public profile, analytics, ad SDK, account, cookie session or cross-user read path.

| Threat                              | Current control / honest boundary                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Guessable public records            | UUIDv7, but no public API; IDs are never treated as authorization                                     |
| XSS from user content               | Angular interpolation/escaping; no user-controlled `innerHTML` or runtime template                    |
| SQL injection                       | No SQL adapter; structured Dexie calls only                                                           |
| CSRF/BOLA/rate abuse                | No remote state endpoint; mandatory design controls below for a future API                            |
| Malicious dependency                | Lockfile, CI high-severity audit, minimal dependencies, Electron upgraded from vulnerable EOL release |
| Lost/unlocked device                | IndexedDB is readable by the OS user/profile; rely on OS device lock/disk protection                  |
| Browser extension/origin compromise | Can read origin IndexedDB; the app cannot defend against a privileged malicious extension             |
| Sensitive logs                      | Application does not log record bodies; generic UI errors only                                        |
| Native WebView cache                | Packaged assets and local database remain private only to the limits of OS app sandbox/device state   |

## Local storage

**IndexedDB is not encrypted by Borrowed.** No documentation or UI may imply otherwise. `localIdentityId` is an identifier, not a secret. Clearing browser site data or app data irreversibly removes local-only records unless the user exported them.

The app does not store authentication material in `localStorage`. There is currently no token. A future native token uses OS secure credential storage; a web session should prefer Secure, HttpOnly, SameSite cookies with CSRF protection where appropriate. Do not confuse Capacitor Preferences with cryptographic secure storage.

The Android shell disables automatic application backup until Borrowed has an explicit encrypted backup/restore contract. JSON export is the current deliberate user-controlled recovery path.

Optional biometric app lock is future defense against casual access, not database encryption or server authentication.

## Input and rendering controls

- Domain validates direction/kind, supported currency, positive bounded money, integer quantity, chronological dates and text limits.
- Repayment read-validation-write is transactional.
- UI messages map typed error codes; raw exception strings and database contents are not rendered.
- JSON export stringifies BigInt values explicitly and is started only by a user action.
- File upload does not exist. Future implementation validates type by content, size and image decode, strips unnecessary metadata, generates thumbnails, uses non-public object storage and authorizes every download.

## Future server requirements

- TLS only with secure headers; no mixed content.
- Mature authentication/session libraries and password hashing; no custom cryptography.
- Every model access scoped by authenticated account and policy. Client UUID ownership is verified on every read/write.
- Versioned request DTO validation and response resources; ORM rows are not the contract.
- CSRF protection for cookie-authenticated mutations, rate limits for auth/sync/file endpoints, token/device revocation and session rotation.
- Idempotent mutation receipts and optimistic version checks from `docs/sync.md`.
- Secrets only in environment-backed deployment configuration; never client bundles or logs.
- Logs contain event category, correlation ID, timing and sanitized failure code—not names, notes, amount, photos, credentials or mutation payloads.
- Account recovery has anti-enumeration, throttling and revocation semantics.

## Deletion and export

Current JSON export is a readable point-in-time copy containing private data; the browser download location is outside app control and the UI must say so when export UX is expanded.

Future deletion distinguishes: archive Loan, tombstone Loan, delete Person, clear one device, revoke Device, and delete Account. Account deletion requires authenticated confirmation, server retention policy, attachment cleanup and propagation of tombstones. Person removal never makes historical loans unintelligible.

## Device loss and recovery

Today, a lost device means lost local-only data unless an export exists. A future synced account can restore acknowledged data but not necessarily unsynced mutations. Device management must show last sync and allow revocation. Revocation stops future server access; it cannot erase an offline stolen device, so product copy must not promise remote wipe.

## Privacy and analytics

No data sale, public directory or content analytics. If privacy-aware product analytics is later added, it must be optional and content-free (`loan_created kind=money`, never names/notes/amounts). The product remains functional with analytics disabled.
