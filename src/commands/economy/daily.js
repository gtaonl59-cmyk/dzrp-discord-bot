import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const ECO_DEFAULTS = { wallet: 500, bank: 0, xp: 0, level: 1, lastDaily: 0, lastWeekly: 0 };
const COOLDOWN = 24 * 60 * 60 * 1000;
const BASE_REWARD = 500;
const VIP_MULT = { none: 1, bronze: 1.25, silver: 1.5, gold: 2, platinum: 2.5, diamond: 3 };

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Collect your daily reward ($500)'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const eco = getUser('economy', userId, ECO_DEFAULTS);
    const vip = getUser('vip', userId, { tier: 'none' });
    const now = Date.now();

    if (now - (eco.lastDaily ?? 0) < COOLDOWN) {
      const remaining = COOLDOWN - (now - eco.lastDaily);
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      return interaction.reply({ content: `⏳ Daily already claimed! Come back in **${h}h ${m}m**.`, ephemeral: true });
    }

    const mult = VIP_MULT[vip.tier] ?? 1;
    const reward = Math.floor(BASE_REWARD * mult);
    eco.wallet = (eco.wallet ?? 0) + reward;
    eco.xp = (eco.xp ?? 0) + 50;
    eco.level = Math.floor(eco.xp / 500) + 1;
    eco.lastDaily = now;
    saveUser('economy', userId, eco);

    const embed = new EmbedBuilder()
      .setTitle('🎁 Daily Reward Claimed!')
      .setColor(0xf1c40f)
      .setDescription(`You received **$${reward.toLocaleString()}**!`)
      .addFields(
        { name: '👛 New Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true },
        { name: '⭐ XP Gained', value: '+50 XP', inline: true },
        { name: '🔥 Multiplier', value: `${mult}x (${vip.tier})`, inline: true },
      );
    await interaction.reply({ embeds: [embed] });
  },
};
