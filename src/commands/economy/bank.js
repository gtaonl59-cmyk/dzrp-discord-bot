import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const ECO_DEF = { wallet: 500, bank: 0, xp: 0, level: 1 };

export default {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Deposit or withdraw money from your bank')
    .addStringOption(o =>
      o.setName('action').setDescription('deposit or withdraw').setRequired(true)
        .addChoices({ name: 'Deposit', value: 'deposit' }, { name: 'Withdraw', value: 'withdraw' }))
    .addIntegerOption(o =>
      o.setName('amount').setDescription('Amount (or 0 for all)').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const action = interaction.options.getString('action');
    const amount = interaction.options.getInteger('amount');
    const eco = getUser('economy', userId, ECO_DEF);

    if (action === 'deposit') {
      if ((eco.wallet ?? 0) < amount) {
        return interaction.reply({ content: `❌ You only have $${eco.wallet} in your wallet.`, ephemeral: true });
      }
      eco.wallet -= amount;
      eco.bank = (eco.bank ?? 0) + amount;
      saveUser('economy', userId, eco);

      const embed = new EmbedBuilder()
        .setTitle('🏦 Deposit Successful')
        .setColor(0x2ecc71)
        .addFields(
          { name: '📥 Deposited', value: `$${amount.toLocaleString()}`, inline: true },
          { name: '👛 Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true },
          { name: '🏦 Bank', value: `$${eco.bank.toLocaleString()}`, inline: true },
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (action === 'withdraw') {
      if ((eco.bank ?? 0) < amount) {
        return interaction.reply({ content: `❌ You only have $${eco.bank} in your bank.`, ephemeral: true });
      }
      eco.bank -= amount;
      eco.wallet = (eco.wallet ?? 0) + amount;
      saveUser('economy', userId, eco);

      const embed = new EmbedBuilder()
        .setTitle('🏦 Withdrawal Successful')
        .setColor(0x3498db)
        .addFields(
          { name: '📤 Withdrawn', value: `$${amount.toLocaleString()}`, inline: true },
          { name: '👛 Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true },
          { name: '🏦 Bank', value: `$${eco.bank.toLocaleString()}`, inline: true },
        );
      return interaction.reply({ embeds: [embed] });
    }
  },
};
