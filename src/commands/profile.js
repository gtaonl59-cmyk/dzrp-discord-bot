import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getUser, createUser, LEVELS, JOBS, calcLevel } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("عرض بطاقة RP الخاصة بك أو بعضو آخر")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو (اختياري)").setRequired(false)
    ),

  prefix: "profile",

  async execute(interaction, _client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);
    const embed = buildProfile(target, member);
    await interaction.editReply({ embeds: [embed] });
  },

  async executePrefix(message, args, _client) {
    const target = message.mentions.users.first() || message.author;
    const member = await message.guild?.members.fetch(target.id).catch(() => null);
    const embed = buildProfile(target, member);
    await message.reply({ embeds: [embed] });
  },
};

function buildProfile(user, member) {
  let dbUser = getUser(user.id);
  if (!dbUser) dbUser = createUser(user.id, user.username);

  const level = dbUser.level || 1;
  const xp = dbUser.xp || 0;
  const job = dbUser.job || "مدني";
  const jobData = JOBS[job] || JOBS["مدني"];

  const currentLevelData = LEVELS.find((l) => l.level === level) || LEVELS[0];
  const nextLevelData = LEVELS.find((l) => l.level === level + 1);

  const xpBar = buildXpBar(xp, currentLevelData.xp, nextLevelData?.xp ?? xp);
  const verifiedStr = dbUser.verified ? `✅ \`${dbUser.psn}\`` : "❌ غير موثق";

  const joinedAt = member?.joinedAt
    ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:D>`
    : "—";

  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`🪪 بطاقة RP — ${user.username}`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "🎮 PSN",           value: verifiedStr,                                 inline: true },
      { name: `${jobData.emoji} الوظيفة`, value: `**${job}**`,                       inline: true },
      { name: "📊 المستوى",       value: `**${level}** — ${currentLevelData.name}`,  inline: true },
      {
        name: `✨ XP — ${xp.toLocaleString()} / ${nextLevelData ? nextLevelData.xp.toLocaleString() : "MAX"}`,
        value: xpBar,
        inline: false,
      },
      { name: "💰 الرصيد",        value: `**${dbUser.balance.toLocaleString()} $**`, inline: true },
      { name: "📈 إجمالي المكسب",  value: `${(dbUser.total_earned || 0).toLocaleString()} $`, inline: true },
      { name: "📉 إجمالي الخسارة", value: `${(dbUser.total_lost || 0).toLocaleString()} $`,   inline: true },
      { name: "📅 تاريخ الانضمام", value: joinedAt,                                 inline: true },
    )
    .setFooter({ text: "DzRP Profile System" })
    .setTimestamp();
}

function buildXpBar(current, min, max) {
  if (max <= min) return "▓▓▓▓▓▓▓▓▓▓ MAX";
  const pct = Math.min(1, (current - min) / (max - min));
  const filled = Math.round(pct * 10);
  const empty = 10 - filled;
  return `${"▓".repeat(filled)}${"░".repeat(empty)} ${Math.round(pct * 100)}%`;
}
