// fetch-pdfs.mjs — open-access fallback PDF fetcher.
//
// Walks docs/literature/bibliography.bib, resolves each entry's `url` or
// `doi` field, and downloads to docs/literature/pdfs/<bibkey>.pdf if not
// already present. Paywalled papers (403, Cloudflare, non-PDF redirect)
// are logged and skipped — acquire those manually.
//
// Usage: node scripts/fetch-pdfs.mjs [--force]

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIB = join(__dirname, '..', 'docs', 'literature', 'bibliography.bib');
const PDF_DIR = join(__dirname, '..', 'docs', 'literature', 'pdfs');
const FORCE = process.argv.includes('--force');

function parseBib(src) {
  const entries = [];
  const entryRegex = /@\w+\s*\{\s*([^,\s]+)\s*,([^@]*)\}/g;
  let m;
  while ((m = entryRegex.exec(src)) !== null) {
    const key = m[1];
    const body = m[2];
    const fields = {};
    const fieldRegex = /(\w+)\s*=\s*[{"]([^}"]*)[}"]\s*,?/g;
    let f;
    while ((f = fieldRegex.exec(body)) !== null) {
      fields[f[1].toLowerCase()] = f[2].trim();
    }
    entries.push({ key, fields });
  }
  return entries;
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'graph-research-fetch-pdfs/0.1' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('pdf')) {
    throw new Error(`non-PDF content-type: ${ct}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  const src = await readFile(BIB, 'utf8');
  const entries = parseBib(src);
  await mkdir(PDF_DIR, { recursive: true });

  const results = { fetched: [], skipped: [], failed: [] };

  for (const { key, fields } of entries) {
    const dest = join(PDF_DIR, `${key}.pdf`);
    if (!FORCE && await exists(dest)) {
      results.skipped.push({ key, reason: 'already present' });
      continue;
    }
    const url = fields.url || (fields.doi ? `https://doi.org/${fields.doi}` : null);
    if (!url) {
      results.failed.push({ key, reason: 'no url or doi' });
      continue;
    }
    try {
      const bytes = await download(url, dest);
      results.fetched.push({ key, bytes });
      console.log(`[fetched] ${key}.pdf (${bytes} bytes)`);
    } catch (err) {
      results.failed.push({ key, reason: err.message });
      console.warn(`[failed]  ${key}: ${err.message}`);
    }
  }

  console.log(`\nSummary: ${results.fetched.length} fetched, ${results.skipped.length} skipped, ${results.failed.length} failed`);
  if (results.failed.length > 0) {
    console.log('\nFailed entries (likely paywalled — acquire manually and drop into docs/literature/pdfs/):');
    for (const f of results.failed) console.log(`  ${f.key}: ${f.reason}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
