import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser } from '../../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('do')
    .setDescription('Describe something happening in the scene')
    .addStringOption(o => o.setName('text').setDescription('Scene description').setRequired(true)),

  async execute(interaction) {
    const chars = getUser('characters', interaction.user.id, { active: null, list: {} });
    if (!chars.active || !chars.list[chars.active]) {
      return interaction.reply({ content: '❌ No active character. Use `/character create` first.', ephemeral: true });
    }
    const c = chars.list[chars.active];
    const text = interaction.options.getString('text');

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xe67e22)
        .setDescription(`📖 *${text}*`)
        .setFooter({ text: `Scene by ${c.name} • Played by ${interaction.user.username}` })],
    });
  },
};
