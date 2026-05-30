import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getOrCreateEconomy, formatMoney, addTransaction } from "../../utils/helpers.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

export default {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName("transfer")
    .setDescription("Transfer money to another user")
    .addUserOption((o) => o.setName("user").setDescription("User to send money to").setRequired(true))
    .addIntegerOption((o) => o.setName("amount").setDescription("Amount to transfer").setRequired(true).setMinValue(1)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed("Invalid", "You cannot transfer money to yourself.")], ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ embeds: [errorEmbed("Invalid", "You cannot transfer money to bots.")], ephemeral: true });
    }

    const senderEco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
    const targetEco = await getOrCreateEconomy(target.id, interaction.guildId!);

    const tax = Math.floor(amount * 0.05);
    const net = amount - tax;

    if (amount > senderEco.wallet) {
      return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `You only have **${formatMoney(senderEco.wallet)}** in your wallet.`)], ephemeral: true });
    }

    senderEco.wallet -= amount;
    senderEco.totalSpent += amount;
    targetEco.wallet += net;
    targetEco.totalEarned += net;

    await senderEco.save();
    await targetEco.save();

    await addTransaction(interaction.user.id, interaction.guildId!, "transfer_out", -amount, `Sent to ${target.tag}`);
    await addTransaction(target.id, interaction.guildId!, "transfer_in", net, `Received from ${interaction.user.tag}`);

    await interaction.reply({
      embeds: [
        successEmbed("Transfer Successful", `You sent **${formatMoney(net)}** to <@${target.id}>`)
          .addFields(
            { name: "💸 Sent", value: formatMoney(amount), inline: true },
            { name: "🏛️ Tax (5%)", value: formatMoney(tax), inline: true },
            { name: "✅ Received", value: formatMoney(net), inline: true },
            { name: "👛 Your Balance", value: formatMoney(senderEco.wallet), inline: true },
          ),
      ],
    });
  },
};
