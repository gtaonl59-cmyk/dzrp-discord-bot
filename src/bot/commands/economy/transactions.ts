import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getOrCreateEconomy, formatMoney } from "../../utils/helpers.js";
import { Colors } from "../../utils/embeds.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("transactions")
    .setDescription("View your recent transaction history"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
    const recent = eco.transactions.slice(-15).reverse();

    if (!recent.length) {
      return interaction.reply({ content: "📭 No transactions found yet.", ephemeral: true });
    }

    const typeEmoji: Record<string, string> = {
      daily: "🎁", weekly: "🎁", monthly: "🎁",
      work: "💼", deposit: "⬇️", withdraw: "⬆️",
      transfer_in: "📥", transfer_out: "📤",
      casino: "🎰", wheel: "🎡",
      property_buy: "🏠", property_sell: "🏠",
      vehicle_buy: "🚗", vehicle_sell: "🚗",
      fine: "📋", loan: "💳",
    };

    const embed = new EmbedBuilder()
      .setColor(Colors.economy)
      .setTitle("💰 Transaction History")
      .setDescription(`Last ${recent.length} transactions for <@${interaction.user.id}>`);

    for (const t of recent) {
      const emoji = typeEmoji[t.type] ?? "💱";
      const sign = t.amount >= 0 ? "+" : "";
      const color = t.amount >= 0 ? "🟢" : "🔴";
      embed.addFields({
        name: `${emoji} ${t.description}`,
        value: `${color} **${sign}${formatMoney(t.amount)}** — <t:${Math.floor(new Date(t.timestamp).getTime() / 1000)}:R>`,
      });
    }

    embed.addFields(
      { name: "👛 Wallet", value: formatMoney(eco.wallet), inline: true },
      { name: "🏦 Bank", value: formatMoney(eco.bank), inline: true },
    ).setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
