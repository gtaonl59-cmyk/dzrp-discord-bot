import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View or manage your character inventory')
    .addSubcommand(s => s.setName('view').setDescription('View your inventory'))
    .addSubcommand(s => s.setName('add').setDescription('Add an item (admin/mod)')
      .addStringOption(o => o.setName('item').setDescription('Item name').setRequired(true))
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove an item (admin/mod)')
      .addStringOption(o => o.setName('item').setDescription('Item name').setRequired(true))
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const userId = targetUser.id;
    const chars = getUser('characters', userId, { active: null, list: {} });

    if (!chars.active || !chars.list[chars.active]) {
      return interaction.reply({ content: '❌ No active character found.', ephemeral: true });
    }
    const c = chars.list[chars.active];

    if (sub === 'view') {
      const items = c.inventory?.length ? c.inventory.map((i, n) => `${n + 1}. ${i}`).join('\n') : '*Empty*';
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle(`🎒 ${c.name}'s Inventory`).setColor(0x8e44ad).setDescription(items)],
      });
    }

    if (!interaction.member.permissions.has('ManageMessages')) {
      return interaction.reply({ content: '❌ Only moderators can add/remove inventory items.', ephemeral: true });
    }

    const item = interaction.options.getString('item');
    if (sub === 'add') {
      c.inventory = c.inventory ?? [];
      c.inventory.push(item);
      saveUser('characters', userId, chars);
      return interaction.reply({ content: `✅ Added **${item}** to ${c.name}'s inventory.` });
    }
    if (sub === 'remove') {
      const idx = (c.inventory ?? []).indexOf(item);
      if (idx === -1) return interaction.reply({ content: `❌ Item **${item}** not found.`, ephemeral: true });
      c.inventory.splice(idx, 1);
      saveUser('characters', userId, chars);
      return interaction.reply({ content: `✅ Removed **${item}** from ${c.name}'s inventory.` });
    }
  },
};
