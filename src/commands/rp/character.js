import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const DEF = { active: null, list: {} };

export default {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('Manage your RP characters')
    .addSubcommand(s => s.setName('create').setDescription('Create a new character')
      .addStringOption(o => o.setName('name').setDescription('Character name').setRequired(true))
      .addIntegerOption(o => o.setName('age').setDescription('Character age').setRequired(true).setMinValue(18).setMaxValue(80))
      .addStringOption(o => o.setName('bio').setDescription('Short bio').setRequired(false)))
    .addSubcommand(s => s.setName('view').setDescription('View your active character'))
    .addSubcommand(s => s.setName('list').setDescription('List all your characters'))
    .addSubcommand(s => s.setName('switch').setDescription('Switch active character')
      .addStringOption(o => o.setName('name').setDescription('Character name to switch to').setRequired(true)))
    .addSubcommand(s => s.setName('delete').setDescription('Delete a character')
      .addStringOption(o => o.setName('name').setDescription('Character name to delete').setRequired(true))),

  async execute(interaction) {
    const userId = interaction.user.id;
    const sub = interaction.options.getSubcommand();
    const chars = getUser('characters', userId, DEF);

    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const age = interaction.options.getInteger('age');
      const bio = interaction.options.getString('bio') ?? 'No bio set.';
      const key = name.toLowerCase().replace(/\s+/g, '_');

      if (chars.list[key]) return interaction.reply({ content: `❌ A character named **${name}** already exists.`, ephemeral: true });
      if (Object.keys(chars.list).length >= 5) return interaction.reply({ content: '❌ You can only have 5 characters.', ephemeral: true });

      chars.list[key] = { name, age, bio, createdAt: Date.now(), inventory: [], licenses: [] };
      if (!chars.active) chars.active = key;
      saveUser('characters', userId, chars);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🎭 Character Created').setColor(0x9b59b6)
        .setDescription(`**${name}** (Age ${age})\n${bio}`).setFooter({ text: chars.active === key ? 'Now set as active' : 'Use /character switch to activate' })] });
    }

    if (sub === 'view') {
      if (!chars.active || !chars.list[chars.active]) return interaction.reply({ content: '❌ No active character. Use `/character create` first.', ephemeral: true });
      const c = chars.list[chars.active];
      const embed = new EmbedBuilder().setTitle(`🎭 ${c.name}`).setColor(0x9b59b6)
        .addFields(
          { name: 'Age', value: `${c.age}`, inline: true },
          { name: 'Inventory', value: c.inventory.length ? c.inventory.join(', ') : 'Empty', inline: true },
          { name: 'Licenses', value: c.licenses.length ? c.licenses.join(', ') : 'None', inline: true },
          { name: 'Bio', value: c.bio },
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'list') {
      const keys = Object.keys(chars.list);
      if (!keys.length) return interaction.reply({ content: '❌ You have no characters yet.', ephemeral: true });
      const desc = keys.map(k => `${chars.active === k ? '✅' : '◻️'} **${chars.list[k].name}** (Age ${chars.list[k].age})`).join('\n');
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🎭 Your Characters').setColor(0x9b59b6).setDescription(desc)] });
    }

    if (sub === 'switch') {
      const name = interaction.options.getString('name');
      const key = name.toLowerCase().replace(/\s+/g, '_');
      if (!chars.list[key]) return interaction.reply({ content: `❌ No character named **${name}** found.`, ephemeral: true });
      chars.active = key;
      saveUser('characters', userId, chars);
      return interaction.reply({ content: `✅ Switched active character to **${chars.list[key].name}**.` });
    }

    if (sub === 'delete') {
      const name = interaction.options.getString('name');
      const key = name.toLowerCase().replace(/\s+/g, '_');
      if (!chars.list[key]) return interaction.reply({ content: `❌ No character named **${name}** found.`, ephemeral: true });
      delete chars.list[key];
      if (chars.active === key) chars.active = Object.keys(chars.list)[0] ?? null;
      saveUser('characters', userId, chars);
      return interaction.reply({ content: `🗑️ Character **${name}** deleted.` });
    }
  },
};
