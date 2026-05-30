import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import User from "../../models/User.js";
import { getOrCreateUser, calculateXpForLevel } from "../../utils/helpers.js";
import { Colors } from "../../utils/embeds.js";

export default {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View your level rank or the server leaderboard")
    .addSubcommand((s) => s.setName("me").setDescription("View your rank card"))
    .addSubcommand((s) => s.setName("top").setDescription("View the server level leaderboard")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "me") {
      const user = await getOrCreateUser(interaction.user.id, interaction.guildId!);
      const xpNeeded = calculateXpForLevel(user.level);
      const allUsers = await User.find({ guildId: interaction.guildId }).sort({ level: -1, xp: -1 });
      const rank = allUsers.findIndex((u) => u.userId === interaction.user.id) + 1;
      const bar = buildXpBar(user.xp, xpNeeded);

      const embed = new EmbedBuilder()
        .setColor(Colors.gold)
        .setTitle(`📊 ${interaction.user.displayName}'s Rank`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: "🏆 Server Rank", value: `#${rank}`, inline: true },
          { name: "⭐ Level", value: `${user.level}`, inline: true },
          { name: "✨ XP", value: `${user.xp} / ${xpNeeded}`, inline: true },
          { name: "📊 Progress", value: bar, inline: false },
          { name: "💬 Text XP", value: `${user.textXp}`, inline: true },
          { name: "🎙️ Voice XP", value: `${user.voiceXp}`, inline: true },
          { name: "📨 Total Messages", value: `${user.totalMessages.toLocaleString()}`, inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "top") {
      const top = await User.find({ guildId: interaction.guildId }).sort({ level: -1, xp: -1 }).limit(10);
      const embed = new EmbedBuilder()
        .setColor(Colors.gold)
        .setTitle("🏆 Level Leaderboard")
        .setDescription("Top 10 members by level");

      const medals = ["🥇", "🥈", "🥉"];
      top.forEach((u, i) => {
        const xpNeeded = calculateXpForLevel(u.level);
        embed.addFields({
          name: `${medals[i] ?? `#${i + 1}`} <@${u.userId}>`,
          value: `Level **${u.level}** | XP: ${u.xp}/${xpNeeded}`,
        });
      });

      return interaction.reply({ embeds: [embed] });
    }
  },
};

function buildXpBar(current: number, needed: number): string {
  const filled = Math.round((current / needed) * 10);
  return "`" + "█".repeat(filled) + "░".repeat(10 - filled) + "`";
}
