# Borrowed Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically deploy every successfully tested `main` push to the Borrowed aaPanel site
through a least-privilege SSH account with atomic activation and rollback.

**Architecture:** GitHub CI creates a SHA-bound Angular production archive only for `main` pushes.
A second workflow downloads the artifact from that exact successful run, verifies it, and invokes the
tested release activator over pinned SSH. Nginx serves an atomic `deploy/current` symlink while aaPanel
certificate files and `.well-known` remain root-owned.

**Tech Stack:** Angular 22, pnpm 10, Node 22, GitHub Actions, Bash, OpenSSH, aaPanel, Nginx 1.31,
Playwright, Chrome DevTools MCP.

---

## File map

- Modify `.github/workflows/ci.yml`: retain all quality jobs and upload the exact web artifact.
- Create `.github/workflows/deploy-production.yml`: automatic deployment and manual SHA rollback.
- Modify `package.json`: expose deployment contract tests as `pnpm test:deployment`.
- Create `deploy/deployment-contract.test.mjs`: executable workflow/script/Nginx contracts.
- Create `deploy/package-web-release.sh`: validate and package `dist/borrowed/browser`.
- Create `deploy/activate-web-release.sh`: verify, extract, switch, health-check, rollback, retain.
- Create `deploy/rollback-web-release.sh`: manually reactivate a retained commit safely.
- Create `deploy/bootstrap-aapanel-server.sh`: one-time root provisioning with a restricted user.
- Create `deploy/nginx/borrowed.miniserver.fun.conf`: reproducible static PWA vhost.
- Create `docs/deployment.md`: operator workflow, secret rotation, verification, and rollback.
- Format `src/app/features/lists/list-page.ts`: repair the pre-existing CI formatting failure.
- Format `src/app/features/people/person-page.ts`: repair the pre-existing CI formatting failure.

## Task 1: Restore the existing CI formatting gate

**Files:**

- Modify: `src/app/features/lists/list-page.ts`
- Modify: `src/app/features/people/person-page.ts`

- [ ] **Step 1: Reproduce the baseline failure**

Run:

```bash
pnpm lint
```

Expected: ESLint passes and Prettier reports exactly the two files above.

- [ ] **Step 2: Apply only mechanical formatting**

Run:

```bash
pnpm exec prettier --write \
  src/app/features/lists/list-page.ts \
  src/app/features/people/person-page.ts
```

- [ ] **Step 3: Verify the root cause is removed without behavior changes**

Run:

```bash
pnpm lint
git diff --check
git diff --word-diff=porcelain -- \
  src/app/features/lists/list-page.ts \
  src/app/features/people/person-page.ts
```

Expected: lint exits 0 and the diff contains formatting-only changes.

- [ ] **Step 4: Commit**

```bash
git add -- src/app/features/lists/list-page.ts src/app/features/people/person-page.ts
git commit -m "style: format list and people pages"
```

## Task 2: Add failing deployment contracts

**Files:**

- Create: `deploy/deployment-contract.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Register the Node test command**

Add this script after `test` in `package.json`:

```json
"test:deployment": "node --test deploy/deployment-contract.test.mjs"
```

- [ ] **Step 2: Write contract tests before production scripts**

The test suite must use only `node:assert`, `node:fs`, `node:os`, `node:path`, `node:test`, and
`node:child_process`. It must assert these observable contracts:

```javascript
test('all deployment shell scripts pass bash syntax validation', () => {
  for (const script of scripts) {
    assert.equal(existsSync(script), true, `${relative(repoRoot, script)} must exist`);
    execFileSync('bash', ['-n', script]);
  }
});

test('the packager rejects a non-SHA release id', () => {
  const result = spawnSync('bash', [packageScript, 'main', fixtureBuild, fixtureOutput]);
  assert.notEqual(result.status, 0);
});

test('the packager emits a verified SHA-bound PWA archive', () => {
  const result = spawnSync('bash', [packageScript, sha, fixtureBuild, fixtureOutput]);
  assert.equal(result.status, 0, result.stderr.toString());
  assert.equal(existsSync(join(fixtureOutput, `borrowed-web-${sha}.tar.gz`)), true);
  assert.equal(existsSync(join(fixtureOutput, `borrowed-web-${sha}.tar.gz.sha256`)), true);
});

test('CI uploads artifacts only for main push events', () => {
  const workflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
});

test('production deployment requires a successful main push workflow', () => {
  const workflow = readFileSync(join(repoRoot, '.github/workflows/deploy-production.yml'), 'utf8');
  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /github\.event\.workflow_run\.event == 'push'/);
  assert.match(workflow, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(workflow, /environment:\s*\n\s*name: production/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('the Nginx vhost preserves ACME and serves the atomic release', () => {
  const config = readFileSync(join(repoRoot, 'deploy/nginx/borrowed.miniserver.fun.conf'), 'utf8');
  assert.match(config, /root \/www\/wwwroot\/borrowed\.miniserver\.fun\/deploy\/current;/);
  assert.match(config, /well-known\/borrowed\.miniserver\.fun\.conf/);
  assert.match(config, /try_files \$uri \$uri\/ \/index\.html;/);
  assert.doesNotMatch(config, /enable-php/);
  assert.doesNotMatch(config, /TLSv1\.1/);
});
```

Fixture setup creates `index.html`, `manifest.webmanifest`, `ngsw.json`, `ngsw-worker.js`, and one
hashed JavaScript file in a temporary build directory. `after()` removes only that exact temporary
directory.

- [ ] **Step 3: Verify RED**

Run:

```bash
pnpm test:deployment
```

Expected: FAIL because the four deployment scripts and production workflow do not yet exist.

- [ ] **Step 4: Commit the verified failing contracts**

```bash
git add -- package.json deploy/deployment-contract.test.mjs
git commit -m "test(deploy): define production release contracts"
```

## Task 3: Implement release packaging and activation

**Files:**

- Create: `deploy/package-web-release.sh`
- Create: `deploy/activate-web-release.sh`
- Create: `deploy/rollback-web-release.sh`

- [ ] **Step 1: Implement the packager**

`package-web-release.sh` must use `set -Eeuo pipefail`, accept exactly
`<sha> <build-directory> <output-directory>`, require a lowercase 40-character SHA, check the five
PWA files from Task 2, require `<head>` in `index.html`, copy to an isolated temporary directory, add
`release.json`, add `<meta name="borrowed-release" content="<sha>">`, create
`borrowed-web-<sha>.tar.gz`, and write a basename-only SHA-256 manifest.

The archive command is:

```bash
tar --sort=name --mtime='UTC 1970-01-01' --owner=0 --group=0 --numeric-owner \
  -C "$package_directory" -czf "$archive" .
(
  cd "$output_directory"
  sha256sum "$(basename "$archive")" > "$(basename "$archive").sha256"
)
```

- [ ] **Step 2: Implement safe activation**

`activate-web-release.sh` must accept `--root`, `--sha`, `--staging-dir`, and `--url`; require the
fixed root and HTTPS URL from the specification; require user `borrowed-deploy`; validate staging
under `<root>/deploy/shared/incoming/`; verify the archive checksum; reject absolute or parent
traversal tar entries; extract with `--no-same-owner --no-same-permissions`; validate required PWA
files and `release.json`; atomically switch `deploy/current`; and use:

```bash
curl --fail --silent --show-error --location --retry 3 --retry-all-errors \
  --connect-timeout 5 --max-time 20 \
  --header 'ngsw-bypass: true' \
  "${production_url}/release.json"
```

The returned JSON must equal `{"sha":"<sha>"}`. On failure after the switch, restore the prior
symlink atomically before exiting non-zero. Keep the active release plus the five newest other SHA
directories. Cleanup of validated staging and old releases is best-effort after a healthy check.

- [ ] **Step 3: Implement manual rollback**

`rollback-web-release.sh` accepts `--root`, `--sha`, and `--url`, applies the same strict validation,
requires an existing `deploy/releases/<sha>/release.json`, switches atomically, verifies the exact
release JSON, and restores the former symlink when health verification fails.

- [ ] **Step 4: Verify GREEN for scripts**

Run:

```bash
pnpm test:deployment -- --test-name-pattern='shell scripts|packager'
bash -n deploy/package-web-release.sh
bash -n deploy/activate-web-release.sh
bash -n deploy/rollback-web-release.sh
```

Expected: the script and packaging tests pass; workflow/Nginx tests remain RED.

- [ ] **Step 5: Commit**

```bash
git add -- deploy/package-web-release.sh deploy/activate-web-release.sh deploy/rollback-web-release.sh
git commit -m "feat(deploy): add atomic web release scripts"
```

## Task 4: Add CI artifact and production workflows

**Files:**

- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy-production.yml`

- [ ] **Step 1: Extend CI without weakening gates**

Add `permissions: contents: read`; run `pnpm test:deployment` before the application test; after the
existing production build, package only when:

```yaml
if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

Upload `release/borrowed-web-${{ github.sha }}.tar.gz` and its checksum with
`actions/upload-artifact@v4`, `if-no-files-found: error`, and `retention-days: 14`. Keep the Android
job unchanged and mandatory.

- [ ] **Step 2: Create the automatic deployment workflow**

Use:

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
  workflow_dispatch:
    inputs:
      release_sha:
        description: Retained 40-character commit SHA to reactivate
        required: true
        type: string

concurrency:
  group: borrowed-production
  cancel-in-progress: false
```

The automatic job condition requires successful CI, event `push`, and branch `main`. It uses
`actions/download-artifact@v5` with the triggering `run-id`, exact SHA artifact name, repository, and
`github-token`. It verifies the checksum locally, installs the key and pinned host file at mode 600,
validates all GitHub variables against allowlists, uploads to a unique incoming directory, compares
the local and remote activator SHA-256, and invokes the activator. The manual job transfers and
hash-verifies `rollback-web-release.sh` before reactivating the requested retained SHA.

- [ ] **Step 3: Verify workflow contracts**

Run:

```bash
pnpm test:deployment -- --test-name-pattern='CI uploads|production deployment'
pnpm exec prettier --check .github/workflows/ci.yml .github/workflows/deploy-production.yml
```

Expected: both workflow tests and Prettier pass.

- [ ] **Step 4: Commit**

```bash
git add -- .github/workflows/ci.yml .github/workflows/deploy-production.yml
git commit -m "ci: deploy successful main builds to production"
```

## Task 5: Add the aaPanel bootstrap and Nginx contract

**Files:**

- Create: `deploy/bootstrap-aapanel-server.sh`
- Create: `deploy/nginx/borrowed.miniserver.fun.conf`

- [ ] **Step 1: Create the static PWA vhost**

Use separate HTTP and HTTPS server blocks. HTTP preserves the aaPanel `well-known` include and
redirects all other requests. HTTPS uses the existing certificate paths, TLS 1.2/1.3, no PHP include,
`deploy/current` as root, exact no-cache locations for the Angular shell/service-worker metadata,
immutable caching for hashed JS/CSS, short caching for media, SPA fallback, and these headers:

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), geolocation=(), microphone=()" always;
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; manifest-src 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:" always;
add_header_inherit merge;
```

- [ ] **Step 2: Create one-time root bootstrap**

`bootstrap-aapanel-server.sh` accepts `--public-key-file` and `--nginx-config-file`, validates both,
creates or updates password-locked `borrowed-deploy`, installs the key with `restrict`, creates only
the `deploy/` subtree as `borrowed-deploy:www`, makes a bootstrap release from the existing placeholder,
backs up the vhost, installs the repository configuration, runs `nginx -t`, restores on failure, and
reloads Nginx only after success.

- [ ] **Step 3: Verify Nginx and bootstrap contracts**

Run:

```bash
bash -n deploy/bootstrap-aapanel-server.sh
pnpm test:deployment -- --test-name-pattern='Nginx|shell scripts'
```

Expected: all targeted contracts pass.

- [ ] **Step 4: Commit**

```bash
git add -- deploy/bootstrap-aapanel-server.sh deploy/nginx/borrowed.miniserver.fun.conf
git commit -m "feat(deploy): provision hardened aaPanel hosting"
```

## Task 6: Document operations and verify the complete local change

**Files:**

- Create: `docs/deployment.md`

- [ ] **Step 1: Write the operator guide**

Document the push-to-main contract, GitHub environment names, exact non-secret variables, secret
rotation, directory ownership, automated rollback, manual rollback dispatch, aaPanel vhost drift,
release retention, log locations, and the fact that IndexedDB stays on each browser origin.

- [ ] **Step 2: Run all local gates**

Run sequentially:

```bash
pnpm audit --audit-level high
pnpm lint
pnpm test:deployment
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected: every command exits 0; audit has no high or critical finding; 42 Angular test files and 190
tests pass before any concurrent upstream additions are incorporated.

- [ ] **Step 3: Review security and scope**

Run:

```bash
git diff main...HEAD --check
git diff main...HEAD --stat
git log --oneline main..HEAD
git grep -nE 'BEGIN .* PRIVATE KEY' main..HEAD -- .
```

Expected: no secret match, no unrelated source behavior changes, and only the mapped files differ.

- [ ] **Step 4: Commit**

```bash
git add -- docs/deployment.md
git commit -m "docs: add production deployment runbook"
```

## Task 7: Provision production, publish, and prove deployment

**Files:**

- No additional repository files expected.

- [ ] **Step 1: Create and install the dedicated key**

Generate a temporary Ed25519 key without a passphrase, transfer the bootstrap script, Nginx config,
and public key through the pinned root SSH session, execute bootstrap, verify the account has no sudo,
then delete the temporary local private/public key after GitHub stores the private key.

- [ ] **Step 2: Configure the GitHub production environment**

Create `production`; set environment secrets `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS`; set variables
`DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_PATH`, and `PRODUCTION_URL` to the exact values in
the design. Restrict the environment deployment branch policy to `main` when the repository plan
supports it.

- [ ] **Step 3: Integrate only attributable commits**

Re-check both worktrees, preserve all unrelated staged/unstaged paths, fast-forward the local `main`
to the verified deployment branch, and push normally to `origin/main` without force.

- [ ] **Step 4: Monitor exact CI and deployment runs**

Wait for the CI run whose `headSha` matches the pushed commit. Require both jobs and the whole workflow
to conclude `success`. Then require the triggered deployment run to conclude `success` for the same
SHA. Investigate any failure from logs before changing code or server state.

- [ ] **Step 5: Verify server state and HTTPS**

Check the `deploy/current` symlink, release marker, file ownership, inability of `borrowed-deploy` to
sudo or write outside `deploy/`, `nginx -t`, zero new Nginx errors, TLS certificate, HTTP redirect,
security headers, no-cache service-worker metadata, immutable hashed assets, and a deep SPA route.

- [ ] **Step 6: Verify in disposable browsers**

Use Playwright and Chrome DevTools MCP with isolated profiles at 390x844 and 1440x1000. Verify one
`main`, one `h1`, no horizontal overflow, a clean console, successful network responses, a registered
service worker/manifest, and displayed Borrowed content. Do not inspect IndexedDB record contents.

- [ ] **Step 7: Retire the disclosed bootstrap credential safely**

Confirm the disclosed root password is absent from the repository, GitHub configuration, shell
history, and deployment logs. Do not change or disable the user's only root administration path
without a separately verified recovery method. Report password rotation through aaPanel as the one
required owner action, while confirming routine deployment uses only the dedicated key.

## Final checkpoint

- [ ] The exact pushed SHA has green CI and green deployment runs.
- [ ] Production `deploy/current` resolves to that same SHA.
- [ ] Automatic rollback has a retained prior release and manual rollback is available.
- [ ] TLS, SPA, PWA, cache, security-header, console, network, responsive, and accessibility checks pass.
- [ ] The root password is absent from repository history and GitHub configuration, with owner
      rotation explicitly recorded as required.
- [ ] Original checkout's unrelated staged and concurrent work remains intact.
