import { Message } from "discord.js";
import User from "../models/User.js";
import { calculateXpForLevel, getOrCreateUser, getOrCreateGuildSettings } from "../utils/helpers.js";
import { logger } from "../../lib/logger.js";

const xpCooldowns = new Map<string, number>();
const SPAM_TRACKER = new Map<string, { count: number; resetAt: number }>();
const LINK_REGEX = /(https?:\/\/[^\s]+)/gi;
const SCAM_REGEX = /(free\s*nitro|discord\.gift|steamcommunity\.com\/tradeoffer)/i;

export default {
  name: "messageCreate",
  async execute(message: Message) {
    if (message.author.bot || !message.guild) return;

    try {
      const settings = await getOrCreateGuildSettings(message.guild.id);

      // Anti-spam
      if (settings.antiSpam) {
        const key = `${message.author.id}-${message.guild.id}`;
        const tracker = SPAM_TRACKER.get(key) ?? { count: 0, resetAt: Date.now() + 5000 };
        if (Date.now() > tracker.resetAt) {
          tracker.count = 0;
          tracker.resetAt = Date.now() + 5000;
        }
        tracker.count++;
        SPAM_TRACKER.set(key, tracker);
        if (tracker.count > 5) {
          await message.delete().catch(() => {});
          await message.channel.send(`<@${message.author.id}> ⚠️ Please do not spam!`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
          return;
        }
      }

      // Anti-link
      if (settings.antiLink && LINK_REGEX.test(message.content)) {
        const member = message.guild.members.cache.get(message.author.id);
        if (!member?.permissions.has(8n)) {
          await message.delete().catch(() => {});
          return;
        }
      }

      // Anti-scam
      if (SCAM_REGEX.test(message.content)) {
        await message.delete().catch(() => {});
        await message.channel.send(`⚠️ <@${message.author.id}> Scam link detected and removed.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        return;
      }

      // XP gain
      if (!settings.xpEnabled) return;
      const xpKey = `${message.author.id}-${message.guild.id}`;
      const lastXp = xpCooldowns.get(xpKey) ?? 0;
      if (Date.now() - lastXp < 60_000) return;
      xpCooldowns.set(xpKey, Date.now());

      const user = await getOrCreateUser(message.author.id, message.guild.id);
      const xpGain = Math.floor(Math.random() * 10 + 5) * settings.xpMultiplier;
      user.xp += xpGain;
      user.textXp += xpGain;
      user.totalMessages += 1;

      const xpNeeded = calculateXpForLevel(user.level);
      if (user.xp >= xpNeeded) {
        user.xp -= xpNeeded;
        user.level += 1;
        if (settings.logChannel) {
          const ch = message.guild.channels.cache.get(settings.logChannel) as any;
          if (ch) {
            await ch.send(`🎉 <@${message.author.id}> leveled up to **Level ${user.level}**!`);
          }
        }
      }
      await user.save();
    } catch (err) {
      logger.error(`messageCreate error: ${err}`);
    }
  },
};
