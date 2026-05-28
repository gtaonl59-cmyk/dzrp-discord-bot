import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getUser, createUser } from "../database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("عرض معلومات لاعب")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("العضو (اختياري)").setRequired(false)
    ),

  prefix: "userinfo",

  async execute(interaction, _client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    const embed = await buildUserInfo(target, member);
    await interaction.editReply({ embeds: [embed] });
  },

  async executePrefix(message, args, _client) {
    const mentioned = message.mentions.users.first();
    const target = mentioned || message.author;
    const member = await message.guild.members.fetch(target.id).catch(() => null);
    const embed = await buildUserInfo(target, member);
    await message.reply({ embeds: [embed] });
  },
};

async function buildUserInfo(user, member) {
  let dbUser = getUser(user.id);
  if (!dbUser) dbUser = createUser(user.id, user.username);

  const verifiedStr = dbUser.verified
    ? `✅ موثق — 🎮 \`${dbUser.psn}\``
    : "❌ غير موثق";

  const roles = member
    ? member.roles.cache
        .filter((r) => r.name !== "@everyone")
        .map((r) => `<@&${r.id}>`)
        .join(", ") || "لا توجد رتب"
    : "—";

  return new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle(`📋 معلومات اللاعب`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "👤 الاسم", value: `<@${user.id}>`, inline: true },
      { name: "🪪 ID", value: `\`${user.id}\``, inline: true },
      { name: "🎮 التحقق", value: verifiedStr, inline: false },
      { name: "💰 الرصيد", value: `**${dbUser.balance.toLocaleString()} $**`, inline: true },
      {
        name: "📅 تاريخ الانضمام",
        value: member
          ? `<t:${Math.floor(member.joinedAt?.getTime() / 1000)}:D>`
          : "—",
        inline: true,
      },
      { name: "🏷️ الرتب", value: roles, inline: false }
    )
    .setFooter({ text: `DzRP • ${new Date().toLocaleDateString("ar-DZ")}` })
    .setTimestamp();
}
