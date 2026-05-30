import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  getOrCreateEconomy, getOrCreateUser, formatMoney,
  cooldownRemaining, formatDuration, getVipMultiplier, addTransaction,
} from "../../utils/helpers.js";
import { economyEmbed, errorEmbed } from "../../utils/embeds.js";

const WEEKLY_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
const WEEKLY_BASE = 10000;

export default {
  cooldown: 5,
  data: new SlashCommandBuilder().setName("weekly").setDescription("Claim your weekly reward"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);

    const remaining = cooldownRemaining(eco.lastWeekly, WEEKLY_COOLDOWN);
    if (remaining > 0) {
      return interaction.reply({
        embeds: [errorEmbed("Weekly Cooldown", `Come back in **${formatDuration(remaining)}**.`)],
        ephemeral: true,
      });
    }

    const multiplier = getVipMultiplier(user.vip.tier);
    const reward = Math.floor(WEEKLY_BASE * multiplier);
    eco.wallet += reward;
    eco.totalEarned += reward;
    eco.lastWeekly = new Date();
    await eco.save();
    await addTransaction(interaction.user.id, interaction.guildId!, "weekly", reward, "Weekly reward");

    await interaction.reply({
      embeds: [
        economyEmbed("Weekly Reward Claimed!", `You received **${formatMoney(reward)}**!`)
          .addFields(
            { name: "💰 Reward", value: formatMoney(reward), inline: true },
            { name: "⭐ VIP Multiplier", value: `${multiplier}x`, inline: true },
            { name: "👛 New Balance", value: formatMoney(eco.wallet), inline: true },
          ),
      ],
    });
  },
};
