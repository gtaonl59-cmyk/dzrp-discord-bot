import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, saveUser } from '../../storage.js';

const COOLDOWN = 2 * 60 * 60 * 1000;
const ECO_DEF = { wallet: 500, bank: 0, xp: 0, level: 1 };

export default {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Attempt to rob another user')
    .addUserOption(o => o.setName('target').setDescription('Who to rob').setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const target = interaction.options.getUser('target');

    if (target.id === userId) return interaction.reply({ content: '❌ You cannot rob yourself.', ephemeral: true });
    if (target.bot) return interaction.reply({ content: '❌ You cannot rob a bot.', ephemeral: true });

    const prison = getUser('prison', userId, { jailed: false });
    if (prison.jailed && prison.release > Date.now()) {
      return interaction.reply({ content: '🔒 You are in prison!', ephemeral: true });
    }

    const eco = getUser('economy', userId, ECO_DEF);
    const now = Date.now();
    if (now - (eco.lastRob ?? 0) < COOLDOWN) {
      const m = Math.floor((COOLDOWN - (now - eco.lastRob)) / 60000);
      return interaction.reply({ content: `⏳ Rob cooldown! Wait **${m}m**.`, ephemeral: true });
    }

    const targetEco = getUser('economy', target.id, ECO_DEF);
    if ((targetEco.wallet ?? 0) < 100) {
      return interaction.reply({ content: `❌ ${target.username} doesn't have enough in their wallet to rob.`, ephemeral: true });
    }

    eco.lastRob = now;
    const success = Math.random() < 0.45;

    if (success) {
      const amount = Math.floor(targetEco.wallet * (0.1 + Math.random() * 0.2));
      targetEco.wallet = (targetEco.wallet ?? 0) - amount;
      eco.wallet = (eco.wallet ?? 0) + amount;
      saveUser('economy', userId, eco);
      saveUser('economy', target.id, targetEco);

      const embed = new EmbedBuilder()
        .setTitle('🦹 Robbery Successful!')
        .setColor(0xe74c3c)
        .setDescription(`You robbed **${target.username}** and got away with **$${amount.toLocaleString()}**!`)
        .addFields({ name: '👛 Your Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true });
      return interaction.reply({ embeds: [embed] });
    } else {
      const fine = Math.floor((eco.wallet ?? 0) * 0.1);
      eco.wallet = Math.max(0, (eco.wallet ?? 0) - fine);
      saveUser('economy', userId, eco);

      const embed = new EmbedBuilder()
        .setTitle('🚔 Caught Red-Handed!')
        .setColor(0x95a5a6)
        .setDescription(`You tried to rob **${target.username}** but got caught! You paid **$${fine.toLocaleString()}** in fines.`)
        .addFields({ name: '👛 Your Wallet', value: `$${eco.wallet.toLocaleString()}`, inline: true });
      return interaction.reply({ embeds: [embed] });
    }
  },
};
