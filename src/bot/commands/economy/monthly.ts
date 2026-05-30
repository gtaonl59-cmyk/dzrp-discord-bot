import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  getOrCreateEconomy, getOrCreateUser, formatMoney,
  cooldownRemaining, formatDuration, getVipMultiplier, addTransaction,
} from "../../utils/helpers.js";
import { economyEmbed, errorEmbed } from "../../utils/embeds.js";

const MONTHLY_COOLDOWN = 30 * 24 * 60 * 60 * 1000;
const MONTHLY_BASE = 50000;

export default {
  cooldown: 5,
  data: new SlashCommandBuilder().setName("monthly").setDescription("Claim your monthly reward"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);

    const remaining = cooldownRemaining(eco.lastMonthly, MONTHLY_COOLDOWN);
    if (remaining > 0) {
      return interaction.reply({
        embeds: [errorEmbed("Monthly Cooldown", `Come back in **${formatDuration(remaining)}**.`)],
        ephemeral: true,
      });
    }

    const multiplier = getVipMultiplier(user.vip.tier);
    const reward = Math.floor(MONTHLY_BASE * multiplier);
    eco.wallet += reward;
    eco.totalEarned += reward;
    eco.lastMonthly = new Date();
    await eco.save();
    await addTransaction(interaction.user.id, interaction.guildId!, "monthly", reward, "Monthly reward");

    await interaction.reply({
      embeds: [
        economyEmbed("Monthly Reward Claimed! 🎊", `You received **${formatMoney(reward)}**!`)
          .addFields(
            { name: "💰 Reward", value: formatMoney(reward), inline: true },
            { name: "⭐ VIP Multiplier", value: `${multiplier}x`, inline: true },
            { name: "👛 New Balance", value: formatMoney(eco.wallet), inline: true },
          ),
      ],
    });
  },
};
