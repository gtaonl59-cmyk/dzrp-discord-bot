import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAllUsers } from '../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View the economy leaderboard')
    .addSubcommand(s => s.setName('top').setDescription('Top 10 richest users'))
    .addSubcommand(s => s.setName('me').setDescription('See your rank')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const all = getAllUsers('economy');
    const sorted = Object.entries(all)
      .map(([id, d]) => ({ id, net: (d.wallet ?? 0) + (d.bank ?? 0), level: d.level ?? 1, xp: d.xp ?? 0 }))
      .sort((a, b) => b.net - a.net);

    if (sub === 'top') {
      const top = sorted.slice(0, 10);
      const desc = top.length
        ? top.map((u, i) => `**${i + 1}.** <@${u.id}> — $${u.net.toLocaleString()} (Lv.${u.level})`).join('\n')
        : '*No data yet.*';
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🏆 Economy Leaderboard').setColor(0xf1c40f).setDescription(desc)],
      });
    }

    if (sub === 'me') {
      const pos = sorted.findIndex(u => u.id === interaction.user.id);
      if (pos === -1) return interaction.reply({ content: '❌ You have no economy data yet. Use `/daily` to start!', ephemeral: true });
      const u = sorted[pos];
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('📊 Your Rank').setColor(0x3498db)
          .addFields(
            { name: 'Rank', value: `#${pos + 1} of ${sorted.length}`, inline: true },
            { name: 'Net Worth', value: `$${u.net.toLocaleString()}`, inline: true },
            { name: 'Level', value: `${u.level}`, inline: true },
          )],
      });
    }
  },
};
