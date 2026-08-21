import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const deployRoot = join(repoRoot, 'deploy');
const packageScript = join(deployRoot, 'package-web-release.sh');
const scripts = [
  packageScript,
  join(deployRoot, 'activate-web-release.sh'),
  join(deployRoot, 'rollback-web-release.sh'),
  join(deployRoot, 'bootstrap-aapanel-server.sh'),
];
const sha = '0123456789abcdef0123456789abcdef01234567';

let fixtureRoot;
let fixtureBuild;
let fixtureOutput;

function readRequired(path) {
  assert.equal(existsSync(path), true, `${relative(repoRoot, path)} must exist`);

  return readFileSync(path, 'utf8');
}

before(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'borrowed-deploy-contract-'));
  fixtureBuild = join(fixtureRoot, 'build');
  fixtureOutput = join(fixtureRoot, 'release');
  mkdirSync(fixtureBuild);
  mkdirSync(fixtureOutput);
  writeFileSync(
    join(fixtureBuild, 'index.html'),
    '<!doctype html><html><head></head><body><app-root></app-root></body></html>\n',
  );
  writeFileSync(join(fixtureBuild, 'manifest.webmanifest'), '{}\n');
  writeFileSync(join(fixtureBuild, 'ngsw.json'), '{}\n');
  writeFileSync(
    join(fixtureBuild, 'ngsw-worker.js'),
    'self.addEventListener("fetch", () => {});\n',
  );
  writeFileSync(join(fixtureBuild, 'main-ABCDEF1234.js'), 'console.log("fixture");\n');
});

after(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

test('all deployment shell scripts pass bash syntax validation', () => {
  for (const script of scripts) {
    assert.equal(existsSync(script), true, `${relative(repoRoot, script)} must exist`);
    execFileSync('bash', ['-n', script]);
  }
});

test('the packager rejects a non-SHA release id', () => {
  assert.equal(existsSync(packageScript), true, 'package script must exist');

  const result = spawnSync('bash', [packageScript, 'main', fixtureBuild, fixtureOutput]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr.toString(), /40-character lowercase commit SHA/);
});

test('the packager rejects CSP-incompatible inline event handlers', () => {
  const unsafeBuild = join(fixtureRoot, 'unsafe-build');
  const unsafeOutput = join(fixtureRoot, 'unsafe-output');
  mkdirSync(unsafeBuild);
  writeFileSync(
    join(unsafeBuild, 'index.html'),
    '<!doctype html><html><head><link rel="stylesheet" href="styles.css" media="print" onload="this.media=\'all\'"></head><body><app-root></app-root></body></html>\n',
  );
  writeFileSync(join(unsafeBuild, 'manifest.webmanifest'), '{}\n');
  writeFileSync(join(unsafeBuild, 'ngsw.json'), '{}\n');
  writeFileSync(join(unsafeBuild, 'ngsw-worker.js'), 'self.addEventListener("fetch", () => {});\n');
  writeFileSync(join(unsafeBuild, 'main-ABCDEF1234.js'), 'console.log("fixture");\n');

  const result = spawnSync('bash', [packageScript, sha, unsafeBuild, unsafeOutput]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr.toString(), /CSP-incompatible inline event handlers/);
});

test('the packager emits a verified SHA-bound PWA archive', () => {
  assert.equal(existsSync(packageScript), true, 'package script must exist');

  const result = spawnSync('bash', [packageScript, sha, fixtureBuild, fixtureOutput]);
  const archive = join(fixtureOutput, `borrowed-web-${sha}.tar.gz`);
  const checksum = `${archive}.sha256`;

  assert.equal(result.status, 0, result.stderr.toString());
  const diagnostic = JSON.stringify({
    archive,
    files: readdirSync(fixtureOutput),
    stderr: result.stderr.toString(),
    stdout: result.stdout.toString(),
  });
  assert.equal(existsSync(archive), true, diagnostic);
  assert.equal(existsSync(checksum), true, diagnostic);
  execFileSync('sha256sum', ['--check', checksum], { cwd: fixtureOutput });

  const extracted = join(fixtureRoot, 'extracted');
  mkdirSync(extracted);
  execFileSync('tar', ['-xzf', archive, '-C', extracted]);
  assert.deepEqual(JSON.parse(readFileSync(join(extracted, 'release.json'), 'utf8')), { sha });
  assert.match(
    readFileSync(join(extracted, 'index.html'), 'utf8'),
    new RegExp(`<meta name="borrowed-release" content="${sha}">`),
  );
});

test('activation is least-privilege, integrity-checked, atomic, and rollback-safe', () => {
  const activation = readRequired(join(deployRoot, 'activate-web-release.sh'));
  const rollback = readRequired(join(deployRoot, 'rollback-web-release.sh'));

  assert.match(activation, /borrowed-deploy/);
  assert.match(activation, /deploy\/shared\/incoming/);
  assert.match(activation, /sha256sum --check/);
  assert.match(activation, /tar --no-same-owner --no-same-permissions/);
  assert.match(activation, /mv -Tf/);
  assert.match(activation, /ngsw-bypass: true/);
  assert.match(activation, /restore_previous_release/);
  assert.match(activation, /cleanup_on_exit/);
  assert.match(activation, /local exit_status=\$\?/);
  assert.match(rollback, /mv -Tf/);
  assert.match(rollback, /restore_previous_release/);
});

test('CI uploads artifacts only for main push events', () => {
  const workflow = readRequired(join(repoRoot, '.github/workflows/ci.yml'));

  assert.equal((workflow.match(/actions\/checkout@v7/g) ?? []).length, 2);
  assert.equal((workflow.match(/pnpm\/action-setup@v6/g) ?? []).length, 2);
  assert.equal((workflow.match(/actions\/setup-node@v7/g) ?? []).length, 2);
  assert.match(workflow, /actions\/setup-java@v5/);
  assert.match(workflow, /android-actions\/setup-android@v4/);
  assert.doesNotMatch(workflow, /pnpm\/action-setup@v6\s*\n\s*with:\s*\n\s*version:/);
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /deploy\/package-web-release\.sh/);
  assert.match(workflow, /actions\/upload-artifact@v7/);
  assert.match(workflow, /retention-days: 14/);
});

test('the production build does not generate inline stylesheet event handlers', () => {
  const workspace = JSON.parse(readRequired(join(repoRoot, 'angular.json')));
  const production = workspace.projects.borrowed.architect.build.configurations.production;

  assert.equal(production.optimization.styles.inlineCritical, false);
});

test('production deployment requires a successful main push workflow', () => {
  const workflow = readRequired(join(repoRoot, '.github/workflows/deploy-production.yml'));

  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /github\.event\.workflow_run\.event == 'push'/);
  assert.match(workflow, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(workflow, /environment:\s*\n\s*name: production/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/download-artifact@v8/);
  assert.match(workflow, /DEPLOY_KNOWN_HOSTS/);
  assert.doesNotMatch(workflow, /root@/);
});

test('production deployment skips successful CI releases that are no longer main', () => {
  const workflow = readRequired(join(repoRoot, '.github/workflows/deploy-production.yml'));
  const liveMainLookups =
    workflow.match(/gh api "repos\/\$\{GITHUB_REPOSITORY\}\/git\/ref\/heads\/main"/g) ?? [];

  assert.match(workflow, /^  freshness:\n/m);
  assert.match(
    workflow,
    /release_is_current: \$\{\{ steps\.current_main\.outputs\.is_current \}\}/,
  );
  assert.match(workflow, /needs: freshness/);
  assert.match(workflow, /needs\.freshness\.outputs\.release_is_current == 'true'/);
  assert.equal(liveMainLookups.length, 2);
  assert.match(workflow, /echo 'is_current=false'/);
  assert.match(workflow, /id: activation/);
  assert.match(workflow, /activated=false/);
  assert.match(workflow, /if: steps\.activation\.outputs\.activated == 'true'/);
});

test('the Nginx vhost preserves ACME and serves the atomic release', () => {
  const config = readRequired(join(deployRoot, 'nginx/borrowed.miniserver.fun.conf'));

  assert.match(config, /root \/www\/wwwroot\/borrowed\.miniserver\.fun\/deploy\/current;/);
  assert.match(config, /well-known\/borrowed\.miniserver\.fun\.conf/);
  assert.match(config, /try_files \$uri \$uri\/ \/index\.html;/);
  assert.match(config, /location = \/ngsw\.json/);
  assert.match(config, /add_header_inherit merge/);
  const hashedAssetLocation = config.split('\n').find((line) => line.includes('[a-z0-9]{8,}'));
  assert.match(hashedAssetLocation, /location ~\* ".+" \{/);
  assert.doesNotMatch(config, /enable-php/);
  assert.doesNotMatch(config, /TLSv1\.1/);
});

test('bootstrap confines the deployment account to the deploy subtree', () => {
  const bootstrap = readRequired(join(deployRoot, 'bootstrap-aapanel-server.sh'));

  assert.match(bootstrap, /passwd --lock borrowed-deploy/);
  assert.match(bootstrap, /printf 'restrict %s/);
  assert.match(bootstrap, /\$deploy_root\/shared\/incoming/);
  assert.match(bootstrap, /nginx -t/);
  assert.match(bootstrap, /restore_vhost/);
});
