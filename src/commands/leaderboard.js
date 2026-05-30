import {
  SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags
} from "discord.js";
import { getTopUsers, getTopXpUsers } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("عرض قائمة المتصدرين 🏆")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("نوع الترتيب")
        .setRequired(false)
        .addChoices(
          { name: "💰 أغنى اللاعبين", value: "money" },
          { name: "✨ أعلى XP",        value: "xp" }
        )
    ),

  prefix: "leaderboard",

  async execute(interaction, _client) {
    const type = interaction.options.getString("type") || "money";
    const embed = buildLeaderboard(type);
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },

  async executePrefix(message, args, _client) {
    const type = args[0] === "xp" ? "xp" : "money";
    const embed = buildLeaderboard(type);
    await message.reply({ embeds: [embed] });
  },
};

function buildLeaderboard(type) {
  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

  if (type === "xp") {
    const users = getTopXpUsers(10);
    const description = users.length === 0
      ? "لا يوجد لاعبون بعد."
      : users.map((u, i) =>
          `${medals[i]} <@${u.discord_id}> — **Lvl ${u.level}** | ✨ ${u.xp.toLocaleString()} XP`
        ).join("\n");

    return new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("✨ قائمة أعلى XP — DzRP")
      .setDescription(description)
      .setFooter({ text: "DzRP XP Leaderboard" })
      .setTimestamp();
  }

  const users = getTopUsers(10);
  const description = users.length === 0
    ? "لا يوجد لاعبون بعد."
    : users.map((u, i) => {
        const psn = u.psn ? `🎮 \`${u.psn}\`` : "";
        return `${medals[i]} <@${u.discord_id}> ${psn} — 💰 **${u.balance.toLocaleString()} $** | Lvl ${u.level}`;
      }).join("\n");

  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("💰 قائمة أغنى اللاعبين — DzRP")
    .setDescription(description)
    .setFooter({ text: "DzRP Economy Leaderboard" })
    .setTimestamp();
}
