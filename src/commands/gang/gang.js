import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { load, save, getUser, saveUser } from '../../storage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('gang')
    .setDescription('Manage your gang')
    .addSubcommand(s => s.setName('create').setDescription('Create a gang')
      .addStringOption(o => o.setName('name').setDescription('Gang name').setRequired(true)))
    .addSubcommand(s => s.setName('info').setDescription('View your gang info'))
    .addSubcommand(s => s.setName('list').setDescription('List all gangs'))
    .addSubcommand(s => s.setName('invite').setDescription('Invite a member')
      .addUserOption(o => o.setName('user').setDescription('User to invite').setRequired(true)))
    .addSubcommand(s => s.setName('kick').setDescription('Kick a member')
      .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true)))
    .addSubcommand(s => s.setName('leave').setDescription('Leave your gang')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const gangs = load('gangs');
    const membership = getUser('gang_members', userId, { gangId: null });

    const userGang = membership.gangId ? gangs[membership.gangId] : null;

    if (sub === 'create') {
      if (userGang) return interaction.reply({ content: '❌ You are already in a gang. Leave first.', ephemeral: true });
      const name = interaction.options.getString('name');
      const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      if (Object.values(gangs).some(g => g.name.toLowerCase() === name.toLowerCase())) {
        return interaction.reply({ content: '❌ A gang with that name already exists.', ephemeral: true });
      }
      gangs[id] = { id, name, leader: userId, members: [userId], bank: 0, createdAt: Date.now() };
      save('gangs', gangs);
      membership.gangId = id;
      saveUser('gang_members', userId, membership);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💀 Gang Created!').setColor(0xe74c3c)
          .setDescription(`**${name}** has been founded!\nYou are the leader.`)],
      });
    }

    if (sub === 'list') {
      const list = Object.values(gangs);
      if (!list.length) return interaction.reply({ content: '❌ No gangs exist yet.', ephemeral: true });
      const desc = list.map(g => `**${g.name}** — ${g.members.length} members`).join('\n');
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle('💀 All Gangs').setColor(0xe74c3c).setDescription(desc)],
      });
    }

    if (!userGang) return interaction.reply({ content: '❌ You are not in a gang.', ephemeral: true });

    if (sub === 'info') {
      const leader = await interaction.guild?.members.fetch(userGang.leader).catch(() => null);
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle(`💀 ${userGang.name}`).setColor(0xe74c3c)
          .addFields(
            { name: 'Leader', value: leader?.displayName ?? userGang.leader, inline: true },
            { name: 'Members', value: `${userGang.members.length}`, inline: true },
            { name: 'Gang Bank', value: `$${(userGang.bank ?? 0).toLocaleString()}`, inline: true },
          )],
      });
    }

    if (sub === 'invite') {
      if (userGang.leader !== userId) return interaction.reply({ content: '❌ Only the gang leader can invite members.', ephemeral: true });
      const target = interaction.options.getUser('user');
      const targetMembership = getUser('gang_members', target.id, { gangId: null });
      if (targetMembership.gangId) return interaction.reply({ content: '❌ That user is already in a gang.', ephemeral: true });
      userGang.members.push(target.id);
      save('gangs', gangs);
      targetMembership.gangId = membership.gangId;
      saveUser('gang_members', target.id, targetMembership);
      return interaction.reply({ content: `✅ **${target.username}** has been added to **${userGang.name}**!` });
    }

    if (sub === 'kick') {
      if (userGang.leader !== userId) return interaction.reply({ content: '❌ Only the gang leader can kick members.', ephemeral: true });
      const target = interaction.options.getUser('user');
      if (target.id === userId) return interaction.reply({ content: '❌ You cannot kick yourself.', ephemeral: true });
      if (!userGang.members.includes(target.id)) return interaction.reply({ content: '❌ That user is not in your gang.', ephemeral: true });
      userGang.members = userGang.members.filter(m => m !== target.id);
      save('gangs', gangs);
      const targetMem = getUser('gang_members', target.id, { gangId: null });
      targetMem.gangId = null;
      saveUser('gang_members', target.id, targetMem);
      return interaction.reply({ content: `✅ **${target.username}** has been kicked from **${userGang.name}**.` });
    }

    if (sub === 'leave') {
      if (userGang.leader === userId && userGang.members.length > 1) {
        return interaction.reply({ content: '❌ Transfer leadership or kick all members before leaving.', ephemeral: true });
      }
      userGang.members = userGang.members.filter(m => m !== userId);
      if (userGang.members.length === 0) {
        delete gangs[membership.gangId];
      }
      save('gangs', gangs);
      membership.gangId = null;
      saveUser('gang_members', userId, membership);
      return interaction.reply({ content: `✅ You have left **${userGang.name}**.` });
    }
  },
};
