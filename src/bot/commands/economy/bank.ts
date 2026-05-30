import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getOrCreateEconomy, formatMoney, addTransaction } from "../../utils/helpers.js";
import { economyEmbed, errorEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("bank")
    .setDescription("Bank operations: deposit, withdraw, or check info")
    .addSubcommand((s) =>
      s.setName("deposit").setDescription("Deposit money into your bank")
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount to deposit").setRequired(true).setMinValue(1))
    )
    .addSubcommand((s) =>
      s.setName("withdraw").setDescription("Withdraw money from your bank")
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount to withdraw").setRequired(true).setMinValue(1))
    )
    .addSubcommand((s) => s.setName("info").setDescription("View your bank information")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);

    if (sub === "info") {
      return interaction.reply({
        embeds: [
          economyEmbed("🏦 Bank Information", `Account overview for <@${interaction.user.id}>`)
            .addFields(
              { name: "👛 Wallet", value: formatMoney(eco.wallet), inline: true },
              { name: "🏦 Bank Balance", value: formatMoney(eco.bank), inline: true },
              { name: "📊 Bank Limit", value: formatMoney(eco.bankLimit), inline: true },
              { name: "💳 Available Space", value: formatMoney(eco.bankLimit - eco.bank), inline: true },
              { name: "💸 Debt", value: formatMoney(eco.debt), inline: true },
              { name: "📈 Total Earned", value: formatMoney(eco.totalEarned), inline: true },
            ),
        ],
      });
    }

    const amount = interaction.options.getInteger("amount", true);

    if (sub === "deposit") {
      if (amount > eco.wallet) {
        return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `You only have **${formatMoney(eco.wallet)}** in your wallet.`)], ephemeral: true });
      }
      if (eco.bank + amount > eco.bankLimit) {
        return interaction.reply({ embeds: [errorEmbed("Bank Full", `Your bank limit is **${formatMoney(eco.bankLimit)}**. You can only deposit **${formatMoney(eco.bankLimit - eco.bank)}** more.`)], ephemeral: true });
      }
      eco.wallet -= amount;
      eco.bank += amount;
      await eco.save();
      await addTransaction(interaction.user.id, interaction.guildId!, "deposit", amount, "Bank deposit");
      return interaction.reply({ embeds: [successEmbed("Deposit Successful", `Deposited **${formatMoney(amount)}** into your bank.\n\n👛 Wallet: **${formatMoney(eco.wallet)}**\n🏦 Bank: **${formatMoney(eco.bank)}**`)] });
    }

    if (sub === "withdraw") {
      if (amount > eco.bank) {
        return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `You only have **${formatMoney(eco.bank)}** in your bank.`)], ephemeral: true });
      }
      eco.bank -= amount;
      eco.wallet += amount;
      await eco.save();
      await addTransaction(interaction.user.id, interaction.guildId!, "withdraw", amount, "Bank withdrawal");
      return interaction.reply({ embeds: [successEmbed("Withdrawal Successful", `Withdrew **${formatMoney(amount)}** from your bank.\n\n👛 Wallet: **${formatMoney(eco.wallet)}**\n🏦 Bank: **${formatMoney(eco.bank)}**`)] });
    }
  },
};
