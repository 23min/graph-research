// dag-map-push.mjs — push local dag-map subtree commits to upstream as a PR-ready branch.
//
// Defaults to --dry-run. With --apply and --branch=<name>, runs:
//   git subtree push --prefix=dag-map dag-map-upstream <name>
// creating/updating <name> on upstream with the split history of dag-map/
// commits from this repo's current branch. Open a PR on the dag-map repo
// from that branch.
//
// Requires --branch=<name> for --apply. Dry-run prints which commits would
// be pushed. Commits that touch files outside dag-map/ are surfaced as
// warnings (they will be filtered out by subtree push, but mixed commits
// signal a discipline miss).
//
// Usage:
//   node scripts/dag-map-push.mjs                                    # dry-run
//   node scripts/dag-map-push.mjs --apply --branch=expose-internals  # execute

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const UPSTREAM_REMOTE = 'dag-map-upstream';
const UPSTREAM_URL = 'https://github.com/23min/DAG-map.git';

function arg(name) {
  const prefix = `--${name}=`;
  for (const a of process.argv) if (a.startsWith(prefix)) return a.slice(prefix.length);
  return null;
}

const APPLY = process.argv.includes('--apply');
const BRANCH = arg('branch');

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

function listDagMapCommits() {
  // Commits on current branch that touch dag-map/, since the initial subtree import.
  return git([
    'log',
    '--format=%H %s',
    '--',
    'dag-map/',
  ])
    .split('\n')
    .filter(Boolean);
}

function mixedCommits(commitShas) {
  const mixed = [];
  for (const sha of commitShas) {
    const files = git(['show', '--name-only', '--format=', sha]).split('\n').filter(Boolean);
    const insideDagMap = files.filter((f) => f.startsWith('dag-map/'));
    const outside = files.filter((f) => !f.startsWith('dag-map/'));
    if (insideDagMap.length && outside.length) {
      mixed.push({ sha, insideDagMap: insideDagMap.length, outside: outside.length });
    }
  }
  return mixed;
}

async function main() {
  checkRemote();

  const commitLines = listDagMapCommits();
  console.log(`commits touching dag-map/ on current branch: ${commitLines.length}`);
  for (const line of commitLines.slice(0, 20)) console.log(`  ${line}`);
  if (commitLines.length > 20) console.log(`  … and ${commitLines.length - 20} more`);
  console.log('');

  const shas = commitLines.map((l) => l.split(' ')[0]);
  const mixed = mixedCommits(shas);
  if (mixed.length) {
    console.warn(`warning: ${mixed.length} commit(s) touch files both inside and outside dag-map/.`);
    console.warn(`  git subtree push will filter them, but mixed commits signal broken discipline.`);
    console.warn(`  see ADR 0004 for the rule.`);
    for (const m of mixed.slice(0, 5)) {
      console.warn(`    ${m.sha.slice(0, 10)}  dag-map/: ${m.insideDagMap}, outside: ${m.outside}`);
    }
    console.warn('');
  }

  if (!APPLY) {
    console.log('(dry run — pass --apply --branch=<name> to push to upstream)');
    return;
  }

  if (!BRANCH) {
    console.error('error: --apply requires --branch=<name>.');
    process.exit(1);
  }

  checkCleanTree();

  console.log(`running: git subtree push --prefix=dag-map ${UPSTREAM_REMOTE} ${BRANCH}`);
  gitRun(['subtree', 'push', '--prefix=dag-map', UPSTREAM_REMOTE, BRANCH]);

  console.log('');
  console.log(`pushed dag-map/ history to ${UPSTREAM_REMOTE}/${BRANCH}`);
  console.log(`open a PR on ${UPSTREAM_URL.replace('.git', '')} from branch "${BRANCH}".`);
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
