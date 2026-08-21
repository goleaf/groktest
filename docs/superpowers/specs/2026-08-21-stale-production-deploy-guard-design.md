# Stale Production Deploy Guard Design

## Context

`Deploy production` is triggered when a `CI` workflow run completes. GitHub can complete workflow
runs out of commit order: CI for a newer `main` commit may finish and deploy before CI for its
parent. The existing concurrency group serializes deployment jobs, but it does not make their
release SHAs monotonic. A later-triggered job can therefore activate an older release.

## Goal

Only the commit currently at `refs/heads/main` may enter or complete the automatic production
activation path. Manual rollback remains intentionally exempt because selecting an older retained
release is its purpose.

## Design

The workflow applies two fail-closed freshness checks through GitHub's authenticated repository API:

1. A lightweight `freshness` job compares `workflow_run.head_sha` with the live `main` ref before
   the deployment job receives the production environment.
2. The transfer step repeats the same comparison immediately before invoking the remote atomic
   activator. This closes the interval in which `main` could advance while the artifact is being
   validated and copied.

An API error fails the guard and blocks activation. A valid but stale SHA is an expected no-op: the
workflow records a notice, skips activation and public marker verification, and removes only the
staging directory created by that run. SSH key cleanup continues under `if: always()`.

## Security boundaries

- The guard uses the workflow-scoped `GITHUB_TOKEN` with existing read-only repository permission.
- The release SHA remains a 40-character lowercase commit SHA supplied by the trusted
  `workflow_run` payload.
- No production secret is exposed to the freshness job.
- Manual rollback behavior is unchanged.

## Verification

The deployment contract test must prove that the workflow has a live-main gate, a second check
before the activator call, conditional marker verification, and unchanged rollback behavior. The
full repository gates and a real GitHub Actions deployment must then pass, and public `release.json`
must equal `origin/main`.
