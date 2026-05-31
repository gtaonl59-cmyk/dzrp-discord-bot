import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const CATEGORIES = [
  { name: '💰 Economy', cmds: '`/balance` `/daily` `/weekly` `/work` `/rob` `/bank` `/transfer`' },
  { name: '🎭 Roleplay', cmds: '`/character` `/me` `/say` `/do` `/inventory`' },
  { name: '💼 Jobs', cmds: '`/job list` `/job apply` `/job quit` `/job info`' },
  { name: '🏠 Property', cmds: '`/property listings` `/property buy` `/property myproperties` `/property sell`' },
  { name: '🚗 Vehicles', cmds: '`/vehicle dealership` `/vehicle buy` `/vehicle garage` `/vehicle sell`' },
  { name: '💀 Gang', cmds: '`/gang create` `/gang info` `/gang list` `/gang invite` `/gang kick` `/gang leave`' },
  { name: '🔒 Prison', cmds: '`/prison jail` `/prison release` `/prison status` `/prison check`' },
  { name: '🎮 Fun', cmds: '`/fun coinflip` `/fun dice` `/fun casino` `/fun rps` `/fun trivia`' },
  { name: '👤 Profile', cmds: '`/profile` `/rank top` `/rank me`' },
  { name: '💎 VIP', cmds: '`/vip info` `/vip buy` `/vip status` `/vip grant`' },
  { name: '🛡️ Moderation', cmds: '`/mod ban` `/mod kick` `/mod warn` `/mod warnings` `/mod timeout` `/mod purge`' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all bot commands and categories'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📋 RP City Bot — Command List')
      .setColor(0x3498db)
      .setDescription('Here is everything this bot can do:')
      .setFooter({ text: 'RP City Bot • All data stored locally as JSON' });

    for (const cat of CATEGORIES) {
      embed.addFields({ name: cat.name, value: cat.cmds });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
