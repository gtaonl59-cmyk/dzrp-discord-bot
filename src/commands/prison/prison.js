import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('prison')
    .setDescription('Manage the prison system')
    .addSubcommand(s => s.setName('jail').setDescription('Send a user to prison (mod only)')
      .addUserOption(o => o.setName('user').setDescription('User to jail').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Sentence in minutes').setRequired(true).setMinValue(1).setMaxValue(1440))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)))
    .addSubcommand(s => s.setName('release').setDescription('Release a user early (mod only)')
      .addUserOption(o => o.setName('user').setDescription('User to release').setRequired(true)))
    .addSubcommand(s => s.setName('status').setDescription('Check your prison status'))
    .addSubcommand(s => s.setName('check').setDescription('Check another user\'s status')
      .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'jail') {
      if (!interaction.member.permissions.has('ModerateMembers')) {
        return interaction.reply({ content: '❌ You need Moderate Members permission.', ephemeral: true });
      }
      const target = interaction.options.getUser('user');
      const minutes = interaction.options.getInteger('minutes');
      const reason = interaction.options.getString('reason') ?? 'No reason given';
      const release = Date.now() + minutes * 60 * 1000;

      saveUser('prison', target.id, { jailed: true, release, reason, jailedBy: userId, jailedAt: Date.now() });
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🔒 Jailed').setColor(0xe74c3c)
          .addFields(
            { name: 'User', value: target.username, inline: true },
            { name: 'Sentence', value: `${minutes} minute(s)`, inline: true },
            { name: 'Reason', value: reason },
          )],
      });
    }

    if (sub === 'release') {
      if (!interaction.member.permissions.has('ModerateMembers')) {
        return interaction.reply({ content: '❌ You need Moderate Members permission.', ephemeral: true });
      }
      const target = interaction.options.getUser('user');
      const prison = getUser('prison', target.id, { jailed: false });
      if (!prison.jailed) return interaction.reply({ content: '❌ That user is not in prison.', ephemeral: true });
      saveUser('prison', target.id, { jailed: false, release: 0, reason: null });
      return interaction.reply({ content: `✅ **${target.username}** has been released from prison.` });
    }

    if (sub === 'status') {
      const prison = getUser('prison', userId, { jailed: false });
      if (!prison.jailed || prison.release <= Date.now()) {
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🟢 You are free!').setColor(0x2ecc71).setDescription('You are not currently in prison.')] });
      }
      const remaining = prison.release - Date.now();
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('🔒 You are in Prison').setColor(0xe74c3c)
          .addFields(
            { name: 'Time Remaining', value: `${m}m ${s}s`, inline: true },
            { name: 'Reason', value: prison.reason ?? 'Unknown', inline: true },
          )],
      });
    }

    if (sub === 'check') {
      const target = interaction.options.getUser('user');
      const prison = getUser('prison', target.id, { jailed: false });
      if (!prison.jailed || prison.release <= Date.now()) {
        return interaction.reply({ content: `✅ **${target.username}** is not in prison.` });
      }
      const remaining = prison.release - Date.now();
      const m = Math.floor(remaining / 60000);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle(`🔒 ${target.username} is in Prison`).setColor(0xe74c3c)
          .addFields(
            { name: 'Time Remaining', value: `${m}m`, inline: true },
            { name: 'Reason', value: prison.reason ?? 'Unknown', inline: true },
          )],
      });
    }
  },
};
