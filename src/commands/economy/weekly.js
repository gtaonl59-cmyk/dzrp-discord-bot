import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const ECO_DEFAULTS = { wallet: 500, bank: 0, xp: 0, level: 1, lastDaily: 0, lastWeekly: 0 };
const COOLDOWN = 7 * 24 * 60 * 60 * 1000;
const BASE_REWARD = 2500;
const VIP_MULT = { none: 1, bronze: 1.25, silver: 1.5, gold: 2, platinum: 2.5, diamond: 3 };

export default {
  data: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('Collect your weekly reward ($2,500)'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const eco = getUser('economy', userId, ECO_DEFAULTS);
    const vip = getUser('vip', userId, { tier: 'none' });
    const now = Date.now();

    if (now - (eco.lastWeekly ?? 0) < COOLDOWN) {
      const remaining = COOLDOWN - (now - eco.lastWeekly);
      const d = Math.floor(remaining / 86400000);
      const h = Math.floor((remaining % 86400000) / 3600000);
      return interaction.reply({ content: `⏳ Weekly already claimed! Come back in **${d}d ${h}h**.`, ephemeral: true });
    }

    const mult = VIP_MULT[vip.tier] ?? 1;
    const reward = Math.floor(BASE_REWARD * mult);
    eco.wallet = (eco.wallet ?? 0) + reward;
    eco.xp = (eco.xp ?? 0) + 200;
    eco.level = Math.floor(eco.xp / 500) + 1;
    eco.lastWeekly = now;
    saveUser('economy', userId, eco);

    const embed = new EmbedBuilder()
      .setTitle('🎉 Weekly Reward Claimed!')
      .setColor(0x9b59b6)
      .setDescription(`You received **$${reward.toLocaleString()}**!`)
      .addFields(
        { name: '👛 New Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true },
        { name: '⭐ XP Gained', value: '+200 XP', inline: true },
        { name: '🔥 Multiplier', value: `${mult}x (${vip.tier})`, inline: true },
      );
    await interaction.reply({ embeds: [embed] });
  },
};
