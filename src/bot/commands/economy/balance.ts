import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getOrCreateEconomy, getOrCreateUser, formatMoney } from "../../utils/helpers.js";
import { economyEmbed } from "../../utils/embeds.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your wallet and bank balance")
    .addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const eco = await getOrCreateEconomy(target.id, interaction.guildId!);
    const user = await getOrCreateUser(target.id, interaction.guildId!);

    const embed = economyEmbed(
      `${target.displayName}'s Balance`,
      `Here is the financial overview for <@${target.id}>`
    )
      .addFields(
        { name: "👛 Wallet", value: formatMoney(eco.wallet), inline: true },
        { name: "🏦 Bank", value: `${formatMoney(eco.bank)} / ${formatMoney(eco.bankLimit)}`, inline: true },
        { name: "💳 Net Worth", value: formatMoney(eco.wallet + eco.bank), inline: true },
        { name: "📈 Total Earned", value: formatMoney(eco.totalEarned), inline: true },
        { name: "📉 Total Spent", value: formatMoney(eco.totalSpent), inline: true },
        { name: "💸 Debt", value: formatMoney(eco.debt), inline: true },
        { name: "⭐ VIP Tier", value: user.vip.tier.toUpperCase() || "None", inline: true },
      )
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `VIP Bank Limit: ${formatMoney(eco.bankLimit)}` });

    await interaction.reply({ embeds: [embed] });
  },
};
