// dag-map-status.mjs — report vendored dag-map state vs. upstream.
//
// Prints: last-sync SHA (from dag-map-vendored.md), current upstream main HEAD,
// diff summary between the two, and a count of commits on the current
// branch that touch dag-map/ but have not been subtree-pushed upstream.
//
// Usage: node scripts/dag-map-status.mjs

import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const VENDORED = join(REPO_ROOT, 'docs', 'dag-map-vendored.md');
const UPSTREAM_REMOTE = 'dag-map-upstream';
const UPSTREAM_URL = 'https://github.com/23min/DAG-map.git';

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', ...opts }).trim();
}

function checkRemote() {
  const remotes = git(['remote']).split('\n');
  if (!remotes.includes(UPSTREAM_REMOTE)) {
    console.error(`error: remote "${UPSTREAM_REMOTE}" is not configured.`);
    console.error(`add it with:`);
    console.error(`  git remote add ${UPSTREAM_REMOTE} ${UPSTREAM_URL}`);
    process.exit(1);
  }
}

async function readLastSyncSha() {
  const md = await readFile(VENDORED, 'utf8');
  const m = md.match(/\*\*Upstream SHA:\*\*\s*`([0-9a-f]+)`/);
  if (!m) throw new Error(`could not find "Upstream SHA" line in ${VENDORED}`);
  return m[1];
}

async function main() {
  checkRemote();

  console.log('fetching upstream…');
  git(['fetch', UPSTREAM_REMOTE, '--quiet']);

  const lastSync = await readLastSyncSha();
  const upstreamHead = git(['rev-parse', `${UPSTREAM_REMOTE}/main`]);

  console.log('');
  console.log(`last-sync SHA (dag-map-vendored.md):  ${lastSync}`);
  console.log(`upstream main HEAD:           ${upstreamHead}`);
  console.log('');

  if (lastSync === upstreamHead) {
    console.log('✓ up to date with upstream main');
  } else {
    const ahead = git(['rev-list', '--count', `${lastSync}..${upstreamHead}`]);
    console.log(`upstream is ${ahead} commit(s) ahead of last sync`);
    console.log('');
    console.log('incoming commits (upstream not yet synced here):');
    console.log(git(['log', '--oneline', `${lastSync}..${upstreamHead}`]));
  }

  console.log('');
  const localDagMapDiff = git(['diff', '--stat', 'HEAD', '--', 'dag-map/']);
  if (localDagMapDiff) {
    console.log('working-tree changes under dag-map/:');
    console.log(localDagMapDiff);
  } else {
    console.log('working tree clean under dag-map/');
  }

  console.log('');
  const branch = git(['branch', '--show-current']);
  const dagMapCommits = git([
    'log',
    '--oneline',
    '--',
    'dag-map/',
  ]).split('\n').filter(Boolean);
  console.log(`commits touching dag-map/ on branch "${branch}" (most recent first):`);
  for (const line of dagMapCommits.slice(0, 10)) console.log(`  ${line}`);
  if (dagMapCommits.length > 10) console.log(`  … and ${dagMapCommits.length - 10} more`);
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
