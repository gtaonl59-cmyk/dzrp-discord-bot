import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation tools')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName('ban').setDescription('Ban a user')
      .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)))
    .addSubcommand(s => s.setName('kick').setDescription('Kick a user')
      .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)))
    .addSubcommand(s => s.setName('warn').setDescription('Warn a user')
      .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)))
    .addSubcommand(s => s.setName('warnings').setDescription('View warnings for a user')
      .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true)))
    .addSubcommand(s => s.setName('clearwarnings').setDescription('Clear all warnings for a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('timeout').setDescription('Timeout a user')
      .addUserOption(o => o.setName('user').setDescription('User to timeout').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(10080)))
    .addSubcommand(s => s.setName('purge').setDescription('Delete messages')
      .addIntegerOption(o => o.setName('amount').setDescription('Number of messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (sub === 'ban') {
      const member = await interaction.guild?.members.fetch(target.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
      await member.ban({ reason }).catch(() => null);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🔨 User Banned').setColor(0xe74c3c)
          .addFields({ name: 'User', value: target.username, inline: true }, { name: 'Reason', value: reason, inline: true })],
      });
    }

    if (sub === 'kick') {
      const member = await interaction.guild?.members.fetch(target.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
      await member.kick(reason).catch(() => null);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('👟 User Kicked').setColor(0xe67e22)
          .addFields({ name: 'User', value: target.username, inline: true }, { name: 'Reason', value: reason, inline: true })],
      });
    }

    if (sub === 'warn') {
      const warnings = getUser('warnings', target.id, { list: [] });
      warnings.list.push({ reason, by: interaction.user.id, at: Date.now() });
      saveUser('warnings', target.id, warnings);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('⚠️ Warning Issued').setColor(0xf1c40f)
          .addFields(
            { name: 'User', value: target.username, inline: true },
            { name: 'Warning #', value: `${warnings.list.length}`, inline: true },
            { name: 'Reason', value: reason },
          )],
      });
    }

    if (sub === 'warnings') {
      const warnings = getUser('warnings', target.id, { list: [] });
      if (!warnings.list.length) return interaction.reply({ content: `✅ **${target.username}** has no warnings.` });
      const desc = warnings.list.map((w, i) => `**${i + 1}.** ${w.reason} — <t:${Math.floor(w.at / 1000)}:R>`).join('\n');
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle(`⚠️ Warnings for ${target.username}`).setColor(0xf1c40f).setDescription(desc)],
      });
    }

    if (sub === 'clearwarnings') {
      saveUser('warnings', target.id, { list: [] });
      return interaction.reply({ content: `✅ All warnings cleared for **${target.username}**.` });
    }

    if (sub === 'timeout') {
      const minutes = interaction.options.getInteger('minutes');
      const member = await interaction.guild?.members.fetch(target.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
      await member.timeout(minutes * 60 * 1000, reason).catch(() => null);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🔇 User Timed Out').setColor(0x95a5a6)
          .addFields(
            { name: 'User', value: target.username, inline: true },
            { name: 'Duration', value: `${minutes} minute(s)`, inline: true },
            { name: 'Reason', value: reason },
          )],
      });
    }

    if (sub === 'purge') {
      const amount = interaction.options.getInteger('amount');
      await interaction.deferReply({ ephemeral: true });
      const deleted = await interaction.channel?.bulkDelete(amount, true).catch(() => null);
      return interaction.editReply({ content: `✅ Deleted **${deleted?.size ?? 0}** messages.` });
    }
  },
};
