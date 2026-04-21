// dag-map-sync.mjs — pull upstream dag-map changes into this repo via subtree.
//
// Defaults to --dry-run. With --apply, runs:
//   git subtree pull --prefix=dag-map dag-map-upstream main --squash
// and updates the "Upstream SHA" + "Date" fields in docs/dag-map-vendored.md.
//
// Requires a clean working tree. Refuses to run otherwise.
//
// Usage:
//   node scripts/dag-map-sync.mjs            # dry-run: show incoming commits
//   node scripts/dag-map-sync.mjs --apply    # execute

import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const VENDORED = join(REPO_ROOT, 'docs', 'dag-map-vendored.md');
const UPSTREAM_REMOTE = 'dag-map-upstream';
const UPSTREAM_URL = 'https://github.com/23min/DAG-map.git';
const APPLY = process.argv.includes('--apply');

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', ...opts }).trim();
}

function gitRun(args) {
  execFileSync('git', args, { cwd: REPO_ROOT, stdio: 'inherit' });
}

function checkRemote() {
  const remotes = git(['remote']).split('\n');
  if (!remotes.includes(UPSTREAM_REMOTE)) {
    console.error(`error: remote "${UPSTREAM_REMOTE}" is not configured.`);
    console.error(`  git remote add ${UPSTREAM_REMOTE} ${UPSTREAM_URL}`);
    process.exit(1);
  }
}

function checkCleanTree() {
  const status = git(['status', '--porcelain']);
  if (status) {
    console.error('error: working tree is not clean. Commit or stash first.');
    console.error(status);
    process.exit(1);
  }
}

async function readLastSyncSha() {
  const md = await readFile(VENDORED, 'utf8');
  const m = md.match(/\*\*Upstream SHA:\*\*\s*`([0-9a-f]+)`/);
  if (!m) throw new Error(`could not find "Upstream SHA" line in ${VENDORED}`);
  return m[1];
}

async function updateVendoredMd(newSha, shortSha, newDate) {
  const md = await readFile(VENDORED, 'utf8');
  const updated = md
    .replace(/\*\*Upstream SHA:\*\*\s*`[0-9a-f]+`.*/m, `**Upstream SHA:** \`${newSha}\` (\`${shortSha}\`)`)
    .replace(/\*\*Date:\*\*\s*\d{4}-\d{2}-\d{2}/, `**Date:** ${newDate}`);
  await writeFile(VENDORED, updated);
}

async function main() {
  checkRemote();

  console.log('fetching upstream…');
  git(['fetch', UPSTREAM_REMOTE, '--quiet']);

  const lastSync = await readLastSyncSha();
  const upstreamHead = git(['rev-parse', `${UPSTREAM_REMOTE}/main`]);

  if (lastSync === upstreamHead) {
    console.log('already in sync with upstream main. Nothing to do.');
    return;
  }

  const incoming = git(['log', '--oneline', `${lastSync}..${upstreamHead}`]);
  console.log(`last-sync: ${lastSync}`);
  console.log(`upstream:  ${upstreamHead}`);
  console.log('');
  console.log('incoming commits:');
  console.log(incoming);
  console.log('');

  if (!APPLY) {
    console.log('(dry run — pass --apply to execute subtree pull)');
    return;
  }

  checkCleanTree();

  console.log('running: git subtree pull --prefix=dag-map dag-map-upstream main --squash');
  gitRun(['subtree', 'pull', '--prefix=dag-map', UPSTREAM_REMOTE, 'main', '--squash']);

  const shortSha = upstreamHead.slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  await updateVendoredMd(upstreamHead, shortSha, today);

  console.log('');
  console.log(`updated dag-map-vendored.md: upstream SHA → ${shortSha}, date → ${today}`);
  console.log('stage and commit the dag-map-vendored.md update as a follow-up:');
  console.log(`  git add docs/dag-map-vendored.md`);
  console.log(`  git commit -m "docs(dag-map): update dag-map-vendored.md after sync to ${shortSha}"`);
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
