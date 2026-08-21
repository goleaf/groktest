# Stale Production Deploy Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent an out-of-order successful CI run from replacing production with an older `main` release.

**Architecture:** Add a pre-deployment GitHub ref gate and repeat the ref comparison immediately before SSH activation. Treat stale releases as safe no-ops while API failures remain blocking failures.

**Tech Stack:** GitHub Actions YAML, Bash, Node.js built-in test runner, pnpm

---

### Task 1: Lock the stale-run behavior with a deployment contract

**Files:**

- Modify: `deploy/deployment-contract.test.mjs`

- [ ] **Step 1: Write the failing contract test**

Add assertions that require a `freshness` job, an authenticated `gh api` lookup of
`refs/heads/main`, a deploy dependency on the freshness output, a second lookup before the remote
activator, and marker verification only when activation occurred.

- [ ] **Step 2: Prove the contract is red**

Run: `pnpm test:deployment`

Expected: FAIL because `.github/workflows/deploy-production.yml` has no live-main freshness gate.

### Task 2: Add the fail-closed deployment guards

**Files:**

- Modify: `.github/workflows/deploy-production.yml`
- Modify: `docs/deployment.md`

- [ ] **Step 1: Add the pre-deployment freshness job**

Use `gh api "repos/${GITHUB_REPOSITORY}/git/ref/heads/main" --jq .object.sha` with
`GH_TOKEN: ${{ github.token }}`. Export `release_is_current=true` only when the API SHA exactly
matches `workflow_run.head_sha`; otherwise export `false` and emit a notice.

- [ ] **Step 2: Gate the production deployment job**

Make `deploy` depend on `freshness` and run only when `release_is_current` is `true`. Leave manual
rollback independent of this job.

- [ ] **Step 3: Recheck immediately before activation**

After artifact transfer and hash comparison, query live `main` again. If the SHA has become stale,
remove the exact run-owned staging files, output `activated=false`, and exit successfully without
calling `activate-web-release.sh`. Otherwise activate and output `activated=true`.

- [ ] **Step 4: Skip marker verification for a stale no-op**

Run the public `release.json` assertion only when the transfer step reports `activated=true`.

- [ ] **Step 5: Document the ordering guarantee**

Update the release contract to state that out-of-order successful runs cannot activate an older
commit and that a live-ref API failure blocks deployment.

- [ ] **Step 6: Prove the contract is green**

Run: `pnpm test:deployment`

Expected: all deployment contract tests pass.

### Task 3: Verify and publish the isolated change

**Files:**

- Verify only the four files listed in Tasks 1 and 2 plus this design and plan.

- [ ] **Step 1: Run complete repository gates**

Run sequentially:

```bash
pnpm audit --audit-level high
pnpm lint
pnpm test:deployment
pnpm test
pnpm typecheck
pnpm build
```

Expected: every command exits zero; audit has no high or critical advisory.

- [ ] **Step 2: Review the isolated diff**

Use a temporary `GIT_INDEX_FILE` created from `HEAD`, stage only the six attributable files, inspect
`git diff --cached --check`, `--stat`, and the full cached patch, and scan that patch for secrets.

- [ ] **Step 3: Commit and push**

Commit with `ci(deploy): reject stale main releases`, fetch and re-check `origin/main`, then push the
fast-forward commit to `origin/main` without touching the normal staging index.

- [ ] **Step 4: Verify GitHub and production**

Wait for the exact-SHA CI and deployment runs to succeed. Confirm public `release.json` equals the
new `origin/main` SHA and perform a disposable-browser console/network smoke test.
