import { GuildMember, PermissionFlagsBits } from "discord.js";
import Economy from "../models/Economy.js";
import User from "../models/User.js";
import GuildSettings from "../models/GuildSettings.js";

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function generateId(prefix = ""): string {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function generatePlate(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let plate = "";
  for (let i = 0; i < 3; i++) plate += letters[Math.floor(Math.random() * letters.length)];
  plate += "-";
  for (let i = 0; i < 4; i++) plate += digits[Math.floor(Math.random() * digits.length)];
  return plate;
}

export function calculateXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getVipMultiplier(tier: string): number {
  const multipliers: Record<string, number> = {
    none: 1,
    bronze: 1.1,
    silver: 1.25,
    gold: 1.5,
    platinum: 2.0,
    diamond: 3.0,
  };
  return multipliers[tier] ?? 1;
}

export function getVipBankLimit(tier: string): number {
  const limits: Record<string, number> = {
    none: 50_000,
    bronze: 100_000,
    silver: 250_000,
    gold: 500_000,
    platinum: 1_000_000,
    diamond: 5_000_000,
  };
  return limits[tier] ?? 50_000;
}

export async function getOrCreateEconomy(userId: string, guildId: string) {
  let eco = await Economy.findOne({ userId, guildId });
  if (!eco) {
    eco = await Economy.create({ userId, guildId });
  }
  return eco;
}

export async function getOrCreateUser(userId: string, guildId: string) {
  let user = await User.findOne({ userId, guildId });
  if (!user) {
    user = await User.create({ userId, guildId });
  }
  return user;
}

export async function getOrCreateGuildSettings(guildId: string) {
  let settings = await GuildSettings.findOne({ guildId });
  if (!settings) {
    settings = await GuildSettings.create({ guildId });
  }
  return settings;
}

export async function addTransaction(
  userId: string,
  guildId: string,
  type: string,
  amount: number,
  description: string
) {
  await Economy.updateOne(
    { userId, guildId },
    {
      $push: {
        transactions: {
          $each: [{ type, amount, description, timestamp: new Date() }],
          $slice: -50,
        },
      },
    }
  );
}

export function isStaff(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

export function isMod(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

export function isPrisoned(prisonEnd: Date | null): boolean {
  if (!prisonEnd) return false;
  return new Date() < prisonEnd;
}

export function cooldownRemaining(lastUsed: Date | null, cooldownMs: number): number {
  if (!lastUsed) return 0;
  const remaining = cooldownMs - (Date.now() - lastUsed.getTime());
  return remaining > 0 ? remaining : 0;
}

export const JOBS = [
  { name: "Police Officer", id: "police", salary: 2500, xpGain: 50 },
  { name: "EMS Paramedic", id: "ems", salary: 2200, xpGain: 45 },
  { name: "Mechanic", id: "mechanic", salary: 1800, xpGain: 35 },
  { name: "Taxi Driver", id: "taxi", salary: 1200, xpGain: 25 },
  { name: "Truck Driver", id: "truck", salary: 1500, xpGain: 30 },
  { name: "Fisherman", id: "fisherman", salary: 900, xpGain: 20 },
  { name: "Miner", id: "miner", salary: 1100, xpGain: 22 },
  { name: "Farmer", id: "farmer", salary: 1000, xpGain: 20 },
  { name: "Delivery Driver", id: "delivery", salary: 1300, xpGain: 26 },
  { name: "Security Guard", id: "security", salary: 1400, xpGain: 28 },
  { name: "Judge", id: "judge", salary: 5000, xpGain: 80 },
  { name: "Lawyer", id: "lawyer", salary: 4500, xpGain: 70 },
  { name: "Business Owner", id: "business", salary: 3000, xpGain: 60 },
];

export const VIP_TIERS = [
  { name: "Bronze", id: "bronze", emoji: "🥉", color: 0xcd7f32 },
  { name: "Silver", id: "silver", emoji: "🥈", color: 0xc0c0c0 },
  { name: "Gold", id: "gold", emoji: "🥇", color: 0xffd700 },
  { name: "Platinum", id: "platinum", emoji: "💎", color: 0xe5e4e2 },
  { name: "Diamond", id: "diamond", emoji: "💠", color: 0xb9f2ff },
];

export const ACHIEVEMENTS = [
  { id: "first_char", name: "First Steps", desc: "Create your first character" },
  { id: "rich", name: "High Roller", desc: "Have $1,000,000 in your bank" },
  { id: "worker", name: "Hard Worker", desc: "Work 100 times" },
  { id: "criminal", name: "On the Record", desc: "Get your first criminal record" },
  { id: "property_owner", name: "Home Owner", desc: "Buy your first property" },
  { id: "car_owner", name: "Driver", desc: "Buy your first vehicle" },
  { id: "gang_leader", name: "Boss", desc: "Create a gang or mafia" },
  { id: "level_10", name: "Rising Star", desc: "Reach level 10" },
  { id: "level_50", name: "Veteran", desc: "Reach level 50" },
];
