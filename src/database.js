import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");
const DB_PATH = join(DATA_DIR, "dzrp.json");

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  if (!existsSync(DB_PATH)) {
    const initial = { users: {}, economy_log: [] };
    writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(readFileSync(DB_PATH, "utf8"));
}

function save(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function defaults(u) {
  return {
    xp: 0,
    level: 1,
    job: "مدني",
    last_daily: null,
    last_work: null,
    last_rob: null,
    total_earned: 0,
    total_lost: 0,
    balance: 0,
    ...u,
  };
}

/* ================= USER ================= */

export function getUser(discordId) {
  const data = load();
  const u = data.users[discordId];
  return u ? defaults(u) : null;
}

export function createUser(discordId, username) {
  const data = load();

  if (!data.users[discordId]) {
    data.users[discordId] = {
      discord_id: discordId,
      username,
      psn: null,
      verified: false,
      balance: 0,
      xp: 0,
      level: 1,
      job: "مدني",
      last_daily: null,
      last_work: null,
      last_rob: null,
      total_earned: 0,
      total_lost: 0,
      created_at: new Date().toISOString(),
    };
    save(data);
  }

  return defaults(data.users[discordId]);
}

/* ================= MONEY ================= */

export function getBalance(discordId) {
  const user = getUser(discordId);
  return user ? user.balance : 0;
}

export function addMoney(discordId, amount) {
  const data = load();

  if (data.users[discordId]) {
    data.users[discordId].balance += amount;
    data.users[discordId].total_earned += amount;
    save(data);
  }
}

export function removeMoney(discordId, amount) {
  const data = load();

  if (data.users[discordId]) {
    const actual = Math.min(amount, data.users[discordId].balance);

    data.users[discordId].balance -= actual;
    data.users[discordId].total_lost += actual;

    save(data);
  }
}

export function setMoney(discordId, amount) {
  const data = load();

  if (data.users[discordId]) {
    data.users[discordId].balance = amount;
    save(data);
  }
}

/* ================= XP ================= */

export function addXp(discordId, amount) {
  const data = load();

  if (!data.users[discordId]) return null;

  const u = data.users[discordId];

  u.xp += amount;
  u.level = calcLevel(u.xp);

  save(data);

  return { xp: u.xp, level: u.level };
}

/* ================= JOB ================= */

export function setJob(discordId, job) {
  const data = load();

  if (data.users[discordId]) {
    data.users[discordId].job = job;
    save(data);
  }
}

/* ================= VERIFY ================= */

export function setPsn(discordId, psn) {
  const data = load();

  if (data.users[discordId]) {
    data.users[discordId].psn = psn;
    data.users[discordId].verified = true;
    save(data);
  }
}

export function resetVerify(discordId) {
  const data = load();

  if (data.users[discordId]) {
    data.users[discordId].psn = null;
    data.users[discordId].verified = false;
    save(data);
  }
}

/* ================= LEVEL ================= */

export function calcLevel(xp) {
  const thresholds = [0, 500, 1500, 3000, 5000, 10000, 20000];

  let level = 1;

  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }

  return level;
}

/* ================= TOP ================= */

export function getTopUsers(limit = 10) {
  const data = load();

  return Object.values(data.users)
    .map(defaults)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}

export const JOBS = {
  "مدني": { emoji: "🚗", salary: 150 },
  "شرطي": { emoji: "👮", salary: 300 },
  "مسعف": { emoji: "🚑", salary: 280 },
  "ميكانيكي": { emoji: "🔧", salary: 260 },
  "تاجر": { emoji: "🏪", salary: 350 },
  "مهرب": { emoji: "💊", salary: 450 },
  "عصابة": { emoji: "🔫", salary: 400 },
};

export default { load, save };
