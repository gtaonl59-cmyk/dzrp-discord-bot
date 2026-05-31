import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser } from '../../storage.js';

const ECO_DEFAULTS = { wallet: 500, bank: 0, xp: 0, level: 1 };

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your wallet and bank balance')
    .addUserOption(o => o.setName('user').setDescription('Check another user').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const eco = getUser('economy', target.id, ECO_DEFAULTS);

    const embed = new EmbedBuilder()
      .setTitle(`💰 ${target.username}'s Balance`)
      .setColor(0x2ecc71)
      .addFields(
        { name: '👛 Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true },
        { name: '🏦 Bank', value: `$${eco.bank.toLocaleString()}`, inline: true },
        { name: '💵 Net Worth', value: `$${(eco.wallet + eco.bank).toLocaleString()}`, inline: true },
      )
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `Level ${eco.level} • ${eco.xp} XP` });

    await interaction.reply({ embeds: [embed] });
  },
};
