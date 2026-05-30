import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  getOrCreateEconomy,
  getOrCreateUser,
  formatMoney,
  cooldownRemaining,
  formatDuration,
  getVipMultiplier,
  addTransaction,
} from "../../utils/helpers.js";
import { economyEmbed, errorEmbed } from "../../utils/embeds.js";

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const DAILY_BASE = 1000;

export default {
  cooldown: 5,
  data: new SlashCommandBuilder().setName("daily").setDescription("Claim your daily reward"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guildId!);
    const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);

    const remaining = cooldownRemaining(eco.lastDaily, DAILY_COOLDOWN);
    if (remaining > 0) {
      return interaction.reply({
        embeds: [errorEmbed("Daily Cooldown", `You already claimed your daily reward. Come back in **${formatDuration(remaining)}**.`)],
        ephemeral: true,
      });
    }

    const multiplier = getVipMultiplier(user.vip.tier);
    const reward = Math.floor(DAILY_BASE * multiplier);

    eco.wallet += reward;
    eco.totalEarned += reward;
    eco.lastDaily = new Date();
    await eco.save();
    await addTransaction(interaction.user.id, interaction.guildId!, "daily", reward, "Daily reward");

    const embed = economyEmbed("Daily Reward Claimed!", `You received **${formatMoney(reward)}**!`)
      .addFields(
        { name: "💰 Reward", value: formatMoney(reward), inline: true },
        { name: "⭐ VIP Multiplier", value: `${multiplier}x`, inline: true },
        { name: "👛 New Balance", value: formatMoney(eco.wallet), inline: true },
      )
      .setFooter({ text: "Come back in 24 hours for your next reward!" });

    await interaction.reply({ embeds: [embed] });
  },
};
