import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser } from '../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your full RP profile')
    .addUserOption(o => o.setName('user').setDescription('View another user\'s profile').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const eco = getUser('economy', target.id, { wallet: 500, bank: 0, xp: 0, level: 1 });
    const chars = getUser('characters', target.id, { active: null, list: {} });
    const jobs = getUser('jobs', target.id, { job: null });
    const vip = getUser('vip', target.id, { tier: 'none' });
    const owned = getUser('properties', target.id, { owned: [] });
    const garage = getUser('vehicles', target.id, { owned: [] });
    const membership = getUser('gang_members', target.id, { gangId: null });

    const activeChar = chars.active ? chars.list[chars.active] : null;

    const xpNeeded = (eco.level ?? 1) * 500;
    const bar = '█'.repeat(Math.min(10, Math.floor(((eco.xp ?? 0) % 500) / 50))) + '░'.repeat(10 - Math.min(10, Math.floor(((eco.xp ?? 0) % 500) / 50)));

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.username}'s Profile`)
      .setThumbnail(target.displayAvatarURL())
      .setColor(0x3498db)
      .addFields(
        { name: '🎭 Character', value: activeChar ? `${activeChar.name} (Age ${activeChar.age})` : 'None', inline: true },
        { name: '💼 Job', value: jobs.job ?? 'Unemployed', inline: true },
        { name: '💎 VIP', value: vip.tier === 'none' ? 'None' : vip.tier.charAt(0).toUpperCase() + vip.tier.slice(1), inline: true },
        { name: '👛 Wallet', value: `$${(eco.wallet ?? 0).toLocaleString()}`, inline: true },
        { name: '🏦 Bank', value: `$${(eco.bank ?? 0).toLocaleString()}`, inline: true },
        { name: '💵 Net Worth', value: `$${((eco.wallet ?? 0) + (eco.bank ?? 0)).toLocaleString()}`, inline: true },
        { name: '🏠 Properties', value: `${owned.owned.length}`, inline: true },
        { name: '🚗 Vehicles', value: `${garage.owned.length}`, inline: true },
        { name: '💀 Gang', value: membership.gangId ?? 'None', inline: true },
        { name: `⭐ Level ${eco.level ?? 1} — ${eco.xp ?? 0} XP`, value: `\`${bar}\` ${(eco.xp ?? 0) % 500}/${xpNeeded} to next level` },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
