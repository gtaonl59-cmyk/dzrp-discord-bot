import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser } from '../../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('me')
    .setDescription('Perform a roleplay action as your character')
    .addStringOption(o => o.setName('action').setDescription('What your character does').setRequired(true)),

  async execute(interaction) {
    const chars = getUser('characters', interaction.user.id, { active: null, list: {} });
    if (!chars.active || !chars.list[chars.active]) {
      return interaction.reply({ content: '❌ No active character. Use `/character create` first.', ephemeral: true });
    }
    const c = chars.list[chars.active];
    const action = interaction.options.getString('action');

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x8e44ad)
        .setDescription(`*${c.name} ${action}*`)
        .setFooter({ text: `Played by ${interaction.user.username}` })],
    });
  },
};
