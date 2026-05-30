import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getOrCreateUser, getOrCreateEconomy, calculateXpForLevel, VIP_TIERS } from "../../utils/helpers.js";
import { Colors } from "../../utils/embeds.js";
import Character from "../../models/Character.js";

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your or another user's profile")
    .addUserOption((o) => o.setName("user").setDescription("User to view").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const user = await getOrCreateUser(target.id, interaction.guildId!);
    const eco = await getOrCreateEconomy(target.id, interaction.guildId!);
    const char = await Character.findOne({ userId: target.id, guildId: interaction.guildId, isActive: true });

    const vipTier = VIP_TIERS.find((t) => t.id === user.vip.tier);
    const color = vipTier?.color ?? Colors.primary;
    const xpNeeded = calculateXpForLevel(user.level);
    const xpBar = buildXpBar(user.xp, xpNeeded);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${vipTier?.emoji ?? "👤"} ${target.displayName}'s Profile`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "⭐ Level", value: `${user.level}`, inline: true },
        { name: "✨ XP", value: `${user.xp} / ${xpNeeded}\n${xpBar}`, inline: true },
        { name: "💎 VIP", value: vipTier ? `${vipTier.emoji} ${vipTier.name}` : "None", inline: true },
        { name: "💰 Net Worth", value: `$${(eco.wallet + eco.bank).toLocaleString()}`, inline: true },
        { name: "💬 Messages", value: `${user.totalMessages.toLocaleString()}`, inline: true },
        { name: "⭐ Reputation", value: `${user.reputation}`, inline: true },
        { name: "🏆 Achievements", value: `${user.achievements.length}`, inline: true },
        { name: "🎖️ Badges", value: user.badges.length ? user.badges.join(" ") : "None", inline: true },
        { name: "⚠️ Warnings", value: `${user.warnings.length}`, inline: true },
      );

    if (char) {
      embed.addFields({
        name: "🎭 Active Character",
        value: `**${char.name}** | Age: ${char.age} | Job: ${char.job} | Rep: ${char.reputation}`,
      });
    }

    if (user.isPrisoned && user.prisonEnd) {
      embed.addFields({ name: "🔒 Status", value: `In Prison until <t:${Math.floor(user.prisonEnd.getTime() / 1000)}:R>` });
    }

    embed.setFooter({ text: `Member since: ${new Date(user.joinedAt).toLocaleDateString()}` }).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};

function buildXpBar(current: number, needed: number): string {
  const filled = Math.round((current / needed) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}
