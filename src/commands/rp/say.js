import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser } from '../../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Speak in-character as your active character')
    .addStringOption(o => o.setName('text').setDescription('What to say').setRequired(true)),

  async execute(interaction) {
    const chars = getUser('characters', interaction.user.id, { active: null, list: {} });
    if (!chars.active || !chars.list[chars.active]) {
      return interaction.reply({ content: '❌ No active character. Use `/character create` first.', ephemeral: true });
    }
    const c = chars.list[chars.active];
    const text = interaction.options.getString('text');

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x3498db)
        .setAuthor({ name: `${c.name} says:` })
        .setDescription(`"${text}"`)
        .setFooter({ text: `Played by ${interaction.user.username}` })],
    });
  },
};
