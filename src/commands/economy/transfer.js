import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const ECO_DEF = { wallet: 500, bank: 0, xp: 0, level: 1 };

export default {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Send money to another user')
    .addUserOption(o => o.setName('user').setDescription('Who to send money to').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to send').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (target.id === userId) return interaction.reply({ content: '❌ You cannot transfer to yourself.', ephemeral: true });
    if (target.bot) return interaction.reply({ content: '❌ Cannot transfer to a bot.', ephemeral: true });

    const eco = getUser('economy', userId, ECO_DEF);
    if ((eco.wallet ?? 0) < amount) {
      return interaction.reply({ content: `❌ Insufficient funds. You have $${eco.wallet} in your wallet.`, ephemeral: true });
    }

    const targetEco = getUser('economy', target.id, ECO_DEF);
    eco.wallet -= amount;
    targetEco.wallet = (targetEco.wallet ?? 0) + amount;
    saveUser('economy', userId, eco);
    saveUser('economy', target.id, targetEco);

    const embed = new EmbedBuilder()
      .setTitle('💸 Transfer Complete')
      .setColor(0x2ecc71)
      .setDescription(`You sent **$${amount.toLocaleString()}** to **${target.username}**`)
      .addFields(
        { name: '👛 Your Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true },
        { name: '📤 Sent', value: `$${amount.toLocaleString()}`, inline: true },
        { name: '👤 Recipient', value: target.username, inline: true },
      );
    await interaction.reply({ embeds: [embed] });
  },
};
