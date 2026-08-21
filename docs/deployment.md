# Production deployment

Borrowed is deployed as a static Angular PWA at
[`https://borrowed.miniserver.fun`](https://borrowed.miniserver.fun). The production host does not
build the application and does not store Borrowed records. User data remains in the browser's
origin-scoped IndexedDB database.

## Release contract

1. Local changes are committed and pushed to `origin/main`.
2. `.github/workflows/ci.yml` runs the dependency audit, lint, deployment contracts, Angular tests,
   typecheck, production build, Capacitor sync, and Android build.
3. A successful `main` push uploads `borrowed-web-<sha>.tar.gz` and its checksum.
4. `.github/workflows/deploy-production.yml` first requires that the successful run's SHA is still
   the live `main` SHA, then downloads that exact artifact, verifies it, transfers it through pinned
   SSH, checks live `main` again, and activates it atomically.
5. A stale successful run is a recorded no-op. A GitHub ref lookup failure, failed CI run, checksum,
   transfer, validation, or health check cannot replace the last healthy release.

An unpushed local commit is intentionally invisible to production. Pull requests and non-`main`
branches run CI but never receive production credentials and never deploy.

The two live-ref checks prevent out-of-order CI completion from rolling production backward. The
first check runs without production secrets; the second runs immediately before the remote
activator. Manual rollback is intentionally exempt because selecting an older retained release is
its explicit operator-controlled purpose.

## GitHub production environment

The repository environment is named `production` and is restricted to `main`.

Environment secrets:

| Name                 | Value                                               |
| -------------------- | --------------------------------------------------- |
| `DEPLOY_SSH_KEY`     | Dedicated Ed25519 private key for `borrowed-deploy` |
| `DEPLOY_KNOWN_HOSTS` | Pinned OpenSSH host record for `miniserver.fun`     |

Environment variables:

| Name             | Value                                  |
| ---------------- | -------------------------------------- |
| `DEPLOY_HOST`    | `miniserver.fun`                       |
| `DEPLOY_PORT`    | `22`                                   |
| `DEPLOY_USER`    | `borrowed-deploy`                      |
| `DEPLOY_PATH`    | `/www/wwwroot/borrowed.miniserver.fun` |
| `PRODUCTION_URL` | `https://borrowed.miniserver.fun`      |

The initially supplied root credential is a bootstrap credential only. It must not appear in GitHub,
the repository, an artifact, or a command log. Rotate it through the owner's aaPanel/SSH recovery
process after verifying a separate administration path.

## Server layout and ownership

```text
/www/wwwroot/borrowed.miniserver.fun/       root:root
├── .well-known/                            aaPanel/Let's Encrypt
└── deploy/                                 borrowed-deploy:www
    ├── current -> releases/<sha>
    ├── releases/
    │   ├── bootstrap/
    │   └── <sha>/
    └── shared/
        └── incoming/
```

`borrowed-deploy` is password-locked, has no sudo permission, and owns only `deploy/`. Its
`authorized_keys` entry uses OpenSSH `restrict`, disabling forwarding, PTY allocation, and user RC
execution. aaPanel's site root, ACME directory, certificate files, and Nginx configuration remain
root-owned.

The Nginx vhost is sourced from `deploy/nginx/borrowed.miniserver.fun.conf`. aaPanel may rewrite a
vhost when settings are saved in the panel; compare the live file with the repository copy after any
panel-side site change. Bootstrap leaves a timestamped sibling backup of the previous vhost.

## Release activation

`deploy/activate-web-release.sh` accepts only the fixed production root/domain, a lowercase
40-character commit SHA, and an incoming directory with a constrained name. It verifies the archive
checksum and paths before extraction, rejects link entries, validates the PWA files and release
marker, then switches `deploy/current` with a same-filesystem atomic rename.

The public health check bypasses the Angular service worker and requires the exact release marker.
If the check fails after switching, the script restores the previous symlink. The active release and
the five newest inactive SHA releases are retained. Cleanup happens after health succeeds and is
best-effort, so cleanup ownership drift cannot invalidate a healthy release.

## Manual rollback

Open GitHub Actions, select **Deploy production**, choose **Run workflow**, and enter the complete
40-character SHA of a retained release. The rollback job transfers and hash-verifies the repository
rollback script, switches atomically, verifies `release.json`, and restores the former symlink if the
target is unhealthy.

Read-only server inspection:

```bash
readlink /www/wwwroot/borrowed.miniserver.fun/deploy/current
find /www/wwwroot/borrowed.miniserver.fun/deploy/releases \
  -mindepth 1 -maxdepth 1 -type d -printf '%f\n'
```

## Verification

Repository gates:

```bash
pnpm audit --audit-level high
pnpm lint
pnpm test:deployment
pnpm test
pnpm typecheck
pnpm build
```

Public checks:

```bash
curl --fail --head http://borrowed.miniserver.fun/
curl --fail --head https://borrowed.miniserver.fun/
curl --fail --header 'ngsw-bypass: true' https://borrowed.miniserver.fun/release.json
curl --fail --head https://borrowed.miniserver.fun/ngsw.json
curl --fail --head https://borrowed.miniserver.fun/history
```

Expected properties:

- HTTP redirects to HTTPS.
- HTTPS uses the `borrowed.miniserver.fun` certificate.
- `release.json` equals the SHA reported by GitHub's successful deployment.
- `index.html`, `release.json`, and Angular service-worker metadata are not browser-cached.
- hashed JavaScript and CSS assets are immutable-cached.
- a deep Angular route returns the application shell.
- browser console and network checks are clean in disposable mobile and desktop contexts.

Nginx logs are `/www/wwwlogs/borrowed.miniserver.fun.log` and
`/www/wwwlogs/borrowed.miniserver.fun.error.log`. Deployment failures are recorded in the matching
GitHub Actions run without printing private key material.

## Recovery boundaries

- Deploying new static files does not clear or migrate browser IndexedDB.
- Clearing site data, changing the origin, or uninstalling the PWA can still remove local-only data.
- Rollback changes the application shell only; it does not roll browser data backward.
- If GitHub Actions is unavailable, leave the last healthy `current` symlink in place rather than
  copying files directly into it.
- If aaPanel certificate renewal changes only certificate files, no application deployment is
  required. If aaPanel rewrites the vhost, restore the repository vhost only after `nginx -t` passes.
