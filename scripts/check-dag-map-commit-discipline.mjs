// check-dag-map-commit-discipline.mjs — advisory check for mixed commits.
//
// Warns when a commit (staged or a given SHA) touches files both inside
// and outside dag-map/. Mixed commits break `git subtree push`. This check
// is advisory: it prints a warning and exits 0. Wire it into a pre-commit
// hook or run it manually before committing.
//
// Rule: see ADR 0004 ("Commit discipline: dag-map edits in their own
// commits").
//
// Usage:
//   node scripts/check-dag-map-commit-discipline.mjs           # check staged changes
//   node scripts/check-dag-map-commit-discipline.mjs <sha>     # check a past commit

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

const sha = process.argv[2];

function files() {
  if (sha) {
    return git(['show', '--name-only', '--format=', sha]).split('\n').filter(Boolean);
  }
  return git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
}

const changed = files();
if (changed.length === 0) process.exit(0);

const inside = changed.filter((f) => f.startsWith('dag-map/'));
const outside = changed.filter((f) => !f.startsWith('dag-map/'));

if (inside.length && outside.length) {
  console.warn('');
  console.warn('⚠️  Mixed commit: this change touches files both inside and outside dag-map/.');
  console.warn('');
  console.warn(`  dag-map/ (${inside.length}):`);
  for (const f of inside.slice(0, 5)) console.warn(`    ${f}`);
  if (inside.length > 5) console.warn(`    … and ${inside.length - 5} more`);
  console.warn(`  outside  (${outside.length}):`);
  for (const f of outside.slice(0, 5)) console.warn(`    ${f}`);
  if (outside.length > 5) console.warn(`    … and ${outside.length - 5} more`);
  console.warn('');
  console.warn('  Rule: commits under dag-map/ should not also modify files outside it.');
  console.warn('  Mixed commits break `git subtree push` to upstream.');
  console.warn('  Split this into separate commits unless you never intend to upstream it.');
  console.warn('  See ADR 0004 (docs/decisions/0004-vendor-dag-map-via-git-subtree.md).');
  console.warn('');
}

process.exit(0);
