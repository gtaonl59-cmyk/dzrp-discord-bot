import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { LEVELS, getTopXpUsers } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ranks")
    .setDescription("عرض جدول الرتب والـ XP المطلوب 🏆"),

  prefix: "ranks",

  async execute(interaction, _client) {
    const embed = buildRanks();
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },

  async executePrefix(message, _args, _client) {
    const embed = buildRanks();
    await message.reply({ embeds: [embed] });
  },
};

function buildRanks() {
  const ranksText = LEVELS.map((l) => {
    const next = LEVELS.find((x) => x.level === l.level + 1);
    const range = next ? `${l.xp.toLocaleString()} — ${next.xp.toLocaleString()} XP` : `${l.xp.toLocaleString()}+ XP`;
    return `**المستوى ${l.level}** — ${l.name}\n> ${range}`;
  }).join("\n\n");

  const topUsers = getTopXpUsers(5);
  const topText = topUsers.length
    ? topUsers
        .map((u, i) => {
          const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
          return `${medals[i]} <@${u.discord_id}> — **Lvl ${u.level}** | ${u.xp.toLocaleString()} XP`;
        })
        .join("\n")
    : "لا يوجد لاعبون بعد.";

  return new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle("📊 جدول الرتب — DzRP")
    .addFields(
      { name: "🎖️ الرتب والـ XP المطلوب", value: ranksText, inline: false },
      { name: "🏆 أعلى اللاعبين XP", value: topText, inline: false },
    )
    .setFooter({ text: "XP تكسب من: Daily • Work • Rob • المشاركة" })
    .setTimestamp();
}
