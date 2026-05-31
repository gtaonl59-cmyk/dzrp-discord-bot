import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const cache = {};

function filePath(name) {
  return join(DATA_DIR, `${name}.json`);
}

export function load(name) {
  if (cache[name]) return cache[name];
  const p = filePath(name);
  if (!existsSync(p)) { cache[name] = {}; return {}; }
  try {
    cache[name] = JSON.parse(readFileSync(p, 'utf8'));
    return cache[name];
  } catch {
    cache[name] = {};
    return {};
  }
}

export function save(name, data) {
  cache[name] = data;
  writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
}

export function getUser(collection, userId, defaults = {}) {
  const db = load(collection);
  if (!db[userId]) db[userId] = { ...defaults };
  return db[userId];
}

export function saveUser(collection, userId, data) {
  const db = load(collection);
  db[userId] = data;
  save(collection, db);
}

export function getAllUsers(collection) {
  return load(collection);
}
