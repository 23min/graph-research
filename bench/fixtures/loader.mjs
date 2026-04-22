import { readFileSync } from 'node:fs';

const INDEX_URL = new URL('./index.json', import.meta.url);
const REPO_ROOT = new URL('../../', import.meta.url);

const index = JSON.parse(readFileSync(INDEX_URL, 'utf8'));
const entryById = new Map(index.map(e => [e.id, e]));

const sourceCache = new Map();

async function loadSource(source) {
  const cached = sourceCache.get(source);
  if (cached) return cached;
  const url = new URL(source, REPO_ROOT);
  const mod = await import(url.href);
  sourceCache.set(source, mod);
  return mod;
}

export function listFixtures() {
  return index.map(e => e.id);
}

export async function loadFixture(id) {
  const entry = entryById.get(id);
  if (!entry) {
    const available = index.map(e => e.id).join(', ');
    throw new Error(`loadFixture: unknown fixture id "${id}". Available ids: ${available}`);
  }
  const mod = await loadSource(entry.source);
  const model = mod.models.find(m => m.id === id);
  const { id: mId, name, dag, routes, theme, opts } = model;
  return structuredClone({ id: mId, name, dag, routes, theme, opts });
}
