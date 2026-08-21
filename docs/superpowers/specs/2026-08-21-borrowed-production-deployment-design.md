# Borrowed production deployment design

- **Date:** 2026-08-21
- **Status:** Approved for autonomous implementation
- **Production URL:** `https://borrowed.miniserver.fun`
- **aaPanel site root:** `/www/wwwroot/borrowed.miniserver.fun`

## Problem

Borrowed is an Angular 22 local-first PWA. The repository has CI quality gates but no production
deployment. The aaPanel site currently serves a placeholder directly from its webroot and enables
PHP even though Borrowed is a static application. A direct copy into the live directory could expose
a partially updated Angular service-worker manifest and hashed assets, while a server-side build
would make production depend on mutable Node and pnpm installations.

The desired contract is: each pushed commit to `main` runs the complete CI suite, and only a commit
whose CI succeeds is deployed automatically to the production domain. Local commits that have not
been pushed remain local and cannot affect production.

## Goals

- Deploy the exact production artifact built and tested by the successful `main` workflow run.
- Activate releases atomically so Angular service-worker clients never observe a partial release.
- Use a dedicated, password-locked, non-sudo SSH principal for routine deployment.
- Preserve aaPanel certificate management and the existing ACME challenge path.
- Roll back automatically when activation or HTTPS health verification fails.
- Keep a manual, commit-SHA-based rollback path and a bounded release history.
- Record GitHub deployment history without requiring manual approval for normal `main` pushes.
- Keep all credentials out of source, artifacts, logs, and browser bundles.

## Non-goals

- Deployment on unpushed local commits, feature branches, or pull requests.
- Server-side Node, pnpm, Angular, Capacitor, Electron, or Android builds.
- Adding a server API, remote database, authentication, analytics, or synchronization.
- Modifying Borrowed's IndexedDB data model or reseeding browser data.
- Replacing aaPanel certificate issuance or managing unrelated virtual hosts.

## Considered approaches

### 1. Tested artifact plus atomic SSH activation — selected

CI builds `dist/borrowed/browser`, packages it with the triggering commit SHA, publishes a short-lived
workflow artifact, and deploys that exact artifact over SSH. The server extracts it into
`deploy/releases/<sha>` and atomically switches `deploy/current` after validation. This provides
reproducibility, least privilege, and immediate rollback without production build dependencies.

### 2. Direct rsync into the live document root

This is smaller, but a visitor or Angular service worker can read a new `ngsw.json` alongside old
assets, or the reverse. Interrupted transfers leave production incomplete and rollback requires a
second full transfer. This approach is rejected.

### 3. Git pull and pnpm build on the server

This keeps source code and a mutable JavaScript toolchain in production, duplicates CI work, and can
produce a different artifact from the one tested by GitHub. It is rejected.

## Repository architecture

### CI workflow

`.github/workflows/ci.yml` remains the single `push` and `pull_request` quality workflow. Its web
quality job performs the existing frozen pnpm install, high-severity dependency audit, lint, tests,
typecheck, and production build. Its Android job remains mandatory. For `push` events on `main`, the
web job packages `dist/borrowed/browser` as `borrowed-web-<commit-sha>.tar.gz`, emits a matching
SHA-256 file, and uploads both as a workflow artifact. Pull requests never publish a deployable
artifact.

### Deployment workflow

`.github/workflows/deploy-production.yml` runs only when the `CI` workflow completes successfully for
a `push` to `main`, plus an explicit manual rollback mode. The automatic job downloads the artifact
from the exact triggering workflow run and verifies its SHA-256 before opening SSH. It uses a
`production` environment and a single concurrency group so two releases cannot mutate `current`
simultaneously.

The workflow sends the archive, checksum, and the repository-owned activation script to a unique
remote staging directory. The activation script is therefore the version from the tested commit,
not a stale server-side copy. Its own hash is checked after transfer before execution.

### Deployment scripts

`deploy/package-web-release.sh` validates a 40-character lowercase commit SHA, verifies the expected
Angular output files, creates a deterministic archive, and writes the checksum file.

`deploy/activate-web-release.sh` validates all external arguments before using them. It verifies the
archive checksum, extracts into a same-filesystem temporary directory, verifies `index.html`,
`ngsw.json`, `ngsw-worker.js`, and `manifest.webmanifest`, then renames the directory to
`deploy/releases/<sha>`. It records the previous symlink target, atomically replaces
`deploy/current`, and checks the public HTTPS URL with Angular service-worker bypass semantics. A
failed check restores the previous symlink before returning failure. Cleanup occurs only after
activation and cannot turn a healthy release into a failed deployment.

`deploy/rollback-web-release.sh` accepts only an existing 40-character release SHA beneath the fixed
release root, switches `deploy/current` atomically, and verifies HTTPS. If verification fails it
restores the prior target.

## Server architecture

The site directory becomes:

```text
/www/wwwroot/borrowed.miniserver.fun/
├── .well-known/                        # aaPanel/Let's Encrypt, root-owned and preserved
└── deploy/                             # only subtree writable by borrowed-deploy
    ├── current -> releases/<sha>       # Nginx document root
    ├── releases/
    │   └── <sha>/                      # immutable Angular production files
    └── shared/
        └── incoming/                   # per-run upload staging
```

Routine SSH access uses `borrowed-deploy`, a password-locked account with no sudo access and ownership
only of the `deploy/` subtree. The site root and `.well-known` remain root-owned, while Nginx can read
the release files through their group/world read bits. The initially supplied root access is used
only to provision the account, install its public key, set ownership and update this site's Nginx
configuration. Root credentials are never stored in GitHub and must be rotated after bootstrap.

The aaPanel vhost keeps its certificate paths and `well-known` include, changes `root` to
`deploy/current`, removes the PHP include, and adds:

- `try_files $uri $uri/ /index.html` for Angular client routes;
- no-cache headers for `index.html`, `ngsw.json`, worker scripts, and web manifest;
- long immutable caching for hashed JS, CSS, fonts, and media;
- a redirect from HTTP to HTTPS while retaining certificate validation;
- TLS 1.2/1.3 only and modern server-managed cipher defaults;
- HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame protection, and a restrictive static-app
  Content Security Policy compatible with the built bundle.

Before reload, the existing vhost and placeholder site are backed up and `nginx -t` must pass.

## Trust boundaries and abuse cases

| Boundary or asset | Abuse case                                 | Control                                                                   |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| GitHub event      | PR or branch deploys production            | Require successful `CI`, event `push`, branch `main`, exact `head_sha`    |
| Workflow artifact | Artifact is incomplete or changed          | Exact run ID, SHA-named artifact, archive SHA-256 verification            |
| SSH endpoint      | Host spoofing                              | Pin the observed ED25519 host key in a GitHub environment secret          |
| SSH key           | Key grants broad server access             | Dedicated key, password-locked non-sudo user, deploy-subtree ownership    |
| Script arguments  | Path traversal or shell injection          | Strict SHA, path, domain, and archive-name allowlists; quoted variables   |
| Release switch    | Interrupted copy exposes mixed files       | Extract and validate off-line, then same-filesystem atomic symlink rename |
| Health check      | Service worker hides a bad network release | HTTPS request with `ngsw-bypass`, status and release marker validation    |
| Cleanup           | Cleanup breaks a healthy deployment        | Bounded best-effort cleanup after successful health verification          |
| Browser data      | Deployment deletes private local data      | Preserve the origin; deploy static files only; never clear IndexedDB      |

The primary assets are production availability, the deploy SSH key, aaPanel configuration, and users'
origin-scoped IndexedDB data. The deployment adds no server-side copy of personal Borrowed records.

## Secrets and GitHub environment

The `production` environment stores only:

- `DEPLOY_SSH_KEY`: dedicated private Ed25519 key;
- `DEPLOY_KNOWN_HOSTS`: the pinned `miniserver.fun` host-key record.

Non-secret values are repository environment variables:

- `DEPLOY_HOST=miniserver.fun`;
- `DEPLOY_PORT=22`;
- `DEPLOY_USER=borrowed-deploy`;
- `DEPLOY_PATH=/www/wwwroot/borrowed.miniserver.fun`;
- `PRODUCTION_URL=https://borrowed.miniserver.fun`.

Workflow permissions are read-only except for `actions: read` and `deployments: write` where required.
No workflow prints secret values or enables shell tracing.

## Failure handling and rollback

- A failed CI run produces no production deployment.
- A failed download, checksum, SSH connection, extraction, or validation leaves `deploy/current`
  unchanged.
- A failed post-switch health check restores the prior `deploy/current` target.
- The manual workflow can reactivate any retained SHA without rebuilding.
- The currently active release and the five newest other releases are retained.
- Retention cleanup warnings are reported but do not roll back a healthy release.
- Nginx is changed only after a backup and successful `nginx -t`; a failed reload restores the vhost.

## Verification

### Local and CI gates

- Deployment contract tests fail before the scripts/workflow exist and pass after implementation.
- `bash -n` validates every shell script.
- `pnpm audit --audit-level high`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, and `pnpm build` pass.
- Android CI remains part of the required workflow.
- The production archive contains the PWA manifest, Angular worker, `ngsw.json`, and hashed assets.
- Secret scanning of the attributable diff finds no supplied password, private key, or token.

### Server and browser gates

- The dedicated user can deploy but cannot use sudo or write outside the `deploy/` subtree.
- `nginx -t` passes and aaPanel's ACME path remains available.
- HTTP redirects to HTTPS; HTTPS presents a certificate for `borrowed.miniserver.fun`.
- `/`, a deep Angular route, `ngsw.json`, and a hashed asset return the intended status and cache headers.
- The HTML contains the deployed commit marker.
- Playwright and Chrome DevTools use disposable contexts to verify mobile and desktop layouts, one
  main landmark, no horizontal overflow, successful network requests, and a clean console.
- The production `deploy/current` symlink and GitHub deployment both identify the exact tested
  commit.

## Acceptance criteria

1. A pushed `main` commit deploys only after the complete CI workflow succeeds.
2. A failed gate or failed health check cannot replace the last healthy release.
3. Production runs the exact artifact generated for the deployed commit SHA.
4. Routine automation has no root or sudo credential.
5. aaPanel TLS renewal and ACME validation remain intact.
6. Production passes HTTPS, SPA, PWA, cache, security-header, and disposable-browser checks.
7. Existing unrelated worktree changes remain unmodified and unpublished by this delivery.
